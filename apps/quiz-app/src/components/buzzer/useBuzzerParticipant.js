import { useEffect, useCallback, useRef, useReducer } from 'react';
import {
  getBuzzerRoom,
  joinBuzzerRoom,
  leaveBuzzerRoom,
  subscribeBuzzerChannel,
  sendBuzzerEvent,
  unsubscribeBuzzer,
} from '@qwizzeria/supabase-client';
import { ACTIONS, INITIAL_STATE, buzzerReducer } from './buzzerReducer';

// ─── Error classification ──────────────────────────────────────────────────────

function classifyJoinError(err) {
  const msg = err?.message || '';
  if (
    msg.includes('row-level security') ||
    msg.includes('violates') ||
    msg.includes('42501')
  ) {
    return {
      type: 'rls',
      title: 'Room Access Denied',
      detail: 'The room is temporarily unavailable. Please wait a moment and try again, or ask the host to reset the buzzer.',
      canRetry: true,
    };
  }
  if (msg.includes('closed') || msg.includes('not found') || msg.includes('no rows')) {
    return {
      type: 'closed',
      title: 'Room Not Found',
      detail: 'This room may have been closed or the code is incorrect.',
      canRetry: false,
    };
  }
  return {
    type: 'unknown',
    title: 'Could Not Join Room',
    detail: 'A connection error occurred. Please check your internet and try again.',
    canRetry: true,
  };
}

async function withRetry(fn, maxAttempts = 3, baseDelayMs = 800) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!classifyJoinError(err).canRetry) throw err;
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, baseDelayMs * attempt));
      }
    }
  }
  throw lastErr;
}

// ─── useBuzzerParticipant Hook ────────────────────────────────────────────────

