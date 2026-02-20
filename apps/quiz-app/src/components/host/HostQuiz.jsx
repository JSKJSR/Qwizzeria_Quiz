import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { detectMediaType } from '../../utils/mediaDetector';
import { saveHostSession, loadHostSession, clearHostSession } from '../../utils/hostSessionPersistence';
import { saveHostQuizSession } from '@qwizzeria/supabase-client/src/questions.js';
import HostPackSelect from './HostPackSelect';
import HostParticipantSetup from './HostParticipantSetup';
import HostTopicGrid from './HostTopicGrid';
import HostScoreboard from './HostScoreboard';
import HostAnswerView from './HostAnswerView';
import HostResultsView from './HostResultsView';
import QuestionView from '../QuestionView';
import '../../styles/HostQuiz.css';

const ACTIONS = {
  SELECT_PACK: 'SELECT_PACK',
  START_QUIZ: 'START_QUIZ',
  SELECT_QUESTION: 'SELECT_QUESTION',
  REVEAL_ANSWER: 'REVEAL_ANSWER',
  AWARD_POINTS: 'AWARD_POINTS',
  NO_POINTS: 'NO_POINTS',
  SKIP_QUESTION: 'SKIP_QUESTION',
  ADJUST_SCORE: 'ADJUST_SCORE',
  END_QUIZ: 'END_QUIZ',
  PLAY_AGAIN: 'PLAY_AGAIN',
  RESET_QUIZ: 'RESET_QUIZ',
  RESTORE_SESSION: 'RESTORE_SESSION',
};

const initialState = {
  phase: 'packSelect', // packSelect | setup | grid | question | answer | results
  pack: null,
  topics: [],
  allQuestions: [],
  participants: [],
  selectedQuestion: null,
  completedQuestionIds: [],
  skippedQuestions: [],
};

/**
 * Build topics from flat question list. Groups by category
 * and assigns ascending point values per category.
 */
function buildTopics(questions) {
  const grouped = {};
  for (const q of questions) {
    const cat = q.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(q);
  }

  const pointLevels = [10, 20, 30, 40, 50];

  return Object.entries(grouped).map(([categoryName, qs]) => ({
    name: categoryName,
    questions: qs.map((q, i) => {
      const media = q.mediaUrl ? detectMediaType(q.mediaUrl) : { type: 'none', embedUrl: null };
      return {
        id: q.id,
        topic: categoryName,
        points: q.points != null ? q.points : (pointLevels[i] || (i + 1) * 10),
        question: q.question_text,
        answer: q.answer_text,
        answerExplanation: q.answer_explanation,
        mediaUrl: q.mediaUrl || q.media_url,
        mediaType: media.type,
        embedUrl: media.embedUrl,
      };
    }),
  }));
}

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SELECT_PACK:
      return {
        ...state,
        phase: 'setup',
        pack: action.pack,
        topics: buildTopics(action.questions),
        allQuestions: action.questions,
      };

    case ACTIONS.START_QUIZ:
      return {
        ...state,
        phase: 'grid',
        participants: action.participants.map(name => ({ name, score: 0 })),
        completedQuestionIds: [],
        skippedQuestions: [],
        selectedQuestion: null,
      };

    case ACTIONS.SELECT_QUESTION:
      return { ...state, phase: 'question', selectedQuestion: action.question };

    case ACTIONS.REVEAL_ANSWER:
      return { ...state, phase: 'answer' };

    case ACTIONS.AWARD_POINTS: {
      const { participantIndex } = action;
      const q = state.selectedQuestion;
      const newParticipants = state.participants.map((p, i) =>
        i === participantIndex ? { ...p, score: p.score + q.points } : p
      );
      return {
        ...state,
        phase: 'grid',
        participants: newParticipants,
        completedQuestionIds: [...state.completedQuestionIds, q.id],
        selectedQuestion: null,
      };
    }

    case ACTIONS.NO_POINTS:
      return {
        ...state,
        phase: 'grid',
        completedQuestionIds: [...state.completedQuestionIds, state.selectedQuestion.id],
        selectedQuestion: null,
      };

    case ACTIONS.SKIP_QUESTION:
      return {
        ...state,
        phase: 'grid',
        completedQuestionIds: [...state.completedQuestionIds, state.selectedQuestion.id],
        skippedQuestions: [...state.skippedQuestions, state.selectedQuestion],
        selectedQuestion: null,
      };

    case ACTIONS.ADJUST_SCORE: {
      const { participantIndex: adjIdx, delta } = action;
      const adjParticipants = state.participants.map((p, i) =>
        i === adjIdx ? { ...p, score: p.score + delta } : p
      );
      return { ...state, participants: adjParticipants };
    }

    case ACTIONS.END_QUIZ:
      return { ...state, phase: 'results' };

    case ACTIONS.PLAY_AGAIN:
      return {
        ...state,
        phase: 'grid',
        participants: state.participants.map(p => ({ ...p, score: 0 })),
        completedQuestionIds: [],
        skippedQuestions: [],
        selectedQuestion: null,
      };

    case ACTIONS.RESET_QUIZ:
      return { ...initialState };

    case ACTIONS.RESTORE_SESSION:
      return {
        ...action.savedState,
      };

    default:
      return state;
  }
}

