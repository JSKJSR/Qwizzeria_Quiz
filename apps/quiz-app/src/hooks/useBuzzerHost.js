import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createBuzzerRoom,
  closeBuzzerRoom,
  getBuzzerRoom,
  updateBuzzerRoomStatus,
  getBuzzerParticipants,
  subscribeBuzzerChannel,
  sendBuzzerEvent,
  unsubscribeBuzzer,
} from '@qwizzeria/supabase-client/src/buzzer.js';
import { rankBuzzes, determineBuzzWinner, isValidBuzz } from '../utils/buzzerTimestamp';
import { playBuzzSound, playBuzzerOpenSound, playTieSound } from '../utils/buzzerSound';

/**
 * Host-side buzzer hook.
 * Manages room lifecycle, listens for buzz events, and ranks results.
 *
 * @param {object} options
 * @param {string} options.hostUserId - Host's auth user ID
 * @param {'host_quiz'|'tournament_match'} options.sessionType
 * @param {string} [options.sessionRef] - Optional FK to quiz session or tournament
 * @param {boolean} [options.enabled=false] - Whether buzzer is enabled
 * @param {string} [options.restoreRoomCode] - Room code to reconnect to on restore
 * @param {string} [options.restoreRoomId] - Room ID to reconnect to on restore
 * @returns {object} Buzzer host controls
 */
