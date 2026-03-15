import { describe, it, expect, vi } from 'vitest';
import { ACTIONS, initialState, buildTopics, buildMatchTopics, reducer } from './hostQuizReducer';

// Mock detectMediaType
vi.mock('../../utils/mediaDetector', () => ({
  detectMediaType: (url) => {
    if (url?.includes('youtube')) return { type: 'youtube', embedUrl: url };
    if (url?.endsWith('.mp3')) return { type: 'audio', embedUrl: url };
    return { type: 'image', embedUrl: url };
  },
}));

// Mock tournamentBracket
vi.mock('../../utils/tournamentBracket', () => ({
  generateBracket: (participants, questionsPerMatch, questions) => ({
    teams: participants.map(name => ({ name })),
    rounds: [[{ team1Index: 0, team2Index: 1, status: 'pending', winnerIndex: null, team1Score: 0, team2Score: 0 }]],
    questionsPerMatch,
    questionPool: questions ? questions.map(q => q.id) : [],
  }),
  advanceWinner: (bracket, ri, mi, winnerIdx) => {
    const newRounds = bracket.rounds.map((round, r) =>
      round.map((m, m2) =>
        r === ri && m2 === mi ? { ...m, status: 'completed', winnerIndex: winnerIdx } : m
      )
    );
    return { ...bracket, rounds: newRounds };
  },
  allocateMatchQuestions: (pool, count, topics) => {
    const allQs = topics.flatMap(t => t.questions);
    const allocated = allQs.slice(0, count);
    return { allocatedQuestions: allocated, remainingPool: pool.slice(count) };
  },
  isMatchPlayable: (match) => match.status === 'pending' || match.status === 'in_progress',
  isTournamentComplete: (bracket) => bracket.rounds.every(r => r.every(m => m.status === 'completed')),
}));

// --- buildTopics ---
describe('buildTopics', () => {
  it('groups questions by category', () => {
    const questions = [
      { id: 1, category: 'Science', question_text: 'Q1', answer_text: 'A1' },
      { id: 2, category: 'Science', question_text: 'Q2', answer_text: 'A2' },
      { id: 3, category: 'History', question_text: 'Q3', answer_text: 'A3' },
    ];
    const topics = buildTopics(questions);
    expect(topics).toHaveLength(2);
    expect(topics[0].name).toBe('Science');
    expect(topics[0].questions).toHaveLength(2);
    expect(topics[1].name).toBe('History');
    expect(topics[1].questions).toHaveLength(1);
  });

  it('assigns ascending point values (10, 20, 30, 40, 50)', () => {
    const questions = [
      { id: 1, category: 'Cat', question_text: 'Q1', answer_text: 'A1' },
      { id: 2, category: 'Cat', question_text: 'Q2', answer_text: 'A2' },
      { id: 3, category: 'Cat', question_text: 'Q3', answer_text: 'A3' },
    ];
    const topics = buildTopics(questions);
    expect(topics[0].questions.map(q => q.points)).toEqual([10, 20, 30]);
  });

  it('uses explicit points when provided', () => {
    const questions = [
      { id: 1, category: 'Cat', question_text: 'Q1', answer_text: 'A1', points: 100 },
    ];
    const topics = buildTopics(questions);
    expect(topics[0].questions[0].points).toBe(100);
  });

  it('defaults to "General" when category is missing', () => {
    const questions = [{ id: 1, question_text: 'Q1', answer_text: 'A1' }];
    const topics = buildTopics(questions);
    expect(topics[0].name).toBe('General');
  });

  it('detects media types', () => {
    const questions = [
      { id: 1, category: 'Cat', question_text: 'Q1', answer_text: 'A1', media_url: 'https://youtube.com/watch?v=abc' },
    ];
    const topics = buildTopics(questions);
    expect(topics[0].questions[0].mediaType).toBe('youtube');
  });

  it('handles questions with no media', () => {
    const questions = [{ id: 1, category: 'Cat', question_text: 'Q1', answer_text: 'A1' }];
    const topics = buildTopics(questions);
    expect(topics[0].questions[0].mediaType).toBe('none');
  });

  it('uses display_title as topic when available', () => {
    const questions = [{ id: 1, category: 'Cat', question_text: 'Q1', answer_text: 'A1', display_title: 'Custom Title' }];
    const topics = buildTopics(questions);
    expect(topics[0].questions[0].topic).toBe('Custom Title');
  });

  it('handles more than 5 questions with correct point scaling', () => {
    const questions = Array.from({ length: 7 }, (_, i) => ({
      id: i + 1, category: 'Cat', question_text: `Q${i}`, answer_text: `A${i}`,
    }));
    const topics = buildTopics(questions);
    const points = topics[0].questions.map(q => q.points);
    expect(points).toEqual([10, 20, 30, 40, 50, 60, 70]);
  });
});

