import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getBuzzerRoom,
  joinBuzzerRoom,
  leaveBuzzerRoom,
  subscribeBuzzerChannel,
  sendBuzzerEvent,
  unsubscribeBuzzer,
} from '@qwizzeria/supabase-client/src/buzzer.js';
import SEO from '../components/SEO';
import '../styles/Buzzer.css';

/**
 * Participant buzzer page.
 * States: loading → joining → waiting → ready → buzzed → result → closed
 */
export default function BuzzerPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [phase, setPhase] = useState('loading'); // loading | joining | waiting | ready | buzzed | result | spectating | closed | error
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [buzzResult, setBuzzResult] = useState(null); // { winnerId, winnerName, buzzes }
  const [isAllowed, setIsAllowed] = useState(false); // whether current user can buzz this round

  const channelRef = useRef(null);
  const questionReceivedRef = useRef(null); // timestamp when question_open was received
  const hasBuzzedRef = useRef(false);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Player';

  // Join room on mount
  useEffect(() => {
    if (!user || !roomCode) return;

    let cancelled = false;

    async function join() {
      try {
        const roomData = await getBuzzerRoom(roomCode.toUpperCase());
        if (cancelled) return;

        setRoom(roomData);
        // Join as participant
        await joinBuzzerRoom(roomData.id, user.id, displayName);
        if (cancelled) return;

        setPhase('waiting');
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setPhase('error');
        }
      }
    }

    join();

    return () => { cancelled = true; };
  }, [user, roomCode, displayName]);

  // Subscribe to broadcast channel
  useEffect(() => {
    if (!room || !user) return;

    const channel = subscribeBuzzerChannel(room.room_code, {
      onQuestionOpen: ({ allowedUserIds }) => {
        questionReceivedRef.current = Date.now();
        hasBuzzedRef.current = false;
        setBuzzResult(null);

        const allowed = !allowedUserIds || allowedUserIds.includes(user.id);
        setIsAllowed(allowed);
        setPhase(allowed ? 'ready' : 'spectating');
      },

      onBuzzResult: (result) => {
        setBuzzResult(result);
        setPhase('result');
      },

      onBuzzLock: () => {
        setPhase(prev => prev === 'ready' ? 'waiting' : prev);
      },

      onBuzzReset: () => {
        hasBuzzedRef.current = false;
        setBuzzResult(null);
        setPhase('waiting');
      },

      onRoomClosed: () => {
        setPhase('closed');
      },

    });

    channelRef.current = channel;

    // Announce join
    sendBuzzerEvent(channel, 'participant_joined', {
      userId: user.id,
      displayName,
    });

    return () => {
      // Announce leave
      if (channelRef.current) {
        sendBuzzerEvent(channelRef.current, 'participant_left', {
          userId: user.id,
        });
      }
      unsubscribeBuzzer(channel);
      channelRef.current = null;
    };
  }, [room, user, displayName]);

  // Clean up participant on unmount
  useEffect(() => {
    return () => {
      if (room && user) {
        leaveBuzzerRoom(room.id, user.id).catch(() => {});
      }
    };
  }, [room, user]);

  const handleBuzz = useCallback(() => {
    if (hasBuzzedRef.current || !channelRef.current || !isAllowed) return;

    hasBuzzedRef.current = true;
    const buzzOffset = questionReceivedRef.current
      ? Date.now() - questionReceivedRef.current
      : 0;

    sendBuzzerEvent(channelRef.current, 'buzz', {
      userId: user.id,
      displayName,
      buzzOffset,
    });

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    setPhase('buzzed');
  }, [user, displayName, isAllowed]);

  // --- LOADING ---
  if (phase === 'loading') {
    return (
      <div className="buzzer-page">
        <SEO title="Buzzer" path={`/buzz/${roomCode}`} noIndex />
        <div className="buzzer-page__center">
          <div className="buzzer-page__spinner" />
          <p className="buzzer-page__status-text">Joining room {roomCode}...</p>
        </div>
      </div>
    );
  }

  // --- ERROR ---
  if (phase === 'error') {
    return (
      <div className="buzzer-page">
        <SEO title="Buzzer" path={`/buzz/${roomCode}`} noIndex />
        <div className="buzzer-page__center">
          <h2 className="buzzer-page__title">Room Not Found</h2>
          <p className="buzzer-page__error-text">{error || 'This room may have been closed.'}</p>
          <button className="buzzer-page__btn buzzer-page__btn--back" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- CLOSED ---
  if (phase === 'closed') {
    return (
      <div className="buzzer-page">
        <SEO title="Buzzer" path={`/buzz/${roomCode}`} noIndex />
        <div className="buzzer-page__center">
          <h2 className="buzzer-page__title">Room Closed</h2>
          <p className="buzzer-page__status-text">The host has ended this session.</p>
          <button className="buzzer-page__btn buzzer-page__btn--back" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isWinner = buzzResult?.winnerId === user?.id;

  return (
    <div className="buzzer-page">
      <SEO title="Buzzer" path={`/buzz/${roomCode}`} noIndex />

      {/* Header */}
      <div className="buzzer-page__header">
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="buzzer-page__logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
        <div className="buzzer-page__room-info">
          <span className="buzzer-page__room-code">{roomCode}</span>
          <span className="buzzer-page__player-name">{displayName}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="buzzer-page__body">
        {/* WAITING */}
        {phase === 'waiting' && (
          <div className="buzzer-page__center">
            <div className="buzzer-btn buzzer-btn--waiting" aria-disabled="true">
              <span className="buzzer-btn__label">WAITING</span>
            </div>
            <p className="buzzer-page__status-text">Waiting for the host to open the buzzer...</p>
          </div>
        )}

        {/* READY — buzzer active */}
        {phase === 'ready' && (
          <div className="buzzer-page__center">
            <button
              className="buzzer-btn buzzer-btn--ready"
              onClick={handleBuzz}
              aria-label="Press buzzer"
            >
              <span className="buzzer-btn__label">BUZZ!</span>
            </button>
            <p className="buzzer-page__status-text">Tap to buzz in!</p>
          </div>
        )}

        {/* BUZZED — waiting for result */}
        {phase === 'buzzed' && (
          <div className="buzzer-page__center">
            <div className="buzzer-btn buzzer-btn--buzzed">
              <span className="buzzer-btn__label">BUZZED!</span>
            </div>
            <p className="buzzer-page__status-text">Waiting for results...</p>
          </div>
        )}

        {/* SPECTATING — not in this match */}
        {phase === 'spectating' && (
          <div className="buzzer-page__center">
            <div className="buzzer-btn buzzer-btn--spectating" aria-disabled="true">
              <span className="buzzer-btn__label">SPECTATING</span>
            </div>
            <p className="buzzer-page__status-text">Watching this round — your match is coming up!</p>
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && buzzResult && (
          <div className="buzzer-page__center">
            <div className={`buzzer-btn ${isWinner ? 'buzzer-btn--won' : 'buzzer-btn--lost'}`}>
              <span className="buzzer-btn__label">
                {isWinner ? 'FIRST!' : buzzResult.winnerName || 'Too slow!'}
              </span>
            </div>
            <p className="buzzer-page__status-text">
              {isWinner
                ? 'You buzzed first!'
                : `${buzzResult.winnerName} buzzed first`
              }
            </p>
            {buzzResult.buzzes && buzzResult.buzzes.length > 0 && (
              <div className="buzzer-page__results-list">
                {buzzResult.buzzes.map((b, i) => (
                  <div
                    key={b.userId}
                    className={`buzzer-page__result-row ${b.userId === user?.id ? 'buzzer-page__result-row--self' : ''}`}
                  >
                    <span className="buzzer-page__result-rank">#{i + 1}</span>
                    <span className="buzzer-page__result-name">{b.displayName}</span>
                    <span className="buzzer-page__result-time">{b.buzzOffset}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
