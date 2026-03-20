import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchGridQuestions, createQuizSession, recordAttempt, completeQuizSession, abandonQuizSession, updateSessionMetadata } from '@qwizzeria/supabase-client';
import { detectMediaType } from '../utils/mediaDetector';
import TopicGrid from './TopicGrid';
import QuestionView from './QuestionView';
import FreeAnswerView from './FreeAnswerView';
import '../styles/FreeQuiz.css';

const BEST_SCORE_KEY = 'qwizzeria_free_best_score';
const PLAY_COUNT_KEY = 'qwizzeria_free_play_count';

const QUESTION_COUNTS = [
  { label: '9', categories: 3, perCategory: 3 },
  { label: '18', categories: 6, perCategory: 3 },
  { label: '27', categories: 9, perCategory: 3 },
];

function getScoreMessage(score, maxScore) {
  const pct = (score / maxScore) * 100;
  if (pct === 100) return 'Perfect score! You are a quiz master!';
  if (pct >= 80) return 'Excellent! Very impressive knowledge!';
  if (pct >= 60) return 'Great job! Well done!';
  if (pct >= 40) return 'Good effort! Keep learning!';
  return 'Better luck next time! Every quiz makes you smarter.';
}

function getBestScore() {
  try {
    const val = localStorage.getItem(BEST_SCORE_KEY);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

function saveBestScore(score, maxScore) {
  try {
    const prev = getBestScore();
    const pct = maxScore > 0 ? score / maxScore : 0;
    if (!prev || pct > prev.pct) {
      localStorage.setItem(BEST_SCORE_KEY, JSON.stringify({ score, maxScore, pct }));
      return true;
    }
    return false;
  } catch { return false; }
}

function getPlayCount() {
  try {
    return parseInt(localStorage.getItem(PLAY_COUNT_KEY) || '0', 10);
  } catch { return 0; }
}

function incrementPlayCount() {
  try {
    const count = getPlayCount() + 1;
    localStorage.setItem(PLAY_COUNT_KEY, String(count));
    return count;
  } catch { return 0; }
}

// Add media info to a question object
function enrichWithMedia(q) {
  const rawMediaUrl = q.media_url || q.mediaUrl;
  const media = rawMediaUrl ? detectMediaType(rawMediaUrl) : { type: 'none', embedUrl: null };
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
  streak: 0,
  bestStreak: 0,
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
      const newStreak = isCorrect ? state.streak + 1 : 0;
      const newBestStreak = Math.max(state.bestStreak, newStreak);
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
        streak: newStreak,
        bestStreak: newBestStreak,
      };
    }

    case ACTIONS.RESET:
      return { ...initialState };

    default:
      return state;
  }
}

