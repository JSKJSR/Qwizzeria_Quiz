import { useReducer, useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuizSession, recordAttempt, completeQuizSession, abandonQuizSession, updateSessionMetadata, incrementPackPlayCount } from '@qwizzeria/supabase-client';
import { getScoreMessage } from '../utils/freeQuizStorage';
import { detectMediaType } from '../utils/mediaDetector';
import { calculateXP } from '../utils/gamification';
import { computeGamification, syncGamificationToDB } from '../utils/computeGamification';
import GamificationSummary from './GamificationSummary';
import TopicGrid from './TopicGrid';
import QuestionView from './QuestionView';
import FreeAnswerView from './FreeAnswerView';
import '../styles/FreeQuiz.css';

function enrichWithMedia(q) {
  const media = q.media_url ? detectMediaType(q.media_url) : { type: 'none', embedUrl: null };
  return { ...q, mediaType: media.type, embedUrl: media.embedUrl };
}

const ACTIONS = {
  INIT: 'INIT',
  RESTORE: 'RESTORE',
  SELECT_QUESTION: 'SELECT_QUESTION',
  BACK_TO_GRID: 'BACK_TO_GRID',
  REVEAL_ANSWER: 'REVEAL_ANSWER',
  ANSWER_QUESTION: 'ANSWER_QUESTION',
};

const initialState = {
  phase: 'grid',
  topics: [],
  allQuestions: [],
  currentQuestion: null,
  completedQuestionIds: [],
  results: [],
  score: 0,
  streak: 0,
  bestStreak: 0,
  sessionXP: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.INIT:
      return {
        ...initialState,
        phase: 'grid',
        topics: action.topics,
        allQuestions: action.allQuestions,
      };

    case ACTIONS.RESTORE: {
      const allDone = action.completedQuestionIds.length >= action.allQuestions.length;
      return {
        ...initialState,
        phase: allDone ? 'results' : 'grid',
        topics: action.topics,
        allQuestions: action.allQuestions,
        completedQuestionIds: action.completedQuestionIds,
        score: action.score,
      };
    }

    case ACTIONS.SELECT_QUESTION:
      return { ...state, phase: 'question', currentQuestion: action.question };

    case ACTIONS.BACK_TO_GRID:
      return { ...state, phase: 'grid', currentQuestion: null };

    case ACTIONS.REVEAL_ANSWER:
      return { ...state, phase: 'answer' };

    case ACTIONS.ANSWER_QUESTION: {
      const { isCorrect, skipped, xpEarned } = action;
      const q = state.currentQuestion;
      const earnedPoints = isCorrect ? q.points : 0;
      const newResults = [...state.results, { questionId: q.id, isCorrect, skipped, points: earnedPoints, xpEarned }];
      const newCompleted = [...state.completedQuestionIds, q.id];
      const newScore = state.score + earnedPoints;
      const allDone = newCompleted.length >= state.allQuestions.length;
      const newStreak = isCorrect && !skipped ? state.streak + 1 : 0;

      return {
        ...state,
        phase: allDone ? 'results' : 'grid',
        currentQuestion: null,
        completedQuestionIds: newCompleted,
        results: newResults,
        score: newScore,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        sessionXP: state.sessionXP + (xpEarned || 0),
      };
    }

    default:
      return state;
  }
}

