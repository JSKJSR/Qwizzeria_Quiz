import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchGridQuestions, createQuizSession, recordAttempt, completeQuizSession } from '@qwizzeria/supabase-client/src/questions.js';
import { detectMediaType } from '../utils/mediaDetector';
import TopicGrid from './TopicGrid';
import QuestionView from './QuestionView';
import FreeAnswerView from './FreeAnswerView';
import '../styles/FreeQuiz.css';

function getScoreMessage(score, maxScore) {
  const pct = (score / maxScore) * 100;
  if (pct === 100) return 'Perfect score! You are a quiz master!';
  if (pct >= 80) return 'Excellent! Very impressive knowledge!';
  if (pct >= 60) return 'Great job! Well done!';
  if (pct >= 40) return 'Good effort! Keep learning!';
  return 'Better luck next time! Every quiz makes you smarter.';
}

// Add media info to a question object
function enrichWithMedia(q) {
  const media = q.mediaUrl ? detectMediaType(q.mediaUrl) : { type: 'none', embedUrl: null };
  return { ...q, mediaType: media.type, embedUrl: media.embedUrl };
}

const ACTIONS = {
  LOAD_SUCCESS: 'LOAD_SUCCESS',
  LOAD_ERROR: 'LOAD_ERROR',
  SELECT_QUESTION: 'SELECT_QUESTION',
  BACK_TO_GRID: 'BACK_TO_GRID',
  REVEAL_ANSWER: 'REVEAL_ANSWER',
  ANSWER_QUESTION: 'ANSWER_QUESTION',
  RESET: 'RESET',
};

const initialState = {
  phase: 'loading', // loading | grid | question | answer | results | error
  topics: [],
  allQuestions: [],
  currentQuestion: null,
  completedQuestionIds: [],
  results: [], // { questionId, isCorrect, skipped, points }
  score: 0,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD_SUCCESS:
      return {
        ...initialState,
        phase: 'grid',
        topics: action.topics,
        allQuestions: action.allQuestions,
      };

    case ACTIONS.LOAD_ERROR:
      return { ...initialState, phase: 'error', error: action.error };

    case ACTIONS.SELECT_QUESTION:
      return { ...state, phase: 'question', currentQuestion: action.question };

    case ACTIONS.BACK_TO_GRID:
      return { ...state, phase: 'grid', currentQuestion: null };

    case ACTIONS.REVEAL_ANSWER:
      return { ...state, phase: 'answer' };

    case ACTIONS.ANSWER_QUESTION: {
      const { isCorrect, skipped } = action;
      const q = state.currentQuestion;
      const earnedPoints = isCorrect ? q.points : 0;
      const newResults = [...state.results, {
        questionId: q.id,
        isCorrect,
        skipped,
        points: earnedPoints,
      }];
      const newCompleted = [...state.completedQuestionIds, q.id];
      const newScore = state.score + earnedPoints;
      const allDone = newCompleted.length >= state.allQuestions.length;

      return {
        ...state,
        phase: allDone ? 'results' : 'grid',
        currentQuestion: null,
        completedQuestionIds: newCompleted,
        results: newResults,
        score: newScore,
      };
    }

    case ACTIONS.RESET:
      return { ...initialState };

    default:
      return state;
  }
}