export default function FreeQuiz({ resumeData } = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const sessionIdRef = useRef(null);
  const questionStartRef = useRef(null);
  const [scoreBounce, setScoreBounce] = useState(false);
  const [streakFlash, setStreakFlash] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [shareConfirm, setShareConfirm] = useState(false);
  const [questionCount, setQuestionCount] = useState(QUESTION_COUNTS[0]);

  const loadQuiz = useCallback(async (qc) => {
    const config = qc || questionCount;
    dispatch({ type: ACTIONS.RESET });
    try {
      const { topics, allQuestions } = await fetchGridQuestions({
        categoriesCount: config.categories,
        perCategory: config.perCategory,
      });

      // Enrich all questions with media info
      const enrichedTopics = topics.map(t => ({
        ...t,
        questions: t.questions.map(enrichWithMedia),
      }));
      const enrichedAll = allQuestions.map(enrichWithMedia);

      dispatch({ type: ACTIONS.LOAD_SUCCESS, topics: enrichedTopics, allQuestions: enrichedAll });

      // Create session (non-critical)
      if (user?.id) {
        try {
          const session = await createQuizSession({
            userId: user.id,
            isFreeQuiz: true,
            totalQuestions: enrichedAll.length,
          });
          sessionIdRef.current = session.id;

          // Save question IDs to session metadata for resume (non-blocking)
          updateSessionMetadata(session.id, {
            question_ids: enrichedAll.map(q => q.id),
            format: 'jeopardy',
          }).catch(err => console.warn('FreeQuiz: Failed to save metadata:', err));
        } catch (err) {
          console.error('FreeQuiz: Failed to create session:', err);
          sessionIdRef.current = null;
        }
      }
    } catch (err) {
      dispatch({ type: ACTIONS.LOAD_ERROR, error: err.message });
    }
  }, [user, questionCount]);

  useEffect(() => {
    // If resuming, restore state from resumeData
    if (resumeData?.sessionId) {
      sessionIdRef.current = resumeData.sessionId;
      loadQuiz();
      return;
    }
    loadQuiz();
  }, [loadQuiz, resumeData]);

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

    if (isCorrect) {
      setScoreBounce(true);
      setTimeout(() => setScoreBounce(false), 400);
      const nextStreak = state.streak + 1;
      if (nextStreak >= 2) {
        setStreakFlash(nextStreak);
        setTimeout(() => setStreakFlash(0), 1200);
      }
    }

    dispatch({ type: ACTIONS.ANSWER_QUESTION, isCorrect, skipped });

    // Record attempt (non-blocking)
    if (sessionIdRef.current) {
      recordAttempt({
        sessionId: sessionIdRef.current,
        questionId: q.id,
        isCorrect,
        timeSpentMs,
        skipped,
      }).catch(err => console.warn('FreeQuiz: Failed to record attempt:', err));
    }
  }, [state.currentQuestion, state.streak]);

  // Complete session when results are shown
  useEffect(() => {
    if (state.phase === 'results') {
      const max = state.allQuestions.reduce((sum, q) => sum + q.points, 0);
      setIsNewBest(saveBestScore(state.score, max));
      incrementPlayCount();

      if (sessionIdRef.current) {
        completeQuizSession(sessionIdRef.current, state.score)
          .catch(err => console.error('FreeQuiz: Failed to complete session:', err));
      }
    }
  }, [state.phase, state.score, state.allQuestions]);

  const handleQuit = useCallback(() => {
    if (sessionIdRef.current) {
      abandonQuizSession(sessionIdRef.current)
        .catch(err => console.warn('FreeQuiz: Failed to abandon session:', err));
    }
    navigate('/');
  }, [navigate]);

  const handleShareScore = useCallback(() => {
    const max = state.allQuestions.reduce((sum, q) => sum + q.points, 0);
    const pct = max > 0 ? Math.round((state.score / max) * 100) : 0;
    const text = `I scored ${state.score}/${max} (${pct}%) on Qwizzeria! Can you beat me?`;
    if (navigator.share) {
      navigator.share({ title: 'Qwizzeria Quiz Score', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setShareConfirm(true);
        setTimeout(() => setShareConfirm(false), 2000);
      }).catch(() => {});
    }
  }, [state.score, state.allQuestions]);

  const handleQuestionCountChange = useCallback((qc) => {
    setQuestionCount(qc);
    loadQuiz(qc);
  }, [loadQuiz]);

  const { phase, topics, allQuestions, currentQuestion, completedQuestionIds, results, score, streak, bestStreak, error } = state;
  const totalQuestions = allQuestions.length;
  const maxScore = allQuestions.reduce((sum, q) => sum + q.points, 0);
  const progress = totalQuestions > 0 ? (completedQuestionIds.length / totalQuestions) * 100 : 0;
  const bestScoreData = getBestScore();
  const playCount = getPlayCount();
  const correctCount = results.filter(r => r.isCorrect).length;

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
          <button className="free-quiz__retry-btn" onClick={() => loadQuiz()}>
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
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

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
            <div className={`free-quiz__score-number ${isNewBest ? 'free-quiz__score-number--new-best' : ''}`}>
              {score}/{maxScore}
            </div>
            <div className="free-quiz__score-label">Points Earned</div>
            {isNewBest && (
              <div className="free-quiz__new-best">New Personal Best!</div>
            )}
          </div>

          <p className="free-quiz__score-message">
            {getScoreMessage(score, maxScore)}
          </p>

          {/* Stats bar */}
          <div className="free-quiz__stats-bar">
            <div className="free-quiz__stat">
              <span className="free-quiz__stat-value">{correctCount}/{totalQuestions}</span>
              <span className="free-quiz__stat-label">Correct</span>
            </div>
            <div className="free-quiz__stat">
              <span className="free-quiz__stat-value">{pct}%</span>
              <span className="free-quiz__stat-label">Accuracy</span>
            </div>
            <div className="free-quiz__stat">
              <span className="free-quiz__stat-value">{bestStreak}</span>
              <span className="free-quiz__stat-label">Best Streak</span>
            </div>
            {bestScoreData && !isNewBest && (
              <div className="free-quiz__stat">
                <span className="free-quiz__stat-value">{Math.round(bestScoreData.pct * 100)}%</span>
                <span className="free-quiz__stat-label">All-Time Best</span>
              </div>
            )}
          </div>

          {/* Share score */}
          <button className="free-quiz__share-btn" onClick={handleShareScore} aria-label="Share your score">
            {shareConfirm ? 'Copied!' : 'Share Score'}
          </button>

          {/* Leaderboard teaser for logged-out or free users */}
          {!user && (
            <div className="free-quiz__leaderboard-teaser">
              <span className="free-quiz__teaser-text">
                Sign up to see how you rank on the global leaderboard!
              </span>
            </div>
          )}

          {/* Play count nudge for anonymous */}
          {!user && playCount >= 3 && (
            <div className="free-quiz__play-nudge">
              You&apos;ve played {playCount} times! Sign up to track your progress.
            </div>
          )}

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
              <button className="free-quiz__cta-btn free-quiz__cta-btn--primary" onClick={() => loadQuiz()}>
                Play Again
              </button>
              {!user && (
                <button
                  className="free-quiz__cta-btn free-quiz__cta-btn--primary"
                  onClick={() => navigate('/')}
                >
                  Sign Up Free
                </button>
              )}
              <button
                className="free-quiz__cta-btn free-quiz__cta-btn--secondary"
                onClick={() => navigate('/')}
              >
                Back to Home
              </button>
            </div>
          </div>

          <div className="results-watermark">
            <img src="/qwizzeria-logo.png" alt="" className="results-watermark__logo" onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }} />
            <span className="results-watermark__tagline">I learn, therefore I am</span>
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
          <div className={`free-quiz__score-bar ${scoreBounce ? 'free-quiz__score-bar--bounce' : ''}`}>
            Score: {score}
          </div>
          {streak >= 2 && (
            <div className="free-quiz__streak-badge">{streak} streak</div>
          )}
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
          <div className={`free-quiz__score-bar ${scoreBounce ? 'free-quiz__score-bar--bounce' : ''}`}>
            Score: {score}
          </div>
          {streak >= 2 && (
            <div className="free-quiz__streak-badge">{streak} streak</div>
          )}
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
      {!user && (
        <div className="free-quiz__signup-cta">
          <p>Sign up to track scores, unlock packs &amp; compete on leaderboards!</p>
          <button className="free-quiz__signup-btn" onClick={() => navigate('/')}>
            Sign Up Free
          </button>
        </div>
      )}
      <div className="free-quiz__header">
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="free-quiz__logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
        <div className={`free-quiz__score-bar ${scoreBounce ? 'free-quiz__score-bar--bounce' : ''}`}>
          Score: {score}
        </div>
        {streak >= 2 && (
          <div className="free-quiz__streak-badge">{streak} streak</div>
        )}
        <span className="free-quiz__progress-text">
          {completedQuestionIds.length} / {totalQuestions}
        </span>
        <div className="free-quiz__header-right">
          {user && <span className="free-quiz__user-email">{user.email}</span>}
          <button className="free-quiz__back-btn" onClick={handleQuit}>
            Quit
          </button>
        </div>
      </div>

      <div className="free-quiz__progress-bar">
        <div className="free-quiz__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question count selector — only show before any questions answered */}
      {completedQuestionIds.length === 0 && (
        <div className="free-quiz__count-selector">
          <span className="free-quiz__count-label">Questions:</span>
          {QUESTION_COUNTS.map((qc) => (
            <button
              key={qc.label}
              className={`free-quiz__count-btn ${questionCount.label === qc.label ? 'free-quiz__count-btn--active' : ''}`}
              onClick={() => handleQuestionCountChange(qc)}
            >
              {qc.label}
            </button>
          ))}
        </div>
      )}

      {/* Streak flash overlay */}
      {streakFlash > 0 && (
        <div className="free-quiz__streak-flash" aria-live="polite">
          {streakFlash} in a row!
        </div>
      )}

      <TopicGrid
        topics={topics}
        completedQuestionIds={completedQuestionIds}
        onSelectQuestion={handleSelectQuestion}
      />

      <img
        src="/qwizzeria-logo.png"
        alt=""
        aria-hidden="true"
        className="fq-watermark"
      />
    </div>
  );
}
