const BEST_SCORE_KEY = 'qwizzeria_free_best_score';
const PLAY_COUNT_KEY = 'qwizzeria_free_play_count';

export function getBestScore() {
  try {
    const val = localStorage.getItem(BEST_SCORE_KEY);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

export function saveBestScore(score, maxScore) {
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

export function getPlayCount() {
  try {
    return parseInt(localStorage.getItem(PLAY_COUNT_KEY) || '0', 10);
  } catch { return 0; }
}

export function incrementPlayCount() {
  try {
    const count = getPlayCount() + 1;
    localStorage.setItem(PLAY_COUNT_KEY, String(count));
    return count;
  } catch { return 0; }
}

export function getScoreMessage(score, maxScore) {
  const pct = (score / maxScore) * 100;
  if (pct === 100) return 'Perfect score! You are a quiz master!';
  if (pct >= 80) return 'Excellent! Very impressive knowledge!';
  if (pct >= 60) return 'Great job! Well done!';
  if (pct >= 40) return 'Good effort! Keep learning!';
  return 'Better luck next time! Every quiz makes you smarter.';
}
