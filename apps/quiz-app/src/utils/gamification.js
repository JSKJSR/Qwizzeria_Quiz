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
  { key: 'first_steps', label: 'First Steps', icon: '\u{1F31F}' },
  { key: 'sharp_shooter', label: 'Sharp Shooter', icon: '\u{1F3AF}' },
  { key: 'on_fire', label: 'On Fire', icon: '\u{1F525}' },
  { key: 'big_brain', label: 'Big Brain', icon: '\u{1F9E0}' },
  { key: 'dedicated', label: 'Dedicated', icon: '\u{1F4C5}' },
  { key: 'legend', label: 'Legend', icon: '\u{1F451}' },
];

const SPEED_BONUS_THRESHOLD_MS = 5000;
const SPEED_BONUS_XP = 5;

/**
 * Calculate XP earned for a single question answer.
 */
export function calculateXP({ isCorrect, points, timeSpentMs, streak }) {
  if (!isCorrect) return 0;
  let xp = points;
  if (timeSpentMs > 0 && timeSpentMs < SPEED_BONUS_THRESHOLD_MS) {
    xp += SPEED_BONUS_XP;
  }
  if (streak >= 1) {
    xp += streak * 3;
  }
  return xp;
}

export const SESSION_COMPLETE_XP = 25;

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
  const entry = LEVELS.find(l => l.level === level);
  return entry ? entry.title : LEVELS[0].title;
}

/**
 * Get XP progress within current level (for progress bar).
 * Returns { current, needed, pct }
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
 * Check which new badges were earned this session.
 * Returns array of newly earned badge keys.
 */
export function checkNewBadges({ correctCount, totalCount, bestStreak, playCount, level, existingBadges }) {
  const earned = [];
  const has = (key) => existingBadges.includes(key);

  if (!has('first_steps') && playCount >= 1) {
    earned.push('first_steps');
  }
  if (!has('sharp_shooter') && totalCount > 0 && correctCount === totalCount) {
    earned.push('sharp_shooter');
  }
  if (!has('on_fire') && bestStreak >= 5) {
    earned.push('on_fire');
  }
  if (!has('big_brain') && totalCount >= 27 && correctCount / totalCount >= 0.9) {
    earned.push('big_brain');
  }
  if (!has('dedicated') && playCount >= 7) {
    // Note: this checks play count as a proxy — daily streak check is in storage
    // The caller should pass the actual streak count as playCount for this badge
  }
  if (!has('legend') && level >= 10) {
    earned.push('legend');
  }

  return earned;
}

/**
 * Check dedicated badge separately (needs daily streak count).
 */
export function checkDedicatedBadge(dailyStreakCount, existingBadges) {
  if (!existingBadges.includes('dedicated') && dailyStreakCount >= 7) {
    return true;
  }
  return false;
}

/**
 * Update daily streak based on current date.
 * @param {{ count: number, lastPlayDate: string } | null} currentStreak
 * @returns {{ count: number, lastPlayDate: string }}
 */
export function updateStreak(currentStreak) {
  const today = new Date().toISOString().split('T')[0];

  if (!currentStreak || !currentStreak.lastPlayDate) {
    return { count: 1, lastPlayDate: today };
  }

  if (currentStreak.lastPlayDate === today) {
    return currentStreak; // Already played today
  }

  const lastDate = new Date(currentStreak.lastPlayDate);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return { count: currentStreak.count + 1, lastPlayDate: today };
  }

  // Missed a day — reset
  return { count: 1, lastPlayDate: today };
}
