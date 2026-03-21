/**
 * Fuzzy answer matching for FreeQuiz.
 * Deliberately generous — the goal is engagement, not exam-level strictness.
 */

const MIN_SUBSTRING_LEN = 3;
const MAX_EDIT_DIST_SHORT = 2; // answers ≤ 10 chars
const MAX_EDIT_DIST_LONG = 3;  // answers > 10 chars

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchAnswer(userInput, correctAnswer) {
  const normalizedInput = normalize(userInput || '');
  const normalizedAnswer = normalize(correctAnswer || '');

  if (!normalizedInput) {
    return { isMatch: false, normalizedInput, normalizedAnswer };
  }

  if (normalizedInput === normalizedAnswer) {
    return { isMatch: true, normalizedInput, normalizedAnswer };
  }

  if (normalizedInput.length >= MIN_SUBSTRING_LEN &&
      (normalizedAnswer.includes(normalizedInput) || normalizedInput.includes(normalizedAnswer))) {
    return { isMatch: true, normalizedInput, normalizedAnswer };
  }

  const maxDist = normalizedAnswer.length <= 10 ? MAX_EDIT_DIST_SHORT : MAX_EDIT_DIST_LONG;
  if (levenshtein(normalizedInput, normalizedAnswer) <= maxDist) {
    return { isMatch: true, normalizedInput, normalizedAnswer };
  }

  return { isMatch: false, normalizedInput, normalizedAnswer };
}