export default function PackPlayJeopardy({ pack, questions, user, resumeData }) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const sessionIdRef = useRef(null);
  const questionStartRef = useRef(null);
  const gamificationData = useMemo(() => {
    if (state.phase !== 'results') return null;
    return computeGamification({
      results: state.results,
      sessionXP: state.sessionXP,
      totalQuestions: state.allQuestions.length,
      bestStreak: state.bestStreak,
    });
  }, [state.phase, state.results, state.sessionXP, state.allQuestions, state.bestStreak]);
  const [missionCompletions, setMissionCompletions] = useState(null);

  // Build topics (group by category for jeopardy grid)
  useEffect(() => {
    const enriched = questions.map(enrichWithMedia);
    const grouped = {};
    for (const q of enriched) {
      const cat = q.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(q);
    }

    const topicEntries = Object.entries(grouped).slice(0, 6);
    const topics = topicEntries.map(([categoryName, qs]) => ({
      name: categoryName,
      questions: qs.map((q, i) => ({
        id: q.id,
        topic: q.display_title || categoryName,
        points: q.points != null ? q.points : ((i + 1) * 10),
        question: q.question_text,
        answer: q.answer_text,
        answerExplanation: q.answer_explanation,
        mediaUrl: q.media_url,
        mediaType: q.mediaType,
        embedUrl: q.embedUrl,
      })),
    }));

    const allQuestions = topics.flatMap(t => t.questions);

    if (resumeData?.sessionId) {
      sessionIdRef.current = resumeData.sessionId;
      dispatch({
        type: ACTIONS.RESTORE,
        topics,
        allQuestions,
        completedQuestionIds: resumeData.answeredQuestionIds || [],
        score: resumeData.existingScore || 0,
      });
      return;
    }

    dispatch({ type: ACTIONS.INIT, topics, allQuestions });

    if (user?.id) {
      createQuizSession({
        userId: user.id,
        isFreeQuiz: false,
        totalQuestions: allQuestions.length,
        quizPackId: pack.id,
      })
        .then((session) => {
          sessionIdRef.current = session.id;
          updateSessionMetadata(session.id, {
            format: 'jeopardy',
            question_ids: allQuestions.map(q => q.id),
          }).catch(() => {});
        })
        .catch(() => { sessionIdRef.current = null; });
    }

    incrementPackPlayCount(pack.id).catch(() => {});
  }, [questions, pack.id, user, resumeData]);

  const handleQuit = useCallback(() => {
    if (sessionIdRef.current) {
      abandonQuizSession(sessionIdRef.current).catch(() => {});
    }
    navigate(`/packs/${pack.id}`);
  }, [navigate, pack.id]);

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
    const xpEarned = calculateXP({ isCorrect: isCorrect && !skipped, points: q.points, timeSpentMs, streak: isCorrect ? state.streak : 0 });

    dispatch({ type: ACTIONS.ANSWER_QUESTION, isCorrect, skipped, xpEarned });

    if (sessionIdRef.current) {
      recordAttempt({
        sessionId: sessionIdRef.current,
        questionId: q.id,
        isCorrect,
        timeSpentMs,
        skipped,
      }).catch(() => {});
    }
  }, [state.currentQuestion, state.streak]);

  // Persist to DB when results phase is reached
  useEffect(() => {
    if (!gamificationData) return;

    if (sessionIdRef.current) {
      completeQuizSession(sessionIdRef.current, state.score).catch(() => {});
    }

    if (user?.id) {
      const correctCount = state.results.filter(r => r.isCorrect).length;
      syncGamificationToDB(user.id, gamificationData, {
        totalQuestions: state.allQuestions.length,
        correctCount,
        bestStreak: state.bestStreak,
        isPackQuiz: true,
      }).then(result => {
        if (result?.newly_completed?.length > 0) setMissionCompletions(result.newly_completed);
      });
    }
  }, [gamificationData, state.score, state.results, state.bestStreak, state.allQuestions, user]);

  const { phase, topics, allQuestions, currentQuestion, completedQuestionIds, results, score } = state;
  const totalQuestions = allQuestions.length;
  const maxScore = allQuestions.reduce((sum, q) => sum + q.points, 0);
  const progress = totalQuestions > 0 ? (completedQuestionIds.length / totalQuestions) * 100 : 0;

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

          <GamificationSummary data={gamificationData} missionCompletions={missionCompletions} />

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
                  <div className="free-quiz__review-question">{q.question}</div>
                  <div className="free-quiz__review-answer">{q.answer}</div>
                  {q.answerExplanation && (
                    <div className="free-quiz__review-explanation">{q.answerExplanation}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="free-quiz__cta">
            <div className="free-quiz__cta-buttons">
              <button
                className="free-quiz__cta-btn free-quiz__cta-btn--primary"
                onClick={() => navigate(`/packs/${pack.id}`)}
              >
                Back to Pack
              </button>
              <button
                className="free-quiz__cta-btn free-quiz__cta-btn--secondary"
                onClick={() => navigate('/packs')}
              >
                Browse More Packs
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
          <button className="free-quiz__back-btn" onClick={handleQuit}>
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