export default function FreeQuiz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const sessionIdRef = useRef(null);
  const questionStartRef = useRef(null);

  const loadQuiz = useCallback(async () => {
    dispatch({ type: ACTIONS.RESET });
    try {
      const { topics, allQuestions } = await fetchGridQuestions();

      // Enrich all questions with media info
      const enrichedTopics = topics.map(t => ({
        ...t,
        questions: t.questions.map(enrichWithMedia),
      }));
      const enrichedAll = allQuestions.map(enrichWithMedia);

      dispatch({ type: ACTIONS.LOAD_SUCCESS, topics: enrichedTopics, allQuestions: enrichedAll });

      // Create session (non-critical)
      try {
        const session = await createQuizSession({
          userId: user?.id ?? null,
          isFreeQuiz: true,
          totalQuestions: enrichedAll.length,
        });
        sessionIdRef.current = session.id;
      } catch {
        sessionIdRef.current = null;
      }
    } catch (err) {
      dispatch({ type: ACTIONS.LOAD_ERROR, error: err.message });
    }
  }, [user]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const handleSelectQuestion = useCallback((question) => {
    questionStartRef.current = Date.now();
    dispatch({ type: ACTIONS.SELECT_QUESTION, question });
  }, []);

  const handleBackToGrid = useCallback(() => {
    dispatch({ type: ACTIONS.BACK_TO_GRID });
  }, []);

  const handleRevealAnswer = useCallback(() => {
    dispatch({ type: ACTIONS.REVEAL_ANSWER });
  }, []);

  const handleSelfAssess = useCallback((isCorrect, skipped = false) => {
    const q = state.currentQuestion;
    const timeSpentMs = questionStartRef.current ? Date.now() - questionStartRef.current : 0;

    dispatch({ type: ACTIONS.ANSWER_QUESTION, isCorrect, skipped });

    // Record attempt (non-blocking)
    if (sessionIdRef.current) {
      recordAttempt({
        sessionId: sessionIdRef.current,
        questionId: q.id,
        isCorrect,
        timeSpentMs,
        skipped,
      }).catch(() => {});
    }
  }, [state.currentQuestion]);

  // Complete session when results are shown
  useEffect(() => {
    if (state.phase === 'results' && sessionIdRef.current) {
      completeQuizSession(sessionIdRef.current, state.score).catch(() => {});
    }
  }, [state.phase, state.score]);

  const { phase, topics, allQuestions, currentQuestion, completedQuestionIds, results, score, error } = state;
  const totalQuestions = allQuestions.length;
  const maxScore = allQuestions.reduce((sum, q) => sum + q.points, 0);
  const progress = totalQuestions > 0 ? (completedQuestionIds.length / totalQuestions) * 100 : 0;

  // --- LOADING ---
  if (phase === 'loading') {
    return (
      <div className="free-quiz">
        <div className="free-quiz__loading">
          <div className="free-quiz__spinner" />
          <p>Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  // --- ERROR ---
  if (phase === 'error') {
    return (
      <div className="free-quiz">
        <div className="free-quiz__error-state">
          <h2>Oops!</h2>
          <p>{error}</p>
          <button className="free-quiz__retry-btn" onClick={loadQuiz}>
            Try Again
          </button>
          <button className="free-quiz__back-btn" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // --- RESULTS ---
  if (phase === 'results') {
    return (
      <div className="free-quiz">
        <div className="free-quiz__header">
          <img
            src="/qwizzeria-logo.png"
            alt="Qwizzeria"
            className="free-quiz__logo"
            onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
          />
        </div>

        <div className="free-quiz__results">
          <div className="free-quiz__score-display">
            <div className="free-quiz__score-number">{score}/{maxScore}</div>
            <div className="free-quiz__score-label">Points Earned</div>
          </div>

          <p className="free-quiz__score-message">
            {getScoreMessage(score, maxScore)}
          </p>

          <div className="free-quiz__review">
            {allQuestions.map((q) => {
              const r = results.find(res => res.questionId === q.id);
              const status = r?.skipped ? 'skipped' : r?.isCorrect ? 'correct' : 'wrong';
              return (
                <div key={q.id} className={`free-quiz__review-item free-quiz__review-item--${status}`}>
                  <div className="free-quiz__review-header">
                    <span className="free-quiz__review-topic">{q.topic}</span>
                    <span className="free-quiz__review-points">
                      {r?.isCorrect ? `+${q.points}` : '0'} pts
                    </span>
                  </div>
                  <div className="free-quiz__review-question">
                    {q.question}
                  </div>
                  <div className="free-quiz__review-answer">
                    {q.answer}
                  </div>
                  {q.answerExplanation && (
                    <div className="free-quiz__review-explanation">
                      {q.answerExplanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="free-quiz__cta">
            <p className="free-quiz__cta-title">Want more quizzes?</p>
            <div className="free-quiz__cta-buttons">
              <button className="free-quiz__cta-btn free-quiz__cta-btn--primary" onClick={loadQuiz}>
                Play Again
              </button>
              <button
                className="free-quiz__cta-btn free-quiz__cta-btn--secondary"
                onClick={() => navigate('/')}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- QUESTION VIEW ---
  if (phase === 'question' && currentQuestion) {
    return (
      <div className="free-quiz">
        <div className="free-quiz__header">
          <img
            src="/qwizzeria-logo.png"
            alt="Qwizzeria"
            className="free-quiz__logo"
            onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
          />
          <div className="free-quiz__score-bar">Score: {score}</div>
          <button className="free-quiz__back-btn" onClick={handleBackToGrid}>
            Back to Grid
          </button>
        </div>
        <QuestionView
          question={currentQuestion}
          onRevealAnswer={handleRevealAnswer}
          onBack={handleBackToGrid}
        />
      </div>
    );
  }

  // --- ANSWER VIEW ---
  if (phase === 'answer' && currentQuestion) {
    return (
      <div className="free-quiz">
        <div className="free-quiz__header">
          <img
            src="/qwizzeria-logo.png"
            alt="Qwizzeria"
            className="free-quiz__logo"
            onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
          />
          <div className="free-quiz__score-bar">Score: {score}</div>
        </div>
        <FreeAnswerView
          question={currentQuestion}
          onSelfAssess={handleSelfAssess}
          onReturn={handleBackToGrid}
        />
      </div>
    );
  }

  // --- GRID VIEW ---
  return (
    <div className="free-quiz">
      <div className="free-quiz__header">
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="free-quiz__logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
        <div className="free-quiz__score-bar">Score: {score}</div>
        <span className="free-quiz__progress-text">
          {completedQuestionIds.length} / {totalQuestions}
        </span>
        <div className="free-quiz__header-right">
          {user && <span className="free-quiz__user-email">{user.email}</span>}
          <button className="free-quiz__back-btn" onClick={() => navigate('/')}>
            Quit
          </button>
        </div>
      </div>

      <div className="free-quiz__progress-bar">
        <div className="free-quiz__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <TopicGrid
        topics={topics}
        completedQuestionIds={completedQuestionIds}
        onSelectQuestion={handleSelectQuestion}
      />
    </div>
  );
}
