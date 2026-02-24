/**
 * Tournament bracket generation and advancement utilities.
 * Supports single-elimination brackets for 2–16 teams with byes.
 */

/** Next power of 2 >= n */
export function nextPowerOf2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Standard seeding order for a bracket of given size.
 * E.g. size=8 → [1,8,4,5,2,7,3,6] (1v8, 4v5, 2v7, 3v6)
 */
export function generateSeedOrder(size) {
  if (size === 1) return [1];
  const half = generateSeedOrder(size / 2);
  const result = [];
  for (const seed of half) {
    result.push(seed, size + 1 - seed);
  }
  return result;
}

/**
 * Get human-readable round name.
 */
export function getRoundName(totalRounds, roundIndex) {
  const remaining = totalRounds - roundIndex;
  if (remaining === 1) return 'Final';
  if (remaining === 2) return 'Semi-finals';
  if (remaining === 3) return 'Quarter-finals';
  const teamsInRound = Math.pow(2, remaining);
  return `Round of ${teamsInRound}`;
}

/**
 * Generate a full tournament bracket.
 *
 * @param {string[]} teamNames - Team names in entry order
 * @param {number} questionsPerMatch - Questions allocated per match
 * @param {object[]} allQuestions - All available questions (already built by buildTopics)
 * @returns {{ rounds: Array, teams: Array, questionsPerMatch: number, questionPool: string[], totalMatches: number }}
 */
export function generateBracket(teamNames, questionsPerMatch, allQuestions) {
  const numTeams = teamNames.length;
  const bracketSize = nextPowerOf2(numTeams);
  const totalRounds = Math.log2(bracketSize);
  const seedOrder = generateSeedOrder(bracketSize);

  // Teams array: index → { name, seed, eliminated }
  const teams = teamNames.map((name, i) => ({
    name,
    seed: i + 1,
    eliminated: false,
  }));

  // Build first round matchups using seed order
  const firstRound = [];
  for (let i = 0; i < seedOrder.length; i += 2) {
    const seed1 = seedOrder[i];
    const seed2 = seedOrder[i + 1];
    const team1 = seed1 <= numTeams ? seed1 - 1 : null; // null = bye
    const team2 = seed2 <= numTeams ? seed2 - 1 : null;

    const isBye = team1 === null || team2 === null;
    const winnerIndex = isBye ? (team1 !== null ? team1 : team2) : null;

    firstRound.push({
      team1Index: team1,
      team2Index: team2,
      team1Score: 0,
      team2Score: 0,
      winnerIndex,
      status: isBye ? 'bye' : 'pending',
      completedQuestionIds: [],
      skippedQuestions: [],
    });
  }

  // Build subsequent rounds (empty)
  const rounds = [firstRound];
  for (let r = 1; r < totalRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r + 1);
    const round = [];
    for (let m = 0; m < matchCount; m++) {
      round.push({
        team1Index: null,
        team2Index: null,
        team1Score: 0,
        team2Score: 0,
        winnerIndex: null,
        status: 'pending',
        completedQuestionIds: [],
        skippedQuestions: [],
      });
    }
    rounds.push(round);
  }

  // Auto-advance bye winners into round 2
  for (let m = 0; m < firstRound.length; m++) {
    if (firstRound[m].status === 'bye') {
      const nextRound = 1;
      const nextMatch = Math.floor(m / 2);
      const slot = m % 2 === 0 ? 'team1Index' : 'team2Index';
      if (rounds[nextRound]) {
        rounds[nextRound][nextMatch][slot] = firstRound[m].winnerIndex;
      }
    }
  }

  // Check if any round-2 match now has both teams from byes — mark those as playable
  // (They'll be playable once the bracket view checks canPlay)

  // Shuffle question IDs for the pool
  const allQIds = allQuestions.map(q => q.id);
  const questionPool = [...allQIds].sort(() => Math.random() - 0.5);

  const totalMatches = numTeams - 1; // single elimination

  return {
    rounds,
    teams,
    questionsPerMatch,
    questionPool,
    totalMatches,
    completedMatches: 0,
  };
}

/**
 * Check if a match is playable (both teams assigned, not yet completed/bye).
 */
export function isMatchPlayable(match) {
  return (
    match.status === 'pending' &&
    match.team1Index !== null &&
    match.team2Index !== null
  );
}

/**
 * Advance a winner from a completed match into the next round.
 * Returns a new bracket (immutable update).
 *
 * @param {object} bracket - Current bracket state
 * @param {number} roundIndex - Round of the completed match
 * @param {number} matchIndex - Match index within the round
 * @param {number} winnerIndex - Team index of the winner
 * @returns {object} Updated bracket
 */
export function advanceWinner(bracket, roundIndex, matchIndex, winnerIndex) {
  const newRounds = bracket.rounds.map(round => round.map(match => ({ ...match })));

  // Mark match as completed
  newRounds[roundIndex][matchIndex].winnerIndex = winnerIndex;
  newRounds[roundIndex][matchIndex].status = 'completed';

  // Mark loser as eliminated
  const match = newRounds[roundIndex][matchIndex];
  const loserIndex = match.team1Index === winnerIndex ? match.team2Index : match.team1Index;
  const newTeams = bracket.teams.map((t, i) =>
    i === loserIndex ? { ...t, eliminated: true } : t
  );

  // Advance winner to next round
  const nextRound = roundIndex + 1;
  if (nextRound < newRounds.length) {
    const nextMatch = Math.floor(matchIndex / 2);
    const slot = matchIndex % 2 === 0 ? 'team1Index' : 'team2Index';
    newRounds[nextRound][nextMatch][slot] = winnerIndex;
  }

  return {
    ...bracket,
    rounds: newRounds,
    teams: newTeams,
    completedMatches: bracket.completedMatches + 1,
  };
}

/**
 * Allocate questions for a match from the pool.
 * Returns { allocatedQuestions, remainingPool }.
 */
export function allocateMatchQuestions(questionPool, questionsPerMatch, allTopics) {
  const allQuestions = allTopics.flatMap(t => t.questions);
  const count = Math.min(questionsPerMatch, questionPool.length);
  const allocatedIds = questionPool.slice(0, count);
  const remainingPool = questionPool.slice(count);

  const allocatedQuestions = allocatedIds
    .map(id => allQuestions.find(q => q.id === id))
    .filter(Boolean);

  return { allocatedQuestions, remainingPool };
}

/**
 * Check if the tournament is complete (final match has a winner).
 */
export function isTournamentComplete(bracket) {
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  if (!finalRound || finalRound.length === 0) return false;
  return finalRound[0].status === 'completed' && finalRound[0].winnerIndex !== null;
}

/**
 * Get the champion team index, or null if tournament isn't complete.
 */
export function getChampion(bracket) {
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  if (!finalRound || finalRound.length === 0) return null;
  return finalRound[0].winnerIndex;
}
