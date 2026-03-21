/**
 * Fuzzy answer matching for FreeQuiz.
 * Deliberately generous — the goal is engagement, not exam-level strictness.
 */

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

/**
 * @param {string} userInput - What the user typed
 * @param {string} correctAnswer - The correct answer from the database
 * @returns {{ isMatch: boolean, normalizedInput: string, normalizedAnswer: string }}
 */
export function matchAnswer(userInput, correctAnswer) {
  const normalizedInput = normalize(userInput || '');
  const normalizedAnswer = normalize(correctAnswer || '');

  // Empty input is always wrong
  if (!normalizedInput) {
    return { isMatch: false, normalizedInput, normalizedAnswer };
  }

  // Exact match after normalization
  if (normalizedInput === normalizedAnswer) {
    return { isMatch: true, normalizedInput, normalizedAnswer };
  }

  // Substring containment (bidirectional)
  if (normalizedAnswer.includes(normalizedInput) || normalizedInput.includes(normalizedAnswer)) {
    // Only match if the substring is meaningful (at least 3 chars)
    if (normalizedInput.length >= 3) {
      return { isMatch: true, normalizedInput, normalizedAnswer };
    }
  }

  // Levenshtein distance for typo tolerance
  const maxDist = normalizedAnswer.length <= 10 ? 2 : 3;
  if (levenshtein(normalizedInput, normalizedAnswer) <= maxDist) {
    return { isMatch: true, normalizedInput, normalizedAnswer };
  }

  return { isMatch: false, normalizedInput, normalizedAnswer };
}
