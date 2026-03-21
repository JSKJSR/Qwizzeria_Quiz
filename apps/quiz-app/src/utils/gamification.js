/**
 * Gamification utilities for FreeQuiz — pure functions, no side effects.
 */

export const LEVELS = [
  { level: 1, xp: 0, title: 'Curious Cat' },
  { level: 2, xp: 100, title: 'Trivia Dabbler' },
  { level: 3, xp: 300, title: 'Fact Finder' },
  { level: 4, xp: 600, title: 'Knowledge Seeker' },
  { level: 5, xp: 1000, title: 'Quiz Enthusiast' },
  { level: 6, xp: 1500, title: 'Brainy Bunch' },
  { level: 7, xp: 2500, title: 'Trivia Titan' },
  { level: 8, xp: 4000, title: 'Quiz Maestro' },
  { level: 9, xp: 6000, title: 'Encyclopedia' },
  { level: 10, xp: 10000, title: 'Qwizzeria Legend' },
];

export const BADGES = [
  { key: 'first_steps', label: 'First Steps', icon: '\u{1F31F}', check: (o) => o.playCount >= 1 },
  { key: 'sharp_shooter', label: 'Sharp Shooter', icon: '\u{1F3AF}', check: (o) => o.totalCount > 0 && o.correctCount === o.totalCount },
  { key: 'on_fire', label: 'On Fire', icon: '\u{1F525}', check: (o) => o.bestStreak >= 5 },
  { key: 'big_brain', label: 'Big Brain', icon: '\u{1F9E0}', check: (o) => o.totalCount >= 27 && o.correctCount / o.totalCount >= 0.9 },
  { key: 'dedicated', label: 'Dedicated', icon: '\u{1F4C5}', check: (o) => o.dailyStreakCount >= 7 },
  { key: 'legend', label: 'Legend', icon: '\u{1F451}', check: (o) => o.level >= 10 },
];

const SPEED_BONUS_MS = 5000;
const SPEED_BONUS_XP = 5;
const STREAK_XP_MULTIPLIER = 3;
export const SESSION_COMPLETE_XP = 25;

/**
 * Calculate XP earned for a single question answer.
 */
export function calculateXP({ isCorrect, points, timeSpentMs, streak }) {
  if (!isCorrect) return 0;
  let xp = points;
  if (timeSpentMs > 0 && timeSpentMs < SPEED_BONUS_MS) xp += SPEED_BONUS_XP;
  if (streak >= 1) xp += streak * STREAK_XP_MULTIPLIER;
  return xp;
}

/**
 * Get level number (1-10) from total XP.
 */
export function getLevel(totalXP) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xp) return LEVELS[i].level;
  }
  return 1;
}

/**
 * Get level title string.
 */
export function getLevelTitle(level) {
  return LEVELS.find(l => l.level === level)?.title || LEVELS[0].title;
}

/**
 * Get XP progress within current level for progress bar.
 */
export function getLevelProgress(totalXP) {
  const level = getLevel(totalXP);
  const currentLevelXP = LEVELS.find(l => l.level === level)?.xp || 0;
  const nextLevel = LEVELS.find(l => l.level === level + 1);
  if (!nextLevel) return { current: totalXP - currentLevelXP, needed: 0, pct: 100 };
  const needed = nextLevel.xp - currentLevelXP;
  const current = totalXP - currentLevelXP;
  return { current, needed, pct: Math.min(100, Math.round((current / needed) * 100)) };
}

/**
 * Check which new badges were earned. Returns array of newly earned badge keys.
 */
export function checkNewBadges(opts) {
  return BADGES
    .filter(b => !opts.existingBadges.includes(b.key) && b.check(opts))
    .map(b => b.key);
}

/**
 * Update daily streak based on current date.
 */
export function updateStreak(currentStreak) {
  const today = new Date().toISOString().split('T')[0];

  if (!currentStreak?.lastPlayDate) {
    return { count: 1, lastPlayDate: today };
  }
  if (currentStreak.lastPlayDate === today) {
    return currentStreak;
  }

  const diffDays = Math.floor((new Date(today) - new Date(currentStreak.lastPlayDate)) / 86400000);
  if (diffDays === 1) {
    return { count: currentStreak.count + 1, lastPlayDate: today };
  }
  return { count: 1, lastPlayDate: today };
}
