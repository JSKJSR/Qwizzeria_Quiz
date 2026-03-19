import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchPackPlayQuestions,
  createQuizSession,
  updateSessionMetadata,
  completeQuizSession,
} from '@qwizzeria/supabase-client';
import { reducer, initialState, ACTIONS } from './doublesReducer';
import {
  saveDoublesSession,
  loadDoublesSession,
  clearDoublesSession,
} from '@/utils/doublesSessionPersistence';
import DoublesEventSelect from './DoublesEventSelect';
import DoublesPlayerSetup from './DoublesPlayerSetup';
import DoublesRules from './DoublesRules';
import DoublesPartView from './DoublesPartView';
import DoublesReviewView from './DoublesReviewView';
import DoublesResultsView from './DoublesResultsView';
import '@/styles/DoublesQuiz.css';

export default function DoublesQuiz() {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimerRef = useRef(null);
  const dbSyncRef = useRef(null);
  const restoredRef = useRef(false);

  // Restore session on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const saved = loadDoublesSession();
    if (saved && saved.phase && saved.phase !== 'select' && saved.phase !== 'results') {
      // Remove savedAt before restoring
      const rest = { ...saved };
      delete rest.savedAt;
      dispatch({ type: ACTIONS.RESTORE_SESSION, payload: rest });
    }
  }, []);

  // Debounced localStorage save (300ms)
  useEffect(() => {
    if (state.phase === 'select' || state.phase === 'results') return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDoublesSession(state);
    }, 300);

    return () => clearTimeout(saveTimerRef.current);
  }, [state]);

  // Periodic DB sync every 30s during active parts
  useEffect(() => {
    const isActive = state.phase === 'part1' || state.phase === 'part2';
    if (!isActive) return;

    dbSyncRef.current = setInterval(() => {
      const sessionId = state.phase === 'part1' ? state.part1SessionId : state.part2SessionId;
      if (sessionId) {
        updateSessionMetadata(sessionId, {
          format: 'doubles',
          part: state.phase === 'part1' ? 1 : 2,
          player_name: state.playerName,
          responses: state.responses,
          timer_started_at: state.timerStartedAt,
          timer_duration_seconds: state.timerMinutes * 60,
        }).catch(() => {});
      }
    }, 30000);

    return () => clearInterval(dbSyncRef.current);
  }, [state.phase, state.part1SessionId, state.part2SessionId, state.playerName, state.responses, state.timerStartedAt, state.timerMinutes]);

  // Create DB session for a part
  const createPartSession = useCallback(async (partNumber) => {
    if (!user?.id) return;

    try {
      const questions = partNumber === 1 ? state.part1Questions : state.part2Questions;
      const session = await createQuizSession({
        userId: user.id,
        isFreeQuiz: false,
        totalQuestions: questions.length,
        quizPackId: state.pack.id,
      });

      dispatch({
        type: ACTIONS.SET_SESSION_ID,
        payload: { part: partNumber, sessionId: session.id },
      });

      await updateSessionMetadata(session.id, {
        format: 'doubles',
        part: partNumber,
        player_name: state.playerName,
        responses: {},
        timer_started_at: new Date().toISOString(),
        timer_duration_seconds: state.timerMinutes * 60,
      });
    } catch {
      // Non-blocking — local state is the source of truth
    }
  }, [user, state.pack, state.part1Questions, state.part2Questions, state.playerName, state.timerMinutes]);

  // Save responses to DB on part submit
  const savePartToDb = useCallback(async (partNumber) => {
    const sessionId = partNumber === 1 ? state.part1SessionId : state.part2SessionId;
    if (!sessionId) return;

    try {
      const questions = partNumber === 1 ? state.part1Questions : state.part2Questions;
      const answeredCount = questions.filter(q => state.responses[q.id]?.trim()).length;

      await updateSessionMetadata(sessionId, {
        format: 'doubles',
        part: partNumber,
        player_name: state.playerName,
        responses: state.responses,
        timer_started_at: state.timerStartedAt,
        timer_duration_seconds: state.timerMinutes * 60,
      });

      await completeQuizSession(sessionId, answeredCount);
    } catch {
      // Non-blocking
    }
  }, [state]);

  // Handlers
  const handleSelectPack = useCallback(async (pack) => {
    try {
      const questions = await fetchPackPlayQuestions(pack.id);
      dispatch({
        type: ACTIONS.SELECT_PACK,
        payload: { pack, questions, config: pack.config },
      });
    } catch (err) {
      console.error('Failed to load pack questions:', err);
    }
  }, []);

  const handleSetPlayer = useCallback((name) => {
    dispatch({ type: ACTIONS.SET_PLAYER, payload: name });
  }, []);

  const handleAcceptRules = useCallback(() => {
    dispatch({ type: ACTIONS.ACCEPT_RULES });
    createPartSession(1);
  }, [createPartSession]);

  const handleResponseChange = useCallback((questionId, text) => {
    dispatch({ type: ACTIONS.UPDATE_RESPONSE, payload: { questionId, text } });
  }, []);

  const handleNavigate = useCallback((index) => {
    dispatch({ type: ACTIONS.NAVIGATE_QUESTION, payload: index });
  }, []);

  const handleSubmitPart1 = useCallback(() => {
    dispatch({ type: ACTIONS.SUBMIT_PART });
    savePartToDb(1);
  }, [savePartToDb]);

  const handleTimerExpiredPart1 = useCallback(() => {
    dispatch({ type: ACTIONS.TIMER_EXPIRED });
    savePartToDb(1);
  }, [savePartToDb]);

  const handleStartPart2 = useCallback(() => {
    dispatch({ type: ACTIONS.START_PART2 });
    createPartSession(2);
  }, [createPartSession]);

  const handleSubmitPart2 = useCallback(() => {
    dispatch({ type: ACTIONS.SUBMIT_PART2 });
    savePartToDb(2);
  }, [savePartToDb]);

  const handleTimerExpiredPart2 = useCallback(() => {
    dispatch({ type: ACTIONS.TIMER_EXPIRED_PART2 });
    savePartToDb(2);
  }, [savePartToDb]);

  const handleFinish = useCallback(() => {
    dispatch({ type: ACTIONS.FINISH_QUIZ });
    clearDoublesSession();
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: ACTIONS.RESET });
    clearDoublesSession();
  }, []);

  const handleBackToSelect = useCallback(() => {
    dispatch({ type: ACTIONS.RESET });
  }, []);

  // Render based on phase
  switch (state.phase) {
    case 'select':
      return <DoublesEventSelect onSelect={handleSelectPack} />;

    case 'playerSetup':
      return (
        <DoublesPlayerSetup
          packTitle={state.pack.title}
          onSubmit={handleSetPlayer}
          onBack={handleBackToSelect}
        />
      );

    case 'rules':
      return (
        <DoublesRules
          packTitle={state.pack.title}
          timerMinutes={state.timerMinutes}
          part1Count={state.part1Questions.length}
          part2Count={state.part2Questions.length}
          onAccept={handleAcceptRules}
          onBack={handleBackToSelect}
        />
      );

    case 'part1':
      return (
        <div className="doubles-overlay">
          <DoublesPartView
            partNumber={1}
            questions={state.part1Questions}
            responses={state.responses}
            currentIndex={state.currentIndex}
            timerMinutes={state.timerMinutes}
            timerStartedAt={state.timerStartedAt}
            onResponseChange={handleResponseChange}
            onNavigate={handleNavigate}
            onSubmit={handleSubmitPart1}
            onTimerExpired={handleTimerExpiredPart1}
          />
        </div>
      );

    case 'part1Review':
      return (
        <DoublesReviewView
          partNumber={1}
          questions={state.part1Questions}
          responses={state.responses}
          onContinue={() => dispatch({ type: ACTIONS.GO_TO_BREAK })}
          continueLabel="Continue to Break"
        />
      );

    case 'break':
      return (
        <div className="doubles-break">
          <h2 className="doubles-break__title">Part 1 Complete!</h2>
          <p className="doubles-break__text">Take a breather. When you're ready, start Part 2.</p>
          <p className="doubles-break__info">
            Part 2 has {state.part2Questions.length} questions with a {state.timerMinutes}-minute timer.
          </p>
          <button
            type="button"
            className="doubles-btn doubles-btn--primary doubles-btn--large"
            onClick={handleStartPart2}
          >
            Start Part 2
          </button>
        </div>
      );

    case 'part2':
      return (
        <div className="doubles-overlay">
          <DoublesPartView
            partNumber={2}
            questions={state.part2Questions}
            responses={state.responses}
            currentIndex={state.currentIndex}
            timerMinutes={state.timerMinutes}
            timerStartedAt={state.timerStartedAt}
            onResponseChange={handleResponseChange}
            onNavigate={handleNavigate}
            onSubmit={handleSubmitPart2}
            onTimerExpired={handleTimerExpiredPart2}
          />
        </div>
      );

    case 'part2Review':
      return (
        <DoublesReviewView
          partNumber={2}
          questions={state.part2Questions}
          responses={state.responses}
          onContinue={handleFinish}
          continueLabel="See Results"
        />
      );

    case 'results':
      return (
        <DoublesResultsView
          pack={state.pack}
          playerName={state.playerName}
          part1Questions={state.part1Questions}
          part2Questions={state.part2Questions}
          responses={state.responses}
          onReset={handleReset}
        />
      );

    default:
      return <DoublesEventSelect onSelect={handleSelectPack} />;
  }
}
