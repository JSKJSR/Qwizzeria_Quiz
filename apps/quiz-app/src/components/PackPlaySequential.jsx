import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuizSession, recordAttempt, completeQuizSession, abandonQuizSession, updateSessionMetadata } from '@qwizzeria/supabase-client/src/questions.js';
import { incrementPackPlayCount } from '@qwizzeria/supabase-client/src/packs.js';
import { detectMediaType } from '../utils/mediaDetector';
import QuestionView from './QuestionView';
import FreeAnswerView from './FreeAnswerView';
import '../styles/PackPlaySequential.css';

const POINTS_PER_QUESTION = 10;

function getScoreMessage(score, maxScore) {
  const pct = (score / maxScore) * 100;
  if (pct === 100) return 'Perfect score! You are a quiz master!';
  if (pct >= 80) return 'Excellent! Very impressive knowledge!';
  if (pct >= 60) return 'Great job! Well done!';
  if (pct >= 40) return 'Good effort! Keep learning!';
  return 'Better luck next time! Every quiz makes you smarter.';
}

function enrichWithMedia(q) {
  const media = q.media_url ? detectMediaType(q.media_url) : { type: 'none', embedUrl: null };
  return {
    id: q.id,
    topic: q.category || 'General',
    points: POINTS_PER_QUESTION,
    question: q.question_text,
    answer: q.answer_text,
    answerExplanation: q.answer_explanation,
    mediaUrl: q.media_url,
    mediaType: media.type,
    embedUrl: media.embedUrl,
  };
}

const ACTIONS = {
  INIT: 'INIT',
  RESTORE: 'RESTORE',
  REVEAL_ANSWER: 'REVEAL_ANSWER',
  ANSWER_QUESTION: 'ANSWER_QUESTION',
};

const initialState = {
  phase: 'question', // question | answer | results
  questions: [],
  currentIndex: 0,
  results: [],
  score: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.INIT:
      return {
        ...initialState,
        questions: action.questions,
        currentIndex: 0,
      };

    case ACTIONS.RESTORE: {
      const startIndex = action.answeredCount;
      const allDone = startIndex >= action.questions.length;
      return {
        ...initialState,
        questions: action.questions,
        currentIndex: allDone ? action.questions.length - 1 : startIndex,
        score: action.score,
        phase: allDone ? 'results' : 'question',
      };
    }

    case ACTIONS.REVEAL_ANSWER:
      return { ...state, phase: 'answer' };

    case ACTIONS.ANSWER_QUESTION: {
      const { isCorrect, skipped } = action;
      const q = state.questions[state.currentIndex];
      const earnedPoints = isCorrect ? q.points : 0;
      const newResults = [...state.results, { questionId: q.id, isCorrect, skipped, points: earnedPoints }];
      const newScore = state.score + earnedPoints;
      const nextIndex = state.currentIndex + 1;
      const allDone = nextIndex >= state.questions.length;

      return {
        ...state,
        phase: allDone ? 'results' : 'question',
        currentIndex: allDone ? state.currentIndex : nextIndex,
        results: newResults,
        score: newScore,
      };
    }

    default:
      return state;
  }
}