export default function useBuzzerHost({ hostUserId, sessionType, sessionRef, enabled = false, restoreRoomCode = null, restoreRoomId = null }) {
  const [roomCode, setRoomCode] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [buzzes, setBuzzes] = useState([]); // ranked by buzzOffset
  const [buzzResult, setBuzzResult] = useState({ winner: null, isTied: false, tiedBuzzes: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const allowedUserIdsRef = useRef(null);

  const channelRef = useRef(null);
  const buzzesRef = useRef([]); // mutable ref for collecting buzzes in callbacks
  const restoreAttemptedRef = useRef(false);

  // Reconnect to existing room OR create new room when enabled
  useEffect(() => {
    if (!enabled || !hostUserId || roomId) return;

    let cancelled = false;

    async function initRoom() {
      setIsCreating(true);
      try {
        // Try reconnecting to a saved room first (only once)
        if (!restoreAttemptedRef.current && restoreRoomCode && restoreRoomId) {
          restoreAttemptedRef.current = true;
          try {
            const existing = await getBuzzerRoom(restoreRoomCode);
            // Verify the room belongs to this host and is still active
            if (existing && existing.host_user_id === hostUserId) {
              if (!cancelled) {
                setRoomCode(existing.room_code);
                setRoomId(existing.id);
              }
              return;
            }
          } catch {
            // Room not found or closed — fall through to create new
          }
        }
        restoreAttemptedRef.current = true;

        // Create a new room
        const room = await createBuzzerRoom(hostUserId, sessionType, sessionRef);
        if (cancelled) return;
        setRoomCode(room.room_code);
        setRoomId(room.id);
      } catch (err) {
        console.error('useBuzzerHost: Failed to create room:', err);
      } finally {
        if (!cancelled) setIsCreating(false);
      }
    }

    initRoom();

    return () => { cancelled = true; };
  }, [enabled, hostUserId, sessionType, sessionRef, roomId, restoreRoomCode, restoreRoomId]);

  // Subscribe to broadcast channel
  useEffect(() => {
    if (!roomCode || !enabled) return;

    const channel = subscribeBuzzerChannel(roomCode, {
      onBuzz: ({ userId, displayName, buzzOffset }) => {
        // Validate buzz
        if (!isValidBuzz(buzzOffset)) return;

        // Filter by allowed users (tournament match restriction)
        const allowed = allowedUserIdsRef.current;
        if (allowed && !allowed.includes(userId)) return;

        // Deduplicate (one buzz per user per round)
        if (buzzesRef.current.some(b => b.userId === userId)) return;

        // Play sound on first buzz
        if (buzzesRef.current.length === 0) {
          playBuzzSound();
        }

        // Add buzz and rank
        const raw = [...buzzesRef.current, { userId, displayName, buzzOffset }];
        const ranked = rankBuzzes(raw);
        buzzesRef.current = raw;
        setBuzzes(ranked);

        const result = determineBuzzWinner(raw);
        setBuzzResult(result);
        if (result.isTied) playTieSound();
      },

      onParticipantJoined: ({ userId, displayName }) => {
        setParticipants(prev => {
          if (prev.some(p => p.userId === userId)) return prev;
          return [...prev, { userId, displayName }];
        });
      },

      onParticipantLeft: ({ userId }) => {
        setParticipants(prev => prev.filter(p => p.userId !== userId));
      },
    });

    channelRef.current = channel;

    // Set room to active
    if (roomId) {
      updateBuzzerRoomStatus(roomId, 'active').catch(() => {});
    }

    return () => {
      unsubscribeBuzzer(channel);
      channelRef.current = null;
    };
  }, [roomCode, roomId, enabled]);

  // Refresh participants from DB periodically (fallback for missed broadcasts)
  useEffect(() => {
    if (!roomId || !enabled) return;

    async function refresh() {
      try {
        const list = await getBuzzerParticipants(roomId);
        setParticipants(list.map(p => ({
          userId: p.user_id,
          displayName: p.display_name,
        })));
      } catch {
        // Non-critical
      }
    }

    refresh();
    const interval = setInterval(refresh, 10000); // every 10s
    return () => clearInterval(interval);
  }, [roomId, enabled]);

  /**
   * Open buzzer for a question.
   * @param {string[]} [allowedUserIds] - If provided, only these users can buzz (for tournament matches)
   */
  const openBuzzer = useCallback((allowedUserIds = null) => {
    if (!channelRef.current) return;

    // Reset buzzes and store allowed users
    buzzesRef.current = [];
    allowedUserIdsRef.current = allowedUserIds;
    setBuzzes([]);
    setBuzzResult({ winner: null, isTied: false, tiedBuzzes: [] });
    setIsOpen(true);

    playBuzzerOpenSound();

    sendBuzzerEvent(channelRef.current, 'question_open', {
      allowedUserIds,
      hostTimestamp: Date.now(),
    });
  }, []);

  /**
   * Lock buzzer (stop accepting new buzzes).
   */
  const lockBuzzer = useCallback(() => {
    if (!channelRef.current) return;

    setIsOpen(false);
    sendBuzzerEvent(channelRef.current, 'buzz_lock', {});
  }, []);

  /**
   * Announce buzz result and lock.
   * @param {string} winnerId - User ID of the winner
   * @param {string} winnerName - Display name of the winner
   */
  const announceBuzzResult = useCallback((winnerId, winnerName) => {
    if (!channelRef.current) return;

    setIsOpen(false);
    sendBuzzerEvent(channelRef.current, 'buzz_result', {
      winnerId,
      winnerName,
      buzzes: buzzesRef.current.map(b => ({
        userId: b.userId,
        displayName: b.displayName,
        buzzOffset: b.buzzOffset,
      })),
    });
  }, []);

  /**
   * Reset buzzer for next question.
   */
  const resetBuzzer = useCallback(() => {
    if (!channelRef.current) return;

    buzzesRef.current = [];
    allowedUserIdsRef.current = null;
    setBuzzes([]);
    setBuzzResult({ winner: null, isTied: false, tiedBuzzes: [] });
    setIsOpen(false);

    sendBuzzerEvent(channelRef.current, 'buzz_reset', {});
  }, []);

  /**
   * Close the buzzer room entirely.
   */
  const closeRoom = useCallback(() => {
    if (channelRef.current) {
      sendBuzzerEvent(channelRef.current, 'room_closed', {});
    }
    if (roomId) {
      closeBuzzerRoom(roomId).catch(() => {});
    }
    setRoomCode(null);
    setRoomId(null);
    setParticipants([]);
    setBuzzes([]);
    setIsOpen(false);
  }, [roomId]);

  return {
    roomCode,
    roomId,
    participants,
    buzzes,
    buzzResult,
    isOpen,
    isCreating,
    enabled,
    openBuzzer,
    lockBuzzer,
    announceBuzzResult,
    resetBuzzer,
    closeRoom,
  };
}