// --- buildMatchTopics ---
describe('buildMatchTopics', () => {
  it('groups allocated questions by topic', () => {
    const qs = [
      { id: 1, topic: 'Science', question: 'Q1', answer: 'A1' },
      { id: 2, topic: 'Science', question: 'Q2', answer: 'A2' },
      { id: 3, topic: 'History', question: 'Q3', answer: 'A3' },
    ];
    const topics = buildMatchTopics(qs);
    expect(topics).toHaveLength(2);
    expect(topics[0].name).toBe('Science');
    expect(topics[1].name).toBe('History');
  });

  it('assigns match point levels (10, 20, 30)', () => {
    const qs = [
      { id: 1, topic: 'Cat', question: 'Q1', answer: 'A1' },
      { id: 2, topic: 'Cat', question: 'Q2', answer: 'A2' },
      { id: 3, topic: 'Cat', question: 'Q3', answer: 'A3' },
    ];
    const topics = buildMatchTopics(qs);
    expect(topics[0].questions.map(q => q.points)).toEqual([10, 20, 30]);
  });

  it('defaults to "General" when topic is missing', () => {
    const qs = [{ id: 1, question: 'Q1', answer: 'A1' }];
    const topics = buildMatchTopics(qs);
    expect(topics[0].name).toBe('General');
  });
});

