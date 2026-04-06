/**
 * Shared gamification computation + DB sync for quiz completion.
 * Used by FreeQuiz, PackPlayJeopardy, and PackPlaySequential.
 */
import { getXP, addXP, getStreak, saveStreak, getBadges, addBadges, getTotalCorrect, addTotalCorrect, incrementPlayCount, getStreakFreezes, decrementStreakFreezes } from './freeQuizStorage';
import { getLevel, getLevelTitle, getLevelProgress, checkNewBadges, updateStreak, SESSION_COMPLETE_XP } from './gamification';
import { saveGamificationStats, updateMissionProgress, addWeeklyLeagueXP, useStreakFreeze as consumeStreakFreeze } from '@qwizzeria/supabase-client';

/**
 * Compute gamification results after quiz completion.
 * Mutates localStorage as a side effect (XP, streak, badges, play count).
 * Auto-detects streak freeze availability from localStorage.
 *
 * @param {Object} opts
 * @param {Array} opts.results - Array of { isCorrect, ... }
 * @param {number} opts.sessionXP - XP earned during session (before completion bonus)
 * @param {number} opts.totalQuestions - Total number of questions in the quiz
 * @param {number} opts.bestStreak - Best consecutive correct streak in the session
 * @returns {Object} gamification data for display
 */
export function computeGamification({ results, sessionXP, totalQuestions, bestStreak }) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalSessionXP = sessionXP + SESSION_COMPLETE_XP;
  const prevXP = getXP();
  const newTotalXP = addXP(totalSessionXP);
  const prevLevel = getLevel(prevXP);
  const newLevel = getLevel(newTotalXP);

  addTotalCorrect(correctCount);

  const currentStreak = getStreak();
  const hasFreeze = getStreakFreezes() > 0;
  const updatedStreak = updateStreak(currentStreak, { hasFreeze });
  saveStreak(updatedStreak);

  // Decrement freeze locally if used
  if (updatedStreak.frozeUsed) {
    decrementStreakFreezes();
  }

  const existingBadges = getBadges();
  const playCount = incrementPlayCount();
  const newBadges = checkNewBadges({
    correctCount,
    totalCount: totalQuestions,
    bestStreak,
    playCount,
    level: newLevel,
    dailyStreakCount: updatedStreak.count,
    existingBadges,
  });
  if (newBadges.length > 0) addBadges(newBadges);

  return {
    sessionXP: totalSessionXP,
    totalXP: newTotalXP,
    level: newLevel,
    levelTitle: getLevelTitle(newLevel),
    levelProgress: getLevelProgress(newTotalXP),
    leveledUp: newLevel > prevLevel,
    newBadges,
    dailyStreak: updatedStreak,
    streakFrozeUsed: updatedStreak.frozeUsed || false,
    playCount,
  };
}

/**
 * Sync all gamification data to DB after quiz completion.
 * Calls are sequenced: saveGamificationStats first, then updateMissionProgress
 * (which awards additive XP), then addWeeklyLeagueXP. This prevents the
 * absolute XP write from clobbering mission-awarded XP.
 *
 * If a streak freeze was used, decrements it in the DB.
 *
 * @param {string} userId
 * @param {Object} gamData - return value from computeGamification()
 * @param {Object} quizInfo - { totalQuestions, correctCount, bestStreak, isPackQuiz }
 * @returns {Promise<Object|null>} mission completion result or null
 */
export async function syncGamificationToDB(userId, gamData, quizInfo) {
  if (!userId || !gamData) return null;

  const { totalQuestions, correctCount, bestStreak, isPackQuiz } = quizInfo;

  // 1. Save absolute gamification state first
  await saveGamificationStats(userId, {
    xp_total: gamData.totalXP,
    daily_streak_count: gamData.dailyStreak.count,
    daily_streak_last_play: gamData.dailyStreak.lastPlayDate,
    badges: getBadges(),
    total_correct: getTotalCorrect(),
  }).catch(() => {});

  // 2. Decrement streak freeze in DB if used
  if (gamData.streakFrozeUsed) {
    consumeStreakFreeze(userId).catch(() => {});
  }

  // 3. Update mission progress (additive XP — safe after step 1)
  const missionResult = await updateMissionProgress(userId, {
    questionsAnswered: totalQuestions,
    correctAnswers: correctCount,
    bestStreak,
    quizzesCompleted: 1,
    isPackQuiz: !!isPackQuiz,
    isPerfect: correctCount === totalQuestions && totalQuestions > 0,
  }).catch(() => null);

  // 4. Add weekly league XP
  addWeeklyLeagueXP(userId, gamData.sessionXP).catch(() => {});

  return missionResult;
}
