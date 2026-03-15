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

// ─── Error classification ──────────────────────────────────────────────────────

/** Translate a raw join error into a user-facing message with retry guidance. */
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

/** Retry an async fn with exponential back-off. Does not retry permanent errors. */
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

// ─── BuzzerPage ───────────────────────────────────────────────────────────────

/**
 * Participant buzzer page.
 *
 * State machine (driven by host broadcast events):
 *   loading → waiting → ready ⇄ buzzed → result → waiting (reset) → ... → closed
 *   loading → waiting → input_ready → ... → waiting (input_reset) → ... → closed
 *
 * Lifecycle contract:
 *  ① DB join   — runs once on mount; manual retry only re-runs if it failed.
 *               Once the participant row exists in buzzer_participants the room
 *               ID is stored in roomRef and never re-inserted.
 *  ② Channel   — created once when `joined` becomes true; NEVER torn down on
 *               phase changes (reset, result, etc.). It persists until unmount.
 *  ③ Leave     — leaveBuzzerRoom() fires ONLY on component unmount (browser
 *               close / navigate away). NOT on host reset.
 */
export default function BuzzerPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // `joined` is a one-way flag: false → true, never resets.
  // It triggers channel subscription exactly once after a successful DB join.
  const [joined, setJoined] = useState(false);

  // phase drives the UI only; never drives connection logic
  const [phase, setPhase] = useState('loading');
  const [errorInfo, setErrorInfo] = useState(null);
  const [buzzResult, setBuzzResult] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | connected | disconnected

  // Input mode state
  const [myResponses, setMyResponses] = useState({}); // {questionId: text}
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [inputText, setInputText] = useState('');
  const [inputLocked, setInputLocked] = useState(false);
  const [viewingQuestionId, setViewingQuestionId] = useState(null);
  const [questionHistory, setQuestionHistory] = useState([]); // [{id, text}]
  const [savedFlash, setSavedFlash] = useState(false);

  // Timer sync state
  const [timerLeft, setTimerLeft] = useState(null);

  // Score publish state
  const [scoreOverlay, setScoreOverlay] = useState(null); // [{name, score, rank}] or null
  const scoreOverlayTimerRef = useRef(null);

  // Stable refs — never cause re-renders, survive all phase changes
  const roomRef = useRef(null);             // set once on successful join
  const channelRef = useRef(null);          // set once after joined=true
  const hasBuzzedRef = useRef(false);       // reset per round by onBuzzReset / onQuestionOpen
  const isAllowedRef = useRef(false);       // set by onQuestionOpen, cleared by onBuzzReset
  const questionOpenedAtRef = useRef(null); // timestamp for buzz-offset calc
  const myResponsesRef = useRef({});        // mutable ref for responses in callbacks

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Player';

  // ── ① DB JOIN ───────────────────────────────────────────────────────────────
  // Runs on mount and on manual retry (retryCount). Skips if already joined.
  useEffect(() => {
    if (!user || !roomCode) return;
    // If we already have a participant row, skip the DB work entirely.
    // The channel is already live; the user is still in the room.
    if (joined) return;

    let cancelled = false;

    async function join() {
      setPhase('loading');
      setErrorInfo(null);

      try {
        const roomData = await withRetry(() =>
          getBuzzerRoom(roomCode.toUpperCase())
        );
        if (cancelled) return;

        // Store room in a ref — stable reference, no re-render side-effects
        roomRef.current = roomData;

        // Safe insert-or-fetch (see buzzer.js joinBuzzerRoom for details)
        await withRetry(() =>
          joinBuzzerRoom(roomData.id, user.id, displayName)
        );
        if (cancelled) return;

        // Signal that we are in the room. Channel effect will fire exactly once.
        setJoined(true);
        setPhase('waiting');

      } catch (err) {
        if (!cancelled) {
          setErrorInfo(classifyJoinError(err));
          setPhase('error');
        }
      }
    }

    join();
    return () => { cancelled = true; };
  }, [user, roomCode, displayName, retryCount, joined]);

  // ── ② CHANNEL SUBSCRIPTION ──────────────────────────────────────────────────
  // Runs exactly once: when `joined` flips from false → true.
  // The channel stays alive through every phase change (ready, buzzed, result,
  // waiting-after-reset). It is NOT recreated on reset.
  useEffect(() => {
    if (!joined || !user || !roomRef.current) return;
    // Guard: only create once. (joined never goes false again, but be safe.)
    if (channelRef.current) return;

    const room = roomRef.current;

    const channel = subscribeBuzzerChannel(room.room_code, {

      // Host opened buzzer → everyone who is allowed can buzz this round
      onQuestionOpen: ({ allowedUserIds }) => {
        questionOpenedAtRef.current = Date.now();
        hasBuzzedRef.current = false;

        const allowed = !allowedUserIds || allowedUserIds.includes(user.id);
        isAllowedRef.current = allowed;

        setBuzzResult(null);
        setPhase(allowed ? 'ready' : 'spectating');
      },

      // Host announced the round winner
      onBuzzResult: (result) => {
        setBuzzResult(result);
        setPhase('result');
      },

      // Host locked buzzer without announcing winner yet
      onBuzzLock: () => {
        setPhase(prev => (prev === 'ready' ? 'waiting' : prev));
      },

      // Host reset — clear state, return to waiting. User stays in room.
      onBuzzReset: () => {
        hasBuzzedRef.current = false;
        isAllowedRef.current = false; // will be re-set when next question_open arrives
        setBuzzResult(null);
        setPhase('waiting');
      },

      // ── Input mode handlers ──

      onInputOpen: ({ questionId, questionText, allowedUserIds }) => {
        setCurrentQuestionId(questionId);
        setCurrentQuestionText(questionText || '');
        setViewingQuestionId(questionId);
        setInputLocked(false);

        // Add to question history if new
        setQuestionHistory(prev => {
          if (prev.some(q => q.id === questionId)) return prev;
          return [...prev, { id: questionId, text: questionText || '' }];
        });

        // Pre-fill if already answered this question
        setInputText(myResponsesRef.current[questionId] || '');

        const allowed = !allowedUserIds || allowedUserIds.includes(user.id);
        isAllowedRef.current = allowed;
        setPhase(allowed ? 'input_ready' : 'spectating');
      },

      onInputLock: () => {
        setInputLocked(true);
        setTimerLeft(null);
      },

      onInputReset: () => {
        myResponsesRef.current = {};
        setMyResponses({});
        setCurrentQuestionId(null);
        setCurrentQuestionText('');
        setInputText('');
        setInputLocked(false);
        setViewingQuestionId(null);
        setQuestionHistory([]);
        isAllowedRef.current = false;
        setTimerLeft(null);
        setPhase('waiting');
      },

      // Timer sync from host
      onTimerSync: ({ timeLeft }) => {
        setTimerLeft(timeLeft);
      },

      // Score publish from host
      onScorePublish: ({ rankings }) => {
        setScoreOverlay(rankings);
      },

      // Host closed the room entirely
      onRoomClosed: () => {
        setConnectionStatus('disconnected');
        setPhase('closed');
      },

      // Channel connection status
      onStatusChange: (status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
        }
      },
    });

    channelRef.current = channel;

    // Announce arrival so the host's participant list updates
    sendBuzzerEvent(channel, 'participant_joined', {
      userId: user.id,
      displayName,
    });

    // No return/cleanup here — channel must survive all phase changes.
    // Real cleanup is in the unmount effect below.
  }, [joined, user, displayName]);

  // ── ③ UNMOUNT CLEANUP ────────────────────────────────────────────────────────
  // Empty dependency array [] → fires ONLY when the component truly unmounts
  // (browser tab close, user navigates away). NOT triggered by reset or phase changes.
  useEffect(() => {
    return () => {
      const ch = channelRef.current;
      const room = roomRef.current;
      const uid = user?.id;

      if (ch) {
        sendBuzzerEvent(ch, 'participant_left', { userId: uid });
        unsubscribeBuzzer(ch);
        channelRef.current = null;
      }

      if (room && uid) {
        leaveBuzzerRoom(room.id, uid).catch(() => { });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — must only run on unmount

  // ── ④ ROOM HEALTH CHECK ────────────────────────────────────────────────────
  // Polls room status to catch missed room_closed broadcasts.
  useEffect(() => {
    if (!joined || !roomRef.current) return;
    let cancelled = false;
    let intervalId = null;

    async function checkRoom() {
      try {
        await getBuzzerRoom(roomRef.current.room_code);
      } catch {
        if (cancelled) return;
        setConnectionStatus('disconnected');
        setPhase((prev) => (prev !== 'error' ? 'closed' : prev));
        if (intervalId) clearInterval(intervalId);
      }
    }

    checkRoom();
    intervalId = setInterval(checkRoom, 10000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [joined]);

  // ── SCORE OVERLAY AUTO-DISMISS ──────────────────────────────────────────────
  useEffect(() => {
    if (!scoreOverlay) return;
    if (scoreOverlayTimerRef.current) clearTimeout(scoreOverlayTimerRef.current);
    scoreOverlayTimerRef.current = setTimeout(() => {
      setScoreOverlay(null);
      scoreOverlayTimerRef.current = null;
    }, 5000);
    return () => {
      if (scoreOverlayTimerRef.current) clearTimeout(scoreOverlayTimerRef.current);
    };
  }, [scoreOverlay]);

  // ── BUZZ HANDLER ─────────────────────────────────────────────────────────────
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

    setPhase('buzzed');
  }, [user, displayName]);

  // ── INPUT HANDLERS ───────────────────────────────────────────────────────────
  const handleSubmitResponse = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || !channelRef.current || !viewingQuestionId) return;

    sendBuzzerEvent(channelRef.current, 'response', {
      userId: user.id,
      displayName,
      text: trimmed,
      questionId: viewingQuestionId,
    });

    myResponsesRef.current = { ...myResponsesRef.current, [viewingQuestionId]: trimmed };
    setMyResponses(prev => ({ ...prev, [viewingQuestionId]: trimmed }));

    // Show saved flash
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }, [inputText, viewingQuestionId, user, displayName]);

  const handleViewQuestion = useCallback((questionId) => {
    setViewingQuestionId(questionId);
    setInputText(myResponsesRef.current[questionId] || '');
  }, []);

  // ── RENDER ───────────────────────────────────────────────────────────────────

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

  if (phase === 'error') {
    const info = errorInfo || { title: 'Something went wrong', detail: 'Please try again.', canRetry: true };
    return (
      <div className="buzzer-page">
        <SEO title="Buzzer" path={`/buzz/${roomCode}`} noIndex />
        <div className="buzzer-page__center">
          <h2 className="buzzer-page__title">{info.title}</h2>
          <p className="buzzer-page__error-text">{info.detail}</p>
          <div className="buzzer-page__error-actions">
            {info.canRetry && (
              <button
                className="buzzer-page__btn buzzer-page__btn--retry"
                onClick={() => setRetryCount(c => c + 1)}
              >
                Try Again
              </button>
            )}
            <button
              className="buzzer-page__btn buzzer-page__btn--back"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'closed') {
    return (
      <div className="buzzer-page">
        <SEO title="Buzzer" path={`/buzz/${roomCode}`} noIndex />
        <div className="buzzer-page__center">
          <div className="buzzer-page__closed-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="buzzer-page__title">Room Closed</h2>
          <p className="buzzer-page__status-text">The host has ended this session. You can close this tab.</p>
          <button
            className="buzzer-page__btn buzzer-page__btn--back"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isWinner = buzzResult?.winnerId === user?.id;
  const hasExistingAnswer = viewingQuestionId && myResponses[viewingQuestionId];
  const isViewingCurrent = viewingQuestionId === currentQuestionId;

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
          <div className="buzzer-page__room-code-row">
            <span
              className={`buzzer-page__status-dot buzzer-page__status-dot--${connectionStatus}`}
              title={connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'disconnected' ? 'Disconnected' : 'Connecting...'}
            />
            <span className="buzzer-page__room-code">{roomCode}</span>
          </div>
          <span className="buzzer-page__player-name">{displayName}</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="buzzer-page__body">

        {/* WAITING — host hasn't opened buzzer yet */}
        {phase === 'waiting' && (
          <div className="buzzer-page__center">
            <div className="buzzer-btn buzzer-btn--waiting" aria-disabled="true">
              <span className="buzzer-btn__label">WAITING</span>
            </div>
            <p className="buzzer-page__status-text">
              Waiting for the host to open the buzzer...
            </p>
          </div>
        )}

        {/* READY — host opened buzzer, tap to compete */}
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

        {/* BUZZED — sent buzz, waiting for host to announce result */}
        {phase === 'buzzed' && (
          <div className="buzzer-page__center">
            <div className="buzzer-btn buzzer-btn--buzzed">
              <span className="buzzer-btn__label">BUZZED!</span>
            </div>
            <p className="buzzer-page__status-text">Waiting for results...</p>
          </div>
        )}

        {/* SPECTATING — not eligible this round (tournament mode) */}
        {phase === 'spectating' && (
          <div className="buzzer-page__center">
            <div className="buzzer-btn buzzer-btn--spectating" aria-disabled="true">
              <span className="buzzer-btn__label">SPECTATING</span>
            </div>
            <p className="buzzer-page__status-text">
              Watching this round — your match is coming up!
            </p>
          </div>
        )}

        {/* RESULT — winner revealed by host */}
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
                : `${buzzResult.winnerName} buzzed first`}
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

        {/* SCORE OVERLAY — shown when host publishes scores */}
        {scoreOverlay && (
          <div
            className="buzzer-page__score-overlay"
            onClick={() => setScoreOverlay(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setScoreOverlay(null); }}
          >
            <div className="buzzer-page__score-overlay-content">
              <h3 className="buzzer-page__score-overlay-title">Leaderboard</h3>
              {scoreOverlay.map((entry, i) => (
                <div
                  key={i}
                  className={`buzzer-page__score-row ${entry.name === displayName ? 'buzzer-page__score-row--self' : ''}`}
                >
                  <span className="buzzer-page__score-rank">#{entry.rank}</span>
                  <span className="buzzer-page__score-name">{entry.name}</span>
                  <span className="buzzer-page__score-pts">{entry.score} pts</span>
                </div>
              ))}
              <p className="buzzer-page__score-dismiss">Tap to dismiss</p>
            </div>
          </div>
        )}

        {/* INPUT_READY — host opened input, type answer */}
        {phase === 'input_ready' && (
          <div className="buzzer-page__center">
            {/* Question header */}
            {currentQuestionText && isViewingCurrent && (
              <div className="buzzer-page__question-header">
                {currentQuestionText}
              </div>
            )}
            {!isViewingCurrent && viewingQuestionId && (
              <div className="buzzer-page__question-header buzzer-page__question-header--past">
                {questionHistory.find(q => q.id === viewingQuestionId)?.text || 'Previous question'}
              </div>
            )}

            {/* Question tabs */}
            {questionHistory.length > 1 && (
              <div className="buzzer-page__question-tabs">
                {questionHistory.map((q, i) => (
                  <button
                    key={q.id}
                    className={`buzzer-page__question-tab ${viewingQuestionId === q.id ? 'buzzer-page__question-tab--active' : ''} ${myResponses[q.id] ? 'buzzer-page__question-tab--answered' : ''}`}
                    onClick={() => handleViewQuestion(q.id)}
                  >
                    Q{i + 1}
                    {myResponses[q.id] && ' \u2713'}
                  </button>
                ))}
              </div>
            )}

            {/* Timer countdown */}
            {timerLeft !== null && (
              <div className={`buzzer-page__timer ${timerLeft <= 10 ? 'buzzer-page__timer--critical' : timerLeft <= 30 ? 'buzzer-page__timer--warning' : 'buzzer-page__timer--running'}`}>
                {String(Math.floor(timerLeft / 60)).padStart(2, '0')}:{String(timerLeft % 60).padStart(2, '0')}
              </div>
            )}

            {/* Textarea */}
            <textarea
              className="buzzer-page__input-field"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={inputLocked ? 'Answers locked' : 'Type your answer...'}
              maxLength={500}
              rows={4}
              disabled={inputLocked}
              autoFocus
            />

            {/* Character count */}
            <div className="buzzer-page__input-meta">
              <span>{inputText.length}/500</span>
            </div>

            {/* Submit / Update button */}
            <button
              className={`buzzer-page__btn ${hasExistingAnswer ? 'buzzer-btn--update' : 'buzzer-btn--submit'}`}
              onClick={handleSubmitResponse}
              disabled={inputLocked || !inputText.trim()}
            >
              {hasExistingAnswer ? 'UPDATE' : 'SUBMIT'}
            </button>

            {/* Status */}
            <p className="buzzer-page__status-text">
              {savedFlash && <span className="buzzer-page__saved-flash">Answer saved!</span>}
              {!savedFlash && inputLocked && 'Answers locked — waiting for host...'}
              {!savedFlash && !inputLocked && !hasExistingAnswer && 'Type your answer'}
              {!savedFlash && !inputLocked && hasExistingAnswer && 'You can update your answer'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