export function useBuzzerParticipant(user, roomCode) {
  const [state, dispatch] = useReducer(buzzerReducer, INITIAL_STATE);

  // Stable refs
  const roomRef = useRef(null);
  const channelRef = useRef(null);
  const hasBuzzedRef = useRef(false);
  const isAllowedRef = useRef(false);
  const questionOpenedAtRef = useRef(null);
  const myResponsesRef = useRef({});
  const scoreOverlayTimerRef = useRef(null);

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Player';

  // Actions
  const handleBuzz = useCallback(() => {
    if (hasBuzzedRef.current) return;
    if (!isAllowedRef.current) return;
    if (!channelRef.current) return;

    hasBuzzedRef.current = true;
    const buzzOffset = questionOpenedAtRef.current
      ? Date.now() - questionOpenedAtRef.current
      : 0;

    sendBuzzerEvent(channelRef.current, 'buzz', {
      userId: user.id,
      displayName,
      buzzOffset,
    });

    if (navigator.vibrate) navigator.vibrate(100);
    dispatch({ type: ACTIONS.SET_PHASE, payload: 'buzzed' });
  }, [user, displayName]);

  const handleSubmitResponse = useCallback(() => {
    const trimmed = state.inputText.trim();
    if (!trimmed || !channelRef.current || !state.viewingQuestionId) return;

    sendBuzzerEvent(channelRef.current, 'response', {
      userId: user.id,
      displayName,
      text: trimmed,
      questionId: state.viewingQuestionId,
    });

    myResponsesRef.current = { ...myResponsesRef.current, [state.viewingQuestionId]: trimmed };
    dispatch({ type: ACTIONS.SET_MY_RESPONSES, payload: { [state.viewingQuestionId]: trimmed } });

    dispatch({ type: ACTIONS.SET_SAVED_FLASH, payload: true });
    setTimeout(() => dispatch({ type: ACTIONS.SET_SAVED_FLASH, payload: false }), 1500);
  }, [state.inputText, state.viewingQuestionId, user, displayName]);

  const handleViewQuestion = useCallback((questionId) => {
    dispatch({ type: ACTIONS.SET_VIEWING_QUESTION_ID, payload: questionId });
    dispatch({ type: ACTIONS.SET_INPUT_TEXT, payload: myResponsesRef.current[questionId] || '' });
  }, []);

  const handleRetry = useCallback(() => {
    dispatch({ type: ACTIONS.INCREMENT_RETRY_COUNT });
  }, []);

  const dismissScoreOverlay = useCallback(() => {
    dispatch({ type: ACTIONS.SET_SCORE_OVERLAY, payload: null });
  }, []);

  const setInputText = useCallback((text) => {
    dispatch({ type: ACTIONS.SET_INPUT_TEXT, payload: text });
  }, []);

  // ① DB JOIN
  useEffect(() => {
    if (!user || !roomCode || state.joined) return;
    let cancelled = false;

    async function join() {
      dispatch({ type: ACTIONS.SET_PHASE, payload: 'loading' });
      dispatch({ type: ACTIONS.SET_ERROR_INFO, payload: null });

      try {
        const roomData = await withRetry(() => getBuzzerRoom(roomCode.toUpperCase()));
        if (cancelled) return;

        roomRef.current = roomData;
        await withRetry(() => joinBuzzerRoom(roomData.id, user.id, displayName));
        if (cancelled) return;

        dispatch({ type: ACTIONS.SET_JOINED, payload: true });
        dispatch({ type: ACTIONS.SET_PHASE, payload: 'waiting' });
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: ACTIONS.SET_ERROR_INFO, payload: classifyJoinError(err) });
          dispatch({ type: ACTIONS.SET_PHASE, payload: 'error' });
        }
      }
    }

    join();
    return () => { cancelled = true; };
  }, [user, roomCode, displayName, state.retryCount, state.joined]);

  // ② CHANNEL SUBSCRIPTION
  useEffect(() => {
    if (!state.joined || !user || !roomRef.current) return;
    if (channelRef.current) return;

    const room = roomRef.current;
    const channel = subscribeBuzzerChannel(room.room_code, {
      onQuestionOpen: ({ allowedUserIds }) => {
        questionOpenedAtRef.current = Date.now();
        hasBuzzedRef.current = false;
        const allowed = !allowedUserIds || allowedUserIds.includes(user.id);
        isAllowedRef.current = allowed;
        dispatch({ type: ACTIONS.OPEN_QUESTION, payload: { phase: allowed ? 'ready' : 'spectating' } });
      },
      onBuzzResult: (result) => {
        dispatch({ type: ACTIONS.SET_BUZZ_RESULT, payload: result });
        dispatch({ type: ACTIONS.SET_PHASE, payload: 'result' });
      },
      onBuzzLock: () => {
        dispatch({ type: ACTIONS.SET_PHASE, payload: state.phase === 'ready' ? 'waiting' : state.phase });
      },
      onBuzzReset: () => {
        hasBuzzedRef.current = false;
        isAllowedRef.current = false;
        dispatch({ type: ACTIONS.RESET_BUZZE });
      },
      onInputOpen: ({ questionId, questionText, allowedUserIds }) => {
        const allowed = !allowedUserIds || allowedUserIds.includes(user.id);
        isAllowedRef.current = allowed;
        if (allowed) {
          // Pre-fill text for current question
          dispatch({ type: ACTIONS.SET_INPUT_TEXT, payload: myResponsesRef.current[questionId] || '' });
        }
        dispatch({ type: ACTIONS.OPEN_INPUT, payload: { 
          questionId, 
          questionText, 
          phase: allowed ? 'input_ready' : 'spectating' 
        } });
      },
      onInputLock: () => {
        dispatch({ type: ACTIONS.SET_INPUT_LOCKED, payload: true });
        dispatch({ type: ACTIONS.SET_TIMER_LEFT, payload: null });
      },
      onInputReset: () => {
        myResponsesRef.current = {};
        isAllowedRef.current = false;
        dispatch({ type: ACTIONS.RESET_INPUT });
      },
      onTimerSync: ({ timeLeft }) => {
        dispatch({ type: ACTIONS.SET_TIMER_LEFT, payload: timeLeft });
      },
      onScorePublish: ({ rankings }) => {
        dispatch({ type: ACTIONS.SET_SCORE_OVERLAY, payload: rankings });
      },
      onRoomClosed: () => {
        dispatch({ type: ACTIONS.ROOM_CLOSED });
      },
      onStatusChange: (status) => {
        if (status === 'SUBSCRIBED') {
          dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'connected' });
        } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'disconnected' });
        }
      },
    });

    channelRef.current = channel;
    sendBuzzerEvent(channel, 'participant_joined', { userId: user.id, displayName });
  }, [state.joined, user, displayName, state.phase]);

  // ③ UNMOUNT CLEANUP
  useEffect(() => {
    return () => {
      const ch = channelRef.current;
      const room = roomRef.current;
      const uid = user?.id;
      if (ch) {
        sendBuzzerEvent(ch, 'participant_left', { userId: uid });
        unsubscribeBuzzer(ch);
      }
      if (room && uid) {
        leaveBuzzerRoom(room.id, uid).catch(() => {});
      }
    };
  }, [user?.id]);

  // ④ ROOM HEALTH CHECK
  useEffect(() => {
    if (!state.joined || !roomRef.current) return;
    let cancelled = false;
    async function checkRoom() {
      try {
        await getBuzzerRoom(roomRef.current.room_code);
      } catch {
        if (cancelled) return;
        dispatch({ type: ACTIONS.ROOM_CLOSED });
      }
    }
    const intervalId = setInterval(checkRoom, 10000);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [state.joined]);

  // ⑤ SCORE OVERLAY AUTO-DISMISS
  useEffect(() => {
    if (!state.scoreOverlay) return;
    if (scoreOverlayTimerRef.current) clearTimeout(scoreOverlayTimerRef.current);
    scoreOverlayTimerRef.current = setTimeout(() => {
      dispatch({ type: ACTIONS.SET_SCORE_OVERLAY, payload: null });
    }, 5000);
    return () => { if (scoreOverlayTimerRef.current) clearTimeout(scoreOverlayTimerRef.current); };
  }, [state.scoreOverlay]);

  return {
    ...state,
    displayName,
    handleBuzz,
    handleSubmitResponse,
    handleViewQuestion,
    handleRetry,
    dismissScoreOverlay,
    setInputText,
  };
}