export default function HostQuiz() {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimerRef = useRef(null);
  const restoredRef = useRef(false);

  // Attempt session restore on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const saved = loadHostSession();
    if (saved && saved.phase !== 'packSelect' && saved.phase !== 'results') {
      const resume = window.confirm('You have an unfinished host quiz session. Resume where you left off?');
      if (resume) {
        dispatch({ type: ACTIONS.RESTORE_SESSION, savedState: saved });
      } else {
        clearHostSession();
      }
    }
  }, []);

  // Debounced session persistence
  useEffect(() => {
    if (state.phase === 'packSelect' || state.phase === 'results') return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveHostSession(state);
    }, 300);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  const handleSelectPack = useCallback((pack, questions) => {
    dispatch({ type: ACTIONS.SELECT_PACK, pack, questions });
  }, []);

  const handleStartQuiz = useCallback((participants) => {
    dispatch({ type: ACTIONS.START_QUIZ, participants });
  }, []);

  const handleChangePack = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_QUIZ });
  }, []);

  const handleSelectQuestion = useCallback((question) => {
    dispatch({ type: ACTIONS.SELECT_QUESTION, question });
  }, []);

  const handleRevealAnswer = useCallback(() => {
    dispatch({ type: ACTIONS.REVEAL_ANSWER });
  }, []);

  const handleBackToGrid = useCallback(() => {
    dispatch({
      type: ACTIONS.NO_POINTS,
    });
  }, []);

  const handleAwardPoints = useCallback((participantIndex) => {
    dispatch({ type: ACTIONS.AWARD_POINTS, participantIndex });
  }, []);

  const handleNoPoints = useCallback(() => {
    dispatch({ type: ACTIONS.NO_POINTS });
  }, []);

  const handleSkipAnswer = useCallback(() => {
    dispatch({ type: ACTIONS.SKIP_QUESTION });
  }, []);

  const handleAdjustScore = useCallback((participantIndex, delta) => {
    dispatch({ type: ACTIONS.ADJUST_SCORE, participantIndex, delta });
  }, []);

  const handleEndQuiz = useCallback(() => {
    if (user?.id && state.pack?.id) {
      saveHostQuizSession({
        userId: user.id,
        packId: state.pack.id,
        participants: state.participants,
        completedQuestionIds: state.completedQuestionIds,
      }).catch(err => console.warn('Failed to save host quiz session:', err));
    }
    dispatch({ type: ACTIONS.END_QUIZ });
    clearHostSession();
  }, [user, state.pack, state.participants, state.completedQuestionIds]);

  const handlePlayAgain = useCallback(() => {
    dispatch({ type: ACTIONS.PLAY_AGAIN });
  }, []);

  const handleNewQuiz = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_QUIZ });
    clearHostSession();
  }, []);

  const { phase, pack, topics, participants, selectedQuestion, completedQuestionIds, skippedQuestions } = state;

  // --- Pack Selection ---
  if (phase === 'packSelect') {
    return (
      <div className="host-quiz">
        <HostPackSelect onSelectPack={handleSelectPack} />
      </div>
    );
  }

  // --- Participant Setup ---
  if (phase === 'setup') {
    const totalQuestions = topics.flatMap(t => t.questions).length;
    return (
      <div className="host-quiz">
        <HostParticipantSetup
          pack={pack}
          questionCount={totalQuestions}
          onStart={handleStartQuiz}
          onChangePack={handleChangePack}
        />
      </div>
    );
  }

  // --- Results ---
  if (phase === 'results') {
    return (
      <div className="host-quiz host-quiz--fullscreen">
        <HostResultsView
          participants={participants}
          skippedQuestions={skippedQuestions}
          onPlayAgain={handlePlayAgain}
          onNewQuiz={handleNewQuiz}
        />
      </div>
    );
  }

  // --- Game screens: grid, question, answer all show scoreboard ---
  return (
    <div className="host-quiz host-quiz--fullscreen">
      <HostScoreboard
        participants={participants}
        onEndQuiz={handleEndQuiz}
        onAdjustScore={handleAdjustScore}
        showEndQuiz={phase === 'grid'}
      />

      {phase === 'grid' && (
        <HostTopicGrid
          topics={topics}
          completedQuestionIds={completedQuestionIds}
          skippedQuestionIds={skippedQuestions.map(q => q.id)}
          onSelectQuestion={handleSelectQuestion}
        />
      )}

      {phase === 'question' && selectedQuestion && (
        <QuestionView
          question={selectedQuestion}
          onRevealAnswer={handleRevealAnswer}
          onBack={handleBackToGrid}
        />
      )}

      {phase === 'answer' && selectedQuestion && (
        <HostAnswerView
          question={selectedQuestion}
          participants={participants}
          onAwardPoints={handleAwardPoints}
          onNoPoints={handleNoPoints}
          onSkipAnswer={handleSkipAnswer}
        />
      )}
    </div>
  );
}
