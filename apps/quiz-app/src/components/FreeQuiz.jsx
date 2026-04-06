import { useReducer, useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { fetchGridQuestions, createQuizSession, recordAttempt, updateAttempt, completeQuizSession, abandonQuizSession, updateSessionMetadata, fetchGamificationStats } from '@qwizzeria/supabase-client';
import { saveBestScore, getXP, getStreak, getBadges, getTotalCorrect, getStreakFreezes, applyGamificationState } from '@/utils/freeQuizStorage';
import { matchAnswer } from '@/utils/answerMatcher';
import { calculateXP, getLevel } from '@/utils/gamification';
import { computeGamification, syncGamificationToDB } from '@/utils/computeGamification';
import { reducer, initialState, ACTIONS, enrichWithMedia, QUESTION_COUNTS, TIMER_OPTIONS, SECONDS_PER_QUESTION } from './free/freeQuizReducer';
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
  const isNewBest = useMemo(() => {
    if (state.phase !== 'results') return false;
    const max = state.allQuestions.reduce((sum, q) => sum + q.points, 0);
    return saveBestScore(state.score, max);
  }, [state.phase, state.allQuestions, state.score]);
  const [shareConfirm, setShareConfirm] = useState(false);
  const [questionCount, setQuestionCount] = useState(QUESTION_COUNTS[0]);
  const [timerSetting, setTimerSetting] = useState(SECONDS_PER_QUESTION);
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

  // Read once for header props (not on every render like before)
  const headerLevel = getLevel(getXP());
  const headerDailyStreak = getStreak()?.count || 0;

  const triggerCorrectAnimation = useCallback((nextStreak) => {
    setScoreBounce(true);
    setTimeout(() => setScoreBounce(false), 400);
    if (nextStreak >= 2) {
      setStreakFlash(nextStreak);
      setTimeout(() => setStreakFlash(0), 1200);
    }
  }, []);

  const trackAttempt = useCallback((questionId, isCorrect, timeSpentMs) => {
    if (!sessionIdRef.current) return;
    recordAttempt({ sessionId: sessionIdRef.current, questionId, isCorrect, timeSpentMs, skipped: false })
      .catch(err => console.warn('FreeQuiz: Failed to record attempt:', err));
  }, []);

  // --- Data loading ---

  const fetchQuiz = useCallback(async (config) => {
    try {
      const { topics, allQuestions } = await fetchGridQuestions({
        categoriesCount: config.categories,
        perCategory: config.perCategory,
      });

      const enrichedTopics = topics.map(t => ({ ...t, questions: t.questions.map(enrichWithMedia) }));
      const enrichedAll = allQuestions.map(enrichWithMedia);
      dispatch({ type: ACTIONS.LOAD_SUCCESS, topics: enrichedTopics, allQuestions: enrichedAll });

      if (user?.id) {
        try {
          const session = await createQuizSession({ userId: user.id, isFreeQuiz: true, totalQuestions: enrichedAll.length });
          sessionIdRef.current = session.id;
          updateSessionMetadata(session.id, { question_ids: enrichedAll.map(q => q.id), format: 'jeopardy' })
            .catch(err => console.warn('FreeQuiz: Failed to save metadata:', err));
        } catch (err) {
          console.error('FreeQuiz: Failed to create session:', err);
          sessionIdRef.current = null;
        }
        // Hydrate localStorage from DB (cross-device sync — merge, don't overwrite)
        fetchGamificationStats(user.id).then(db => {
          if (!db) return;
          const localXP = getXP();
          const localBadges = getBadges();
          const localCorrect = getTotalCorrect();
          const localStreak = getStreak();
          const mergedXP = Math.max(db.xp_total || 0, localXP);
          const mergedCorrect = Math.max(db.total_correct || 0, localCorrect);
          const mergedBadges = [...new Set([...localBadges, ...(db.badges || [])])];
          const dbStreakCount = db.daily_streak_count || 0;
          const localStreakCount = localStreak?.count || 0;
          const mergedStreak = dbStreakCount >= localStreakCount
            ? { count: dbStreakCount, lastPlayDate: db.daily_streak_last_play }
            : localStreak || { count: 0, lastPlayDate: null };
          const localFreezes = getStreakFreezes();
          const dbFreezes = db.streak_freezes_remaining || 0;
          const mergedFreezes = Math.max(dbFreezes, localFreezes);
          if (mergedXP > localXP || mergedBadges.length > localBadges.length || mergedCorrect > localCorrect || dbStreakCount > localStreakCount || dbFreezes > localFreezes) {
            applyGamificationState({ xp: mergedXP, streak: mergedStreak, badges: mergedBadges, totalCorrect: mergedCorrect, streakFreezes: mergedFreezes });
          }
        }).catch(() => {});
      }
    } catch (err) {
      dispatch({ type: ACTIONS.LOAD_ERROR, error: err.message });
    }
  }, [user]);

  const loadQuiz = useCallback((qc) => {
    const config = qc || questionCount;
    dispatch({ type: ACTIONS.RESET });
    setMissionCompletions(null);
    fetchQuiz(config);
  }, [questionCount, fetchQuiz]);

  useEffect(() => {
    if (resumeData?.sessionId) sessionIdRef.current = resumeData.sessionId;
    // Initial state is already 'loading' — fetchQuiz handles the async data load
    fetchQuiz(questionCount);
  }, [fetchQuiz, questionCount, resumeData]);

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
    const xpEarned = calculateXP({ isCorrect: isMatch, points: q.points, timeSpentMs, streak: isMatch ? state.streak : 0 });

    if (isMatch) triggerCorrectAnimation(state.streak + 1);

    dispatch({ type: ACTIONS.SUBMIT_ANSWER, userAnswer: text, isCorrect: isMatch, xpEarned });
    trackAttempt(q.id, isMatch, timeSpentMs);
  }, [state.currentQuestion, state.streak, triggerCorrectAnimation, trackAttempt]);

  const handleContinue = useCallback(() => {
    questionStartRef.current = Date.now();
    dispatch({ type: ACTIONS.CONTINUE, nextQuestion: getNextUnanswered() });
  }, [getNextUnanswered]);

  const handleOverrideCorrect = useCallback(() => {
    const q = state.currentQuestion;
    const timeSpentMs = questionStartRef.current ? Date.now() - questionStartRef.current : 0;
    const xpEarned = calculateXP({ isCorrect: true, points: q.points, timeSpentMs, streak: state.streak });

    triggerCorrectAnimation(state.streak + 1);
    dispatch({ type: ACTIONS.OVERRIDE_CORRECT, xpEarned });
    if (sessionIdRef.current) {
      updateAttempt(sessionIdRef.current, q.id, { isCorrect: true })
        .catch(err => console.warn('FreeQuiz: Failed to update attempt:', err));
    }
  }, [state.currentQuestion, state.streak, triggerCorrectAnimation]);

  const handleQuit = useCallback(() => {
    if (sessionIdRef.current) {
      abandonQuizSession(sessionIdRef.current).catch(err => console.warn('FreeQuiz: Failed to abandon session:', err));
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

  // Persist to DB when results phase is reached
  useEffect(() => {
    if (!gamificationData) return;

    if (sessionIdRef.current) {
      completeQuizSession(sessionIdRef.current, state.score)
        .catch(err => console.error('FreeQuiz: Failed to complete session:', err));
    }

    if (user?.id) {
      const correctCount = state.results.filter(r => r.isCorrect).length;
      syncGamificationToDB(user.id, gamificationData, {
        totalQuestions: state.allQuestions.length,
        correctCount,
        bestStreak: state.bestStreak,
        isPackQuiz: false,
      }).then(result => {
        if (result?.newly_completed?.length > 0) setMissionCompletions(result.newly_completed);
      });
    }
  }, [gamificationData, state.score, state.results, state.bestStreak, state.allQuestions, user]);

  // --- Render ---

  const { phase, topics, allQuestions, currentQuestion, completedQuestionIds, score, streak, bestStreak, results, error, userAnswer, isCorrect, questionXP } = state;
  const totalQuestions = allQuestions.length;
  const maxScore = allQuestions.reduce((sum, q) => sum + q.points, 0);

  const streakFlashEl = streakFlash > 0 && (
    <div className="free-quiz__streak-flash" aria-live="polite">{streakFlash} in a row!</div>
  );

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
        missionCompletions={missionCompletions}
      />
    );
  }

  if (phase === 'question' && currentQuestion) {
    return (
      <div className="free-quiz">
        {streakFlashEl}
        <FreeQuizHeader score={score} streak={streak} scoreBounce={scoreBounce} level={headerLevel} dailyStreak={headerDailyStreak}>
          <button className="free-quiz__back-btn" onClick={handleBackToGrid}>Back to Grid</button>
        </FreeQuizHeader>
        <QuestionView
          question={currentQuestion}
          onSubmitAnswer={handleSubmitAnswer}
          onBack={handleBackToGrid}
          timerSeconds={timerSetting}
          showAnswerInput
        />
      </div>
    );
  }

  if (phase === 'feedback' && currentQuestion) {
    return (
      <div className="free-quiz">
        {streakFlashEl}
        <FreeQuizHeader score={score} streak={streak} scoreBounce={scoreBounce} level={headerLevel} dailyStreak={headerDailyStreak} />
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

      <FreeQuizHeader score={score} streak={streak} scoreBounce={scoreBounce} level={headerLevel} dailyStreak={headerDailyStreak}>
        <span className="free-quiz__progress-text">{completedQuestionIds.length} / {totalQuestions}</span>
        <div className="free-quiz__header-right">
          {user && <span className="free-quiz__user-email">{user.email}</span>}
          <button className="free-quiz__back-btn" onClick={handleQuit}>Quit</button>
        </div>
      </FreeQuizHeader>

      <div className="free-quiz__progress-bar">
        <div className="free-quiz__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {completedQuestionIds.length === 0 && (
        <div className="free-quiz__settings-bar">
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
          <div className="free-quiz__count-selector">
            <span className="free-quiz__count-label">Timer:</span>
            {TIMER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`free-quiz__count-btn ${timerSetting === opt.value ? 'free-quiz__count-btn--active' : ''}`}
                onClick={() => setTimerSetting(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {streakFlashEl}

      <TopicGrid
        topics={topics}
        completedQuestionIds={completedQuestionIds}
        onSelectQuestion={handleSelectQuestion}
      />

      <img src="/qwizzeria-logo.png" alt="" aria-hidden="true" className="fq-watermark" />
    </div>
  );
}
