import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { fetchGridQuestions, createQuizSession, recordAttempt, completeQuizSession, abandonQuizSession, updateSessionMetadata } from '@qwizzeria/supabase-client';
import { saveBestScore, incrementPlayCount, getXP, addXP, getStreak, saveStreak, getBadges, addBadges, addTotalCorrect } from '@/utils/freeQuizStorage';
import { matchAnswer } from '@/utils/answerMatcher';
import { calculateXP, getLevel, getLevelTitle, getLevelProgress, checkNewBadges, checkDedicatedBadge, updateStreak, SESSION_COMPLETE_XP } from '@/utils/gamification';
import { reducer, initialState, ACTIONS, enrichWithMedia, QUESTION_COUNTS, SECONDS_PER_QUESTION } from './free/freeQuizReducer';
import FreeQuizHeader from './free/FreeQuizHeader';
import FreeQuizResults from './free/FreeQuizResults';
import TopicGrid from './TopicGrid';
import QuestionView from './QuestionView';
import FreeAnswerView from './FreeAnswerView';
import '@/styles/FreeQuiz.css';

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
  // Gamification results state
  const [gamificationData, setGamificationData] = useState(null);

  // --- Data loading ---

  const loadQuiz = useCallback(async (qc) => {
    const config = qc || questionCount;
    dispatch({ type: ACTIONS.RESET });
    setGamificationData(null);
    try {
      const { topics, allQuestions } = await fetchGridQuestions({
        categoriesCount: config.categories,
        perCategory: config.perCategory,
      });

      const enrichedTopics = topics.map(t => ({
        ...t,
        questions: t.questions.map(enrichWithMedia),
      }));
      const enrichedAll = allQuestions.map(enrichWithMedia);

      dispatch({ type: ACTIONS.LOAD_SUCCESS, topics: enrichedTopics, allQuestions: enrichedAll });

      if (user?.id) {
        try {
          const session = await createQuizSession({
            userId: user.id,
            isFreeQuiz: true,
            totalQuestions: enrichedAll.length,
          });
          sessionIdRef.current = session.id;
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
    if (resumeData?.sessionId) {
      sessionIdRef.current = resumeData.sessionId;
    }
    loadQuiz();
  }, [loadQuiz, resumeData]);

  // --- Handlers ---

  const handleSelectQuestion = useCallback((question) => {
    questionStartRef.current = Date.now();
    dispatch({ type: ACTIONS.SELECT_QUESTION, question });
  }, []);

  const handleBackToGrid = useCallback(() => {
    dispatch({ type: ACTIONS.BACK_TO_GRID });
  }, []);

  const getNextUnanswered = useCallback(() => {
    const completedSet = new Set(state.completedQuestionIds);
    if (state.currentQuestion) completedSet.add(state.currentQuestion.id);
    return state.allQuestions.find(q => !completedSet.has(q.id)) || null;
  }, [state.allQuestions, state.completedQuestionIds, state.currentQuestion]);

  const handleSubmitAnswer = useCallback((text) => {
    const q = state.currentQuestion;
    const timeSpentMs = questionStartRef.current ? Date.now() - questionStartRef.current : 0;
    const { isMatch } = matchAnswer(text, q.answer);
    const xpEarned = calculateXP({
      isCorrect: isMatch,
      points: q.points,
      timeSpentMs,
      streak: isMatch ? state.streak : 0,
    });

    if (isMatch) {
      setScoreBounce(true);
      setTimeout(() => setScoreBounce(false), 400);
      const nextStreak = state.streak + 1;
      if (nextStreak >= 2) {
        setStreakFlash(nextStreak);
        setTimeout(() => setStreakFlash(0), 1200);
      }
    }

    dispatch({ type: ACTIONS.SUBMIT_ANSWER, userAnswer: text, isCorrect: isMatch, xpEarned });

    if (sessionIdRef.current) {
      recordAttempt({
        sessionId: sessionIdRef.current,
        questionId: q.id,
        isCorrect: isMatch,
        timeSpentMs,
        skipped: false,
      }).catch(err => console.warn('FreeQuiz: Failed to record attempt:', err));
    }
  }, [state.currentQuestion, state.streak]);

  const handleContinue = useCallback(() => {
    const nextQ = getNextUnanswered();
    questionStartRef.current = Date.now();
    dispatch({ type: ACTIONS.CONTINUE, nextQuestion: nextQ });
  }, [getNextUnanswered]);

  const handleOverrideCorrect = useCallback(() => {
    const q = state.currentQuestion;
    const timeSpentMs = questionStartRef.current ? Date.now() - questionStartRef.current : 0;
    const xpEarned = calculateXP({
      isCorrect: true,
      points: q.points,
      timeSpentMs,
      streak: state.streak,
    });

    setScoreBounce(true);
    setTimeout(() => setScoreBounce(false), 400);
    const nextStreak = state.streak + 1;
    if (nextStreak >= 2) {
      setStreakFlash(nextStreak);
      setTimeout(() => setStreakFlash(0), 1200);
    }

    dispatch({ type: ACTIONS.OVERRIDE_CORRECT, xpEarned });

    if (sessionIdRef.current) {
      recordAttempt({
        sessionId: sessionIdRef.current,
        questionId: q.id,
        isCorrect: true,
        timeSpentMs,
        skipped: false,
      }).catch(err => console.warn('FreeQuiz: Failed to re-record attempt:', err));
    }
  }, [state.currentQuestion, state.streak]);

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

  // Complete session + gamification when results are shown
  useEffect(() => {
    if (state.phase === 'results') {
      const max = state.allQuestions.reduce((sum, q) => sum + q.points, 0);
      setIsNewBest(saveBestScore(state.score, max));
      const playCount = incrementPlayCount();

      // Gamification updates
      const correctCount = state.results.filter(r => r.isCorrect).length;
      const totalSessionXP = state.sessionXP + SESSION_COMPLETE_XP;
      const prevXP = getXP();
      const newTotalXP = addXP(totalSessionXP);
      const prevLevel = getLevel(prevXP);
      const newLevel = getLevel(newTotalXP);
      const leveledUp = newLevel > prevLevel;

      addTotalCorrect(correctCount);

      // Streak
      const currentStreak = getStreak();
      const updatedStreak = updateStreak(currentStreak);
      saveStreak(updatedStreak);

      // Badges
      const existingBadges = getBadges();
      const newBadges = checkNewBadges({
        correctCount,
        totalCount: state.allQuestions.length,
        bestStreak: state.bestStreak,
        playCount,
        level: newLevel,
        existingBadges,
      });
      if (checkDedicatedBadge(updatedStreak.count, existingBadges)) {
        newBadges.push('dedicated');
      }
      if (newBadges.length > 0) addBadges(newBadges);

      setGamificationData({
        sessionXP: totalSessionXP,
        totalXP: newTotalXP,
        level: newLevel,
        levelTitle: getLevelTitle(newLevel),
        levelProgress: getLevelProgress(newTotalXP),
        leveledUp,
        newBadges,
        dailyStreak: updatedStreak,
        playCount,
      });

      if (sessionIdRef.current) {
        completeQuizSession(sessionIdRef.current, state.score)
          .catch(err => console.error('FreeQuiz: Failed to complete session:', err));
      }
    }
  }, [state.phase, state.score, state.allQuestions, state.sessionXP, state.bestStreak, state.results]);

  // --- Render ---

  const { phase, topics, allQuestions, currentQuestion, completedQuestionIds, score, streak, bestStreak, results, error, userAnswer, isCorrect, questionXP } = state;
  const totalQuestions = allQuestions.length;
  const maxScore = allQuestions.reduce((sum, q) => sum + q.points, 0);

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

  if (phase === 'error') {
    return (
      <div className="free-quiz">
        <div className="free-quiz__error-state">
          <h2>Oops!</h2>
          <p>{error}</p>
          <button className="free-quiz__retry-btn" onClick={() => loadQuiz()}>Try Again</button>
          <button className="free-quiz__back-btn" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <FreeQuizResults
        score={score}
        maxScore={maxScore}
        results={results}
        allQuestions={allQuestions}
        bestStreak={bestStreak}
        isNewBest={isNewBest}
        shareConfirm={shareConfirm}
        user={user}
        onShareScore={handleShareScore}
        onPlayAgain={() => loadQuiz()}
        onNavigateHome={() => navigate('/')}
        gamification={gamificationData}
      />
    );
  }

  if (phase === 'question' && currentQuestion) {
    return (
      <div className="free-quiz">
        {streakFlash > 0 && (
          <div className="free-quiz__streak-flash" aria-live="polite">
            {streakFlash} in a row!
          </div>
        )}
        <FreeQuizHeader score={score} streak={streak} scoreBounce={scoreBounce}>
          <button className="free-quiz__back-btn" onClick={handleBackToGrid}>Back to Grid</button>
        </FreeQuizHeader>
        <QuestionView
          question={currentQuestion}
          onSubmitAnswer={handleSubmitAnswer}
          onBack={handleBackToGrid}
          timerSeconds={SECONDS_PER_QUESTION}
          showAnswerInput
        />
      </div>
    );
  }

  if (phase === 'feedback' && currentQuestion) {
    return (
      <div className="free-quiz">
        {streakFlash > 0 && (
          <div className="free-quiz__streak-flash" aria-live="polite">
            {streakFlash} in a row!
          </div>
        )}
        <FreeQuizHeader score={score} streak={streak} scoreBounce={scoreBounce} />
        <FreeAnswerView
          question={currentQuestion}
          isCorrect={isCorrect}
          userAnswer={userAnswer}
          xpEarned={questionXP}
          onContinue={handleContinue}
          onOverride={handleOverrideCorrect}
          onReturn={handleBackToGrid}
        />
      </div>
    );
  }

  // --- Grid view ---
  const progress = totalQuestions > 0 ? (completedQuestionIds.length / totalQuestions) * 100 : 0;

  return (
    <div className="free-quiz">
      {!user && (
        <div className="free-quiz__signup-cta">
          <p>Sign up to track scores, unlock packs &amp; compete on leaderboards!</p>
          <button className="free-quiz__signup-btn" onClick={() => navigate('/')}>Sign Up Free</button>
        </div>
      )}

      <FreeQuizHeader score={score} streak={streak} scoreBounce={scoreBounce}>
        <span className="free-quiz__progress-text">
          {completedQuestionIds.length} / {totalQuestions}
        </span>
        <div className="free-quiz__header-right">
          {user && <span className="free-quiz__user-email">{user.email}</span>}
          <button className="free-quiz__back-btn" onClick={handleQuit}>Quit</button>
        </div>
      </FreeQuizHeader>

      <div className="free-quiz__progress-bar">
        <div className="free-quiz__progress-fill" style={{ width: `${progress}%` }} />
      </div>

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

      <img src="/qwizzeria-logo.png" alt="" aria-hidden="true" className="fq-watermark" />
    </div>
  );
}
