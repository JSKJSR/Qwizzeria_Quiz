import { describe, it, expect } from 'vitest';
import {
  nextPowerOf2,
  generateSeedOrder,
  getRoundName,
  generateBracket,
  isMatchPlayable,
  advanceWinner,
  allocateMatchQuestions,
  isTournamentComplete,
  getChampion,
} from './tournamentBracket.js';

describe('nextPowerOf2', () => {
  it('returns 1 for n=1', () => {
    expect(nextPowerOf2(1)).toBe(1);
  });

  it('returns 8 for n=5', () => {
    expect(nextPowerOf2(5)).toBe(8);
  });

  it('returns exact power when n is already a power of 2', () => {
    expect(nextPowerOf2(8)).toBe(8);
    expect(nextPowerOf2(16)).toBe(16);
  });
});

describe('generateSeedOrder', () => {
  it('returns [1] for size=1', () => {
    expect(generateSeedOrder(1)).toEqual([1]);
  });

  it('returns [1,2] for size=2', () => {
    expect(generateSeedOrder(2)).toEqual([1, 2]);
  });

  it('returns correct seeding for size=8', () => {
    expect(generateSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it('returns correct length for size=4', () => {
    const order = generateSeedOrder(4);
    expect(order).toHaveLength(4);
    expect(new Set(order).size).toBe(4);
  });
});

describe('getRoundName', () => {
  it('returns Final for the last round', () => {
    expect(getRoundName(3, 2)).toBe('Final');
  });

  it('returns Semi-finals for the second-to-last round', () => {
    expect(getRoundName(3, 1)).toBe('Semi-finals');
  });

  it('returns Quarter-finals for the third-to-last round', () => {
    expect(getRoundName(3, 0)).toBe('Quarter-finals');
  });

  it('returns Round of N for earlier rounds', () => {
    expect(getRoundName(4, 0)).toBe('Round of 16');
  });
});

describe('generateBracket', () => {
  it('generates correct structure for 4 teams', () => {
    const teams = ['A', 'B', 'C', 'D'];
    const questions = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const bracket = generateBracket(teams, 3, questions);

    expect(bracket.rounds).toHaveLength(2);
    expect(bracket.rounds[0]).toHaveLength(2); // 2 first-round matches
    expect(bracket.rounds[1]).toHaveLength(1); // 1 final match
    expect(bracket.teams).toHaveLength(4);
    expect(bracket.totalMatches).toBe(3); // n-1 for single elimination
    expect(bracket.questionsPerMatch).toBe(3);
    expect(bracket.completedMatches).toBe(0);
  });

  it('handles 3 teams with byes', () => {
    const teams = ['A', 'B', 'C'];
    const questions = [{ id: '1' }, { id: '2' }];
    const bracket = generateBracket(teams, 2, questions);

    // 3 teams → bracketSize 4 → 2 rounds
    expect(bracket.rounds).toHaveLength(2);
    expect(bracket.teams).toHaveLength(3);
    expect(bracket.totalMatches).toBe(2);

    // One match should be a bye
    const byes = bracket.rounds[0].filter(m => m.status === 'bye');
    expect(byes.length).toBe(1);

    // Bye winner should be advanced to round 2
    const finalMatch = bracket.rounds[1][0];
    const hasAdvanced = finalMatch.team1Index !== null || finalMatch.team2Index !== null;
    expect(hasAdvanced).toBe(true);
  });

  it('handles 2 teams with 1 match', () => {
    const teams = ['A', 'B'];
    const questions = [{ id: '1' }];
    const bracket = generateBracket(teams, 1, questions);

    expect(bracket.rounds).toHaveLength(1);
    expect(bracket.rounds[0]).toHaveLength(1);
    expect(bracket.totalMatches).toBe(1);
  });

  it('teams have name and seed', () => {
    const teams = ['Alpha', 'Beta'];
    const bracket = generateBracket(teams, 1, [{ id: '1' }]);

    expect(bracket.teams[0]).toEqual({ name: 'Alpha', seed: 1, eliminated: false });
    expect(bracket.teams[1]).toEqual({ name: 'Beta', seed: 2, eliminated: false });
  });

  it('questionPool contains all question IDs', () => {
    const questions = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const bracket = generateBracket(['A', 'B'], 2, questions);

    expect(bracket.questionPool).toHaveLength(3);
    expect(new Set(bracket.questionPool)).toEqual(new Set(['a', 'b', 'c']));
  });
});

describe('isMatchPlayable', () => {
  it('returns true for pending match with both teams', () => {
    expect(isMatchPlayable({ status: 'pending', team1Index: 0, team2Index: 1 })).toBe(true);
  });

  it('returns false for completed match', () => {
    expect(isMatchPlayable({ status: 'completed', team1Index: 0, team2Index: 1 })).toBe(false);
  });

  it('returns false when team1 is null', () => {
    expect(isMatchPlayable({ status: 'pending', team1Index: null, team2Index: 1 })).toBe(false);
  });

  it('returns false when team2 is null', () => {
    expect(isMatchPlayable({ status: 'pending', team1Index: 0, team2Index: null })).toBe(false);
  });

  it('returns false for bye match', () => {
    expect(isMatchPlayable({ status: 'bye', team1Index: 0, team2Index: null })).toBe(false);
  });
});

describe('advanceWinner', () => {
  function makeBracket() {
    return {
      rounds: [
        [
          { team1Index: 0, team2Index: 1, team1Score: 10, team2Score: 5, winnerIndex: null, status: 'pending', completedQuestionIds: [], skippedQuestions: [] },
          { team1Index: 2, team2Index: 3, team1Score: 0, team2Score: 0, winnerIndex: null, status: 'pending', completedQuestionIds: [], skippedQuestions: [] },
        ],
        [
          { team1Index: null, team2Index: null, team1Score: 0, team2Score: 0, winnerIndex: null, status: 'pending', completedQuestionIds: [], skippedQuestions: [] },
        ],
      ],
      teams: [
        { name: 'A', seed: 1, eliminated: false },
        { name: 'B', seed: 2, eliminated: false },
        { name: 'C', seed: 3, eliminated: false },
        { name: 'D', seed: 4, eliminated: false },
      ],
      completedMatches: 0,
    };
  }

  it('marks match as completed', () => {
    const bracket = makeBracket();
    const result = advanceWinner(bracket, 0, 0, 0);
    expect(result.rounds[0][0].status).toBe('completed');
    expect(result.rounds[0][0].winnerIndex).toBe(0);
  });

  it('eliminates loser', () => {
    const bracket = makeBracket();
    const result = advanceWinner(bracket, 0, 0, 0);
    expect(result.teams[1].eliminated).toBe(true);
    expect(result.teams[0].eliminated).toBe(false);
  });

  it('advances winner to next round slot', () => {
    const bracket = makeBracket();
    const result = advanceWinner(bracket, 0, 0, 0);
    expect(result.rounds[1][0].team1Index).toBe(0); // match 0 → team1 slot
  });

  it('advances second match winner to team2 slot', () => {
    const bracket = makeBracket();
    const result = advanceWinner(bracket, 0, 1, 3);
    expect(result.rounds[1][0].team2Index).toBe(3);
  });

  it('returns a new object (immutability)', () => {
    const bracket = makeBracket();
    const result = advanceWinner(bracket, 0, 0, 0);
    expect(result).not.toBe(bracket);
    expect(result.rounds).not.toBe(bracket.rounds);
    expect(result.teams).not.toBe(bracket.teams);
    // Original should be unchanged
    expect(bracket.rounds[0][0].status).toBe('pending');
  });

  it('increments completedMatches', () => {
    const bracket = makeBracket();
    const result = advanceWinner(bracket, 0, 0, 0);
    expect(result.completedMatches).toBe(1);
  });
});

describe('allocateMatchQuestions', () => {
  const topics = [
    { questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }] },
    { questions: [{ id: 'q4' }, { id: 'q5' }] },
  ];

  it('allocates correct number of questions', () => {
    const pool = ['q1', 'q2', 'q3', 'q4', 'q5'];
    const { allocatedQuestions, remainingPool } = allocateMatchQuestions(pool, 3, topics);
    expect(allocatedQuestions).toHaveLength(3);
    expect(remainingPool).toHaveLength(2);
  });

  it('handles pool smaller than requested', () => {
    const pool = ['q1'];
    const { allocatedQuestions, remainingPool } = allocateMatchQuestions(pool, 5, topics);
    expect(allocatedQuestions).toHaveLength(1);
    expect(remainingPool).toHaveLength(0);
  });

  it('returns correct remaining pool', () => {
    const pool = ['q1', 'q2', 'q3'];
    const { remainingPool } = allocateMatchQuestions(pool, 2, topics);
    expect(remainingPool).toEqual(['q3']);
  });
});

describe('isTournamentComplete', () => {
  it('returns false when final has no winner', () => {
    const bracket = {
      rounds: [
        [{ status: 'completed', winnerIndex: 0 }],
        [{ status: 'pending', winnerIndex: null }],
      ],
    };
    expect(isTournamentComplete(bracket)).toBe(false);
  });

  it('returns true when final match is completed', () => {
    const bracket = {
      rounds: [
        [{ status: 'completed', winnerIndex: 0 }],
        [{ status: 'completed', winnerIndex: 0 }],
      ],
    };
    expect(isTournamentComplete(bracket)).toBe(true);
  });

  it('returns false for empty rounds', () => {
    expect(isTournamentComplete({ rounds: [[]] })).toBe(false);
  });
});

describe('getChampion', () => {
  it('returns null when tournament is incomplete', () => {
    const bracket = {
      rounds: [[{ status: 'pending', winnerIndex: null }]],
    };
    expect(getChampion(bracket)).toBeNull();
  });

  it('returns correct winner index when complete', () => {
    const bracket = {
      rounds: [
        [{ status: 'completed', winnerIndex: 0 }],
        [{ status: 'completed', winnerIndex: 2 }],
      ],
    };
    expect(getChampion(bracket)).toBe(2);
  });

  it('returns null for empty final round', () => {
    expect(getChampion({ rounds: [[]] })).toBeNull();
  });
});