// --- Standard reducer actions ---
describe('reducer — standard actions', () => {
  it('SELECT_PACK sets phase to setup with topics', () => {
    const questions = [
      { id: 1, category: 'Cat', question_text: 'Q1', answer_text: 'A1' },
    ];
    const pack = { id: 'p1', title: 'Test Pack' };
    const result = reducer(initialState, { type: ACTIONS.SELECT_PACK, pack, questions });
    expect(result.phase).toBe('setup');
    expect(result.pack).toBe(pack);
    expect(result.topics).toHaveLength(1);
    expect(result.allQuestions).toBe(questions);
  });

  it('START_QUIZ sets phase to grid with participants', () => {
    const state = { ...initialState, phase: 'setup' };
    const result = reducer(state, { type: ACTIONS.START_QUIZ, participants: ['Alice', 'Bob'] });
    expect(result.phase).toBe('grid');
    expect(result.participants).toEqual([
      { name: 'Alice', score: 0 },
      { name: 'Bob', score: 0 },
    ]);
    expect(result.completedQuestionIds).toEqual([]);
  });

  it('SELECT_QUESTION sets phase to question', () => {
    const question = { id: 1, question: 'Q1', points: 10 };
    const state = { ...initialState, phase: 'grid' };
    const result = reducer(state, { type: ACTIONS.SELECT_QUESTION, question });
    expect(result.phase).toBe('question');
    expect(result.selectedQuestion).toBe(question);
  });

  it('REVEAL_ANSWER sets phase to answer', () => {
    const state = { ...initialState, phase: 'question' };
    const result = reducer(state, { type: ACTIONS.REVEAL_ANSWER });
    expect(result.phase).toBe('answer');
  });

  it('AWARD_POINTS adds points and returns to grid', () => {
    const state = {
      ...initialState,
      phase: 'answer',
      selectedQuestion: { id: 1, points: 20 },
      participants: [{ name: 'Alice', score: 0 }, { name: 'Bob', score: 10 }],
      completedQuestionIds: [],
    };
    const result = reducer(state, { type: ACTIONS.AWARD_POINTS, participantIndex: 0 });
    expect(result.phase).toBe('grid');
    expect(result.participants[0].score).toBe(20);
    expect(result.participants[1].score).toBe(10);
    expect(result.completedQuestionIds).toEqual([1]);
    expect(result.selectedQuestion).toBeNull();
  });

  it('NO_POINTS marks question complete without scoring', () => {
    const state = {
      ...initialState,
      phase: 'answer',
      selectedQuestion: { id: 5 },
      completedQuestionIds: [1, 2],
    };
    const result = reducer(state, { type: ACTIONS.NO_POINTS });
    expect(result.phase).toBe('grid');
    expect(result.completedQuestionIds).toEqual([1, 2, 5]);
    expect(result.selectedQuestion).toBeNull();
  });

  it('SKIP_QUESTION marks complete and adds to skipped', () => {
    const question = { id: 3, question: 'Q3' };
    const state = {
      ...initialState,
      phase: 'answer',
      selectedQuestion: question,
      completedQuestionIds: [],
      skippedQuestions: [],
    };
    const result = reducer(state, { type: ACTIONS.SKIP_QUESTION });
    expect(result.completedQuestionIds).toEqual([3]);
    expect(result.skippedQuestions).toEqual([question]);
  });

  it('ADJUST_SCORE modifies participant score by delta', () => {
    const state = {
      ...initialState,
      participants: [{ name: 'Alice', score: 30 }, { name: 'Bob', score: 10 }],
    };
    const result = reducer(state, { type: ACTIONS.ADJUST_SCORE, participantIndex: 1, delta: 5 });
    expect(result.participants[1].score).toBe(15);
    expect(result.participants[0].score).toBe(30);
  });

  it('ADJUST_SCORE can subtract points', () => {
    const state = {
      ...initialState,
      participants: [{ name: 'Alice', score: 20 }],
    };
    const result = reducer(state, { type: ACTIONS.ADJUST_SCORE, participantIndex: 0, delta: -10 });
    expect(result.participants[0].score).toBe(10);
  });

  it('END_QUIZ sets phase to review', () => {
    const result = reducer({ ...initialState, phase: 'grid' }, { type: ACTIONS.END_QUIZ });
    expect(result.phase).toBe('review');
  });

  it('CONFIRM_END_QUIZ sets phase to results', () => {
    const result = reducer({ ...initialState, phase: 'review' }, { type: ACTIONS.CONFIRM_END_QUIZ });
    expect(result.phase).toBe('results');
  });

  it('PLAY_AGAIN resets scores and returns to grid', () => {
    const state = {
      ...initialState,
      phase: 'results',
      participants: [{ name: 'Alice', score: 100 }],
      completedQuestionIds: [1, 2, 3],
      skippedQuestions: [{ id: 3 }],
    };
    const result = reducer(state, { type: ACTIONS.PLAY_AGAIN });
    expect(result.phase).toBe('grid');
    expect(result.participants[0].score).toBe(0);
    expect(result.completedQuestionIds).toEqual([]);
    expect(result.skippedQuestions).toEqual([]);
  });

  it('RESET_QUIZ returns to initialState', () => {
    const state = { ...initialState, phase: 'grid', pack: { id: 1 } };
    const result = reducer(state, { type: ACTIONS.RESET_QUIZ });
    expect(result).toEqual(initialState);
  });

  it('RESTORE_SESSION replaces entire state', () => {
    const savedState = { ...initialState, phase: 'grid', pack: { id: 'restored' } };
    const result = reducer(initialState, { type: ACTIONS.RESTORE_SESSION, savedState });
    expect(result.phase).toBe('grid');
    expect(result.pack.id).toBe('restored');
  });

  it('unknown action returns state unchanged', () => {
    const state = { ...initialState, phase: 'grid' };
    const result = reducer(state, { type: 'UNKNOWN_ACTION' });
    expect(result).toBe(state);
  });
});