export default function PackPlaySequential({ pack, questions, user, resumeData }) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const sessionIdRef = useRef(null);
  const questionStartRef = useRef(null);

  useEffect(() => {
    const enriched = questions.map(enrichWithMedia);

    if (resumeData?.sessionId) {
      // Resume: skip already-answered questions
      sessionIdRef.current = resumeData.sessionId;
      const answeredCount = resumeData.answeredQuestionIds?.length || 0;
      dispatch({
        type: ACTIONS.RESTORE,
        questions: enriched,
        answeredCount,
        score: resumeData.existingScore || 0,
      });
      questionStartRef.current = Date.now();
      return;
    }

    dispatch({ type: ACTIONS.INIT, questions: enriched });

    // Start timer for first question
    questionStartRef.current = Date.now();

    // Create session (non-critical)
    if (user?.id) {
      createQuizSession({
        userId: user.id,
        isFreeQuiz: false,
        totalQuestions: enriched.length,
        quizPackId: pack.id,
      })
        .then((session) => {
          sessionIdRef.current = session.id;
          // Save metadata for resume (non-blocking)
          updateSessionMetadata(session.id, {
            format: 'sequential',
            question_ids: enriched.map(q => q.id),
          }).catch(err => console.warn('PackPlaySequential: Failed to save metadata:', err));
        })
        .catch(err => {
          console.error('PackPlaySequential: Failed to create session:', err);
          sessionIdRef.current = null;
        });
    }

    // Increment play count (non-critical)
    incrementPackPlayCount(pack.id).catch(() => {});
  }, [questions, pack.id, user, resumeData]);

  const handleQuit = useCallback(() => {
    if (sessionIdRef.current) {
      abandonQuizSession(sessionIdRef.current)
        .catch(err => console.warn('PackPlaySequential: Failed to abandon session:', err));
    }
    navigate(`/packs/${pack.id}`);
  }, [navigate, pack.id]);

  const handleRevealAnswer = useCallback(() => {
    dispatch({ type: ACTIONS.REVEAL_ANSWER });
  }, []);

  const handleSelfAssess = useCallback((isCorrect, skipped = false) => {
    const q = state.questions[state.currentIndex];
    const timeSpentMs = questionStartRef.current ? Date.now() - questionStartRef.current : 0;

    dispatch({ type: ACTIONS.ANSWER_QUESTION, isCorrect, skipped });

    // Reset timer for next question
    questionStartRef.current = Date.now();

    if (sessionIdRef.current) {
      recordAttempt({
        sessionId: sessionIdRef.current,
        questionId: q.id,
        isCorrect,
        timeSpentMs,
        skipped,
      }).catch(err => console.warn('PackPlaySequential: Failed to record attempt:', err));
    }
  }, [state.questions, state.currentIndex]);

  useEffect(() => {
    if (state.phase === 'results' && sessionIdRef.current) {
      completeQuizSession(sessionIdRef.current, state.score)
        .catch(err => console.error('PackPlaySequential: Failed to complete session:', err));
    }
  }, [state.phase, state.score]);

  const { phase, questions: allQuestions, currentIndex, results, score } = state;
  const totalQuestions = allQuestions.length;
  const maxScore = totalQuestions * POINTS_PER_QUESTION;
  const progress = totalQuestions > 0 ? (results.length / totalQuestions) * 100 : 0;
  const currentQuestion = allQuestions[currentIndex];

  // Dummy back handler for QuestionView (no grid to go back to)
  const handleBack = useCallback(() => {
    // In sequential mode, do nothing — no grid
  }, []);

  // --- RESULTS ---
  if (phase === 'results') {
    return (
      <div className="seq-play">
        <div className="seq-play__header">
          <img
            src="/qwizzeria-logo.png"
            alt="Qwizzeria"
            className="seq-play__logo"
            onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
          />
        </div>

        <div className="seq-play__results">
          <div className="seq-play__score-display">
            <div className="seq-play__score-number">{score}/{maxScore}</div>
            <div className="seq-play__score-label">Points Earned</div>
          </div>

          <p className="seq-play__score-message">
            {getScoreMessage(score, maxScore)}
          </p>

          <div className="seq-play__review">
            {allQuestions.map((q, i) => {
              const r = results[i];
              const status = r?.skipped ? 'skipped' : r?.isCorrect ? 'correct' : 'wrong';
              return (
                <div key={q.id} className={`seq-play__review-item seq-play__review-item--${status}`}>
                  <div className="seq-play__review-header">
                    <span className="seq-play__review-num">Q{i + 1}</span>
                    <span className="seq-play__review-points">
                      {r?.isCorrect ? `+${q.points}` : '0'} pts
                    </span>
                  </div>
                  <div className="seq-play__review-question">{q.question}</div>
                  <div className="seq-play__review-answer">{q.answer}</div>
                  {q.answerExplanation && (
                    <div className="seq-play__review-explanation">{q.answerExplanation}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="seq-play__cta">
            <div className="seq-play__cta-buttons">
              <button
                className="seq-play__cta-btn seq-play__cta-btn--primary"
                onClick={() => navigate(`/packs/${pack.id}`)}
              >
                Back to Pack
              </button>
              <button
                className="seq-play__cta-btn seq-play__cta-btn--secondary"
                onClick={() => navigate('/packs')}
              >
                Browse More Packs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  // --- ANSWER VIEW ---
  if (phase === 'answer') {
    return (
      <div className="seq-play">
        <div className="seq-play__header">
          <img
            src="/qwizzeria-logo.png"
            alt="Qwizzeria"
            className="seq-play__logo"
            onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
          />
          <div className="seq-play__score-bar">Score: {score}</div>
          <button className="seq-play__quit-btn" onClick={handleQuit}>
            Quit
          </button>
        </div>

        <div className="seq-play__progress">
          <div className="seq-play__progress-bar">
            <div className="seq-play__progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="seq-play__progress-text">
            {results.length}/{totalQuestions}
          </span>
        </div>

        <FreeAnswerView
          question={currentQuestion}
          onSelfAssess={handleSelfAssess}
          onReturn={handleBack}
        />
      </div>
    );
  }

  // --- QUESTION VIEW ---
  return (
    <div className="seq-play">
      <div className="seq-play__header">
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="seq-play__logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
        <div className="seq-play__score-bar">Score: {score}</div>
        <button className="seq-play__quit-btn" onClick={() => navigate(`/packs/${pack.id}`)}>
          Quit
        </button>
      </div>

      <div className="seq-play__progress">
        <div className="seq-play__progress-bar">
          <div className="seq-play__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="seq-play__progress-text">
          {currentIndex + 1}/{totalQuestions}
        </span>
      </div>

      <QuestionView
        question={currentQuestion}
        onRevealAnswer={handleRevealAnswer}
        onBack={handleBack}
      />
    </div>
  );
}