// --- Tournament reducer actions ---
describe('reducer — tournament actions', () => {
  it('START_TOURNAMENT creates bracket and sets tournament mode', () => {
    const state = {
      ...initialState,
      phase: 'setup',
      topics: [{ name: 'Cat', questions: [{ id: 1 }, { id: 2 }] }],
    };
    const result = reducer(state, {
      type: ACTIONS.START_TOURNAMENT,
      participants: ['Team A', 'Team B'],
      questionsPerMatch: 2,
    });
    expect(result.phase).toBe('bracket');
    expect(result.mode).toBe('tournament');
    expect(result.tournament).toBeDefined();
    expect(result.tournament.teams).toHaveLength(2);
    expect(result.participants).toEqual([
      { name: 'Team A', score: 0 },
      { name: 'Team B', score: 0 },
    ]);
  });

  it('START_TOURNAMENT with perMatchPacks passes null questions', () => {
    const state = { ...initialState, phase: 'setup', topics: [] };
    const result = reducer(state, {
      type: ACTIONS.START_TOURNAMENT,
      participants: ['A', 'B'],
      questionsPerMatch: 3,
      perMatchPacks: true,
    });
    expect(result.phase).toBe('bracket');
    expect(result.matchPacks).toEqual({});
  });

  it('SELECT_MATCH with playable match starts match grid', () => {
    const state = {
      ...initialState,
      mode: 'tournament',
      phase: 'bracket',
      topics: [{ name: 'Cat', questions: [{ id: 1, topic: 'Cat', points: 10 }, { id: 2, topic: 'Cat', points: 20 }] }],
      tournament: {
        teams: [{ name: 'A' }, { name: 'B' }],
        rounds: [[{ team1Index: 0, team2Index: 1, status: 'pending', winnerIndex: null }]],
        questionsPerMatch: 2,
        questionPool: [1, 2],
      },
    };
    const result = reducer(state, { type: ACTIONS.SELECT_MATCH, roundIndex: 0, matchIndex: 0 });
    expect(result.phase).toBe('matchGrid');
    expect(result.matchParticipants).toHaveLength(2);
    expect(result.matchCompletedQuestionIds).toEqual([]);
  });

  it('SELECT_MATCH with non-playable match returns state unchanged', () => {
    const state = {
      ...initialState,
      mode: 'tournament',
      tournament: {
        teams: [{ name: 'A' }, { name: 'B' }],
        rounds: [[{ team1Index: 0, team2Index: 1, status: 'completed', winnerIndex: 0 }]],
        questionsPerMatch: 2,
        questionPool: [],
      },
    };
    const result = reducer(state, { type: ACTIONS.SELECT_MATCH, roundIndex: 0, matchIndex: 0 });
    expect(result).toBe(state);
  });

  it('MATCH_SELECT_QUESTION sets matchQuestion phase', () => {
    const q = { id: 1, question: 'Q1', points: 10 };
    const result = reducer(
      { ...initialState, phase: 'matchGrid' },
      { type: ACTIONS.MATCH_SELECT_QUESTION, question: q }
    );
    expect(result.phase).toBe('matchQuestion');
    expect(result.selectedQuestion).toBe(q);
  });

  it('MATCH_REVEAL_ANSWER sets matchAnswer phase', () => {
    const result = reducer(
      { ...initialState, phase: 'matchQuestion' },
      { type: ACTIONS.MATCH_REVEAL_ANSWER }
    );
    expect(result.phase).toBe('matchAnswer');
  });

  it('MATCH_AWARD_POINTS adds points to match participant', () => {
    const state = {
      ...initialState,
      phase: 'matchAnswer',
      selectedQuestion: { id: 1, points: 20 },
      matchParticipants: [
        { name: 'A', score: 0, teamIndex: 0 },
        { name: 'B', score: 10, teamIndex: 1 },
      ],
      matchCompletedQuestionIds: [],
    };
    const result = reducer(state, { type: ACTIONS.MATCH_AWARD_POINTS, participantIndex: 0 });
    expect(result.phase).toBe('matchGrid');
    expect(result.matchParticipants[0].score).toBe(20);
    expect(result.matchCompletedQuestionIds).toEqual([1]);
  });

  it('MATCH_NO_POINTS marks match question complete', () => {
    const state = {
      ...initialState,
      selectedQuestion: { id: 5 },
      matchCompletedQuestionIds: [1],
    };
    const result = reducer(state, { type: ACTIONS.MATCH_NO_POINTS });
    expect(result.matchCompletedQuestionIds).toEqual([1, 5]);
  });

  it('MATCH_SKIP_QUESTION adds to match skipped', () => {
    const q = { id: 3, question: 'Q3' };
    const state = {
      ...initialState,
      selectedQuestion: q,
      matchCompletedQuestionIds: [],
      matchSkippedQuestions: [],
    };
    const result = reducer(state, { type: ACTIONS.MATCH_SKIP_QUESTION });
    expect(result.matchCompletedQuestionIds).toEqual([3]);
    expect(result.matchSkippedQuestions).toEqual([q]);
  });

  it('MATCH_ADJUST_SCORE adjusts match participant score', () => {
    const state = {
      ...initialState,
      matchParticipants: [
        { name: 'A', score: 10, teamIndex: 0 },
        { name: 'B', score: 20, teamIndex: 1 },
      ],
    };
    const result = reducer(state, { type: ACTIONS.MATCH_ADJUST_SCORE, participantIndex: 0, delta: 5 });
    expect(result.matchParticipants[0].score).toBe(15);
  });

  it('END_MATCH advances winner and returns to bracket or tournamentResults', () => {
    const state = {
      ...initialState,
      mode: 'tournament',
      currentMatch: { roundIndex: 0, matchIndex: 0 },
      matchParticipants: [
        { name: 'A', score: 30, teamIndex: 0 },
        { name: 'B', score: 10, teamIndex: 1 },
      ],
      tournament: {
        teams: [{ name: 'A' }, { name: 'B' }],
        rounds: [[{ team1Index: 0, team2Index: 1, status: 'in_progress', winnerIndex: null, team1Score: 0, team2Score: 0 }]],
        questionsPerMatch: 2,
        questionPool: [],
      },
      matchCompletedQuestionIds: [1, 2],
      matchSkippedQuestions: [],
    };
    const result = reducer(state, { type: ACTIONS.END_MATCH, winnerTeamIndex: 0 });
    // Since isTournamentComplete returns true (all matches completed by mock), phase should be tournamentResults
    expect(result.phase).toBe('tournamentResults');
    expect(result.currentMatch).toBeNull();
    expect(result.matchParticipants).toEqual([]);
  });

  it('SET_TOURNAMENT_ID stores the DB id', () => {
    const result = reducer(initialState, { type: ACTIONS.SET_TOURNAMENT_ID, tournamentId: 'abc-123' });
    expect(result.tournamentId).toBe('abc-123');
  });

  it('END_TOURNAMENT sets phase to tournamentResults', () => {
    const result = reducer(
      { ...initialState, phase: 'bracket' },
      { type: ACTIONS.END_TOURNAMENT }
    );
    expect(result.phase).toBe('tournamentResults');
  });
});
