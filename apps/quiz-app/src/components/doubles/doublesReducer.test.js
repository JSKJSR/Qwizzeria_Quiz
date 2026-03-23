import { describe, it, expect } from 'vitest';
import { reducer, initialState, ACTIONS } from './doublesReducer';

const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
  id: `q-${i}`,
  question_text: `Question ${i + 1}`,
  answer_text: `Answer ${i + 1}`,
  category: 'General',
}));

const mockPack = { id: 'pack-1', title: 'Test Pack' };
const mockConfig = { doubles_enabled: true, doubles_split_index: 5, doubles_timer_minutes: 30 };

describe('doublesReducer', () => {
  it('starts with select phase', () => {
    expect(initialState.phase).toBe('select');
  });

  it('SELECT_PACK transitions to playerSetup and splits questions', () => {
    const state = reducer(initialState, {
      type: ACTIONS.SELECT_PACK,
      payload: { pack: mockPack, questions: mockQuestions, config: mockConfig },
    });

    expect(state.phase).toBe('playerSetup');
    expect(state.pack).toBe(mockPack);
    expect(state.part1Questions).toHaveLength(5);
    expect(state.part2Questions).toHaveLength(5);
    expect(state.part1TimerMinutes).toBe(30);
    expect(state.part2TimerMinutes).toBe(30);
    expect(state.part2Skipped).toBe(false);
  });

  it('SELECT_PACK defaults to midpoint split when no split_index (legacy)', () => {
    const state = reducer(initialState, {
      type: ACTIONS.SELECT_PACK,
      payload: { pack: mockPack, questions: mockQuestions, config: { doubles_enabled: true } },
    });

    expect(state.part1Questions).toHaveLength(5);
    expect(state.part2Questions).toHaveLength(5);
    expect(state.part1TimerMinutes).toBe(60);
    expect(state.part2TimerMinutes).toBe(60);
    expect(state.part2Skipped).toBe(false);
  });

  it('SELECT_PACK with new config splits by explicit question counts', () => {
    const newConfig = {
      doubles_enabled: true,
      doubles_part1_questions: 3,
      doubles_part2_questions: 7,
      doubles_part1_timer_minutes: 20,
      doubles_part2_timer_minutes: 40,
    };
    const state = reducer(initialState, {
      type: ACTIONS.SELECT_PACK,
      payload: { pack: mockPack, questions: mockQuestions, config: newConfig },
    });

    expect(state.part1Questions).toHaveLength(3);
    expect(state.part2Questions).toHaveLength(7);
    expect(state.part1TimerMinutes).toBe(20);
    expect(state.part2TimerMinutes).toBe(40);
    expect(state.part2Skipped).toBe(false);
  });

  it('SELECT_PACK with part2_questions=0 sets part2Skipped', () => {
    const skipConfig = {
      doubles_enabled: true,
      doubles_part1_questions: 10,
      doubles_part2_questions: 0,
      doubles_part1_timer_minutes: 45,
    };
    const state = reducer(initialState, {
      type: ACTIONS.SELECT_PACK,
      payload: { pack: mockPack, questions: mockQuestions, config: skipConfig },
    });

    expect(state.part1Questions).toHaveLength(10);
    expect(state.part2Questions).toHaveLength(0);
    expect(state.part1TimerMinutes).toBe(45);
    expect(state.part2Skipped).toBe(true);
  });

  it('SELECT_PACK clamps when more questions requested than available', () => {
    const overConfig = {
      doubles_enabled: true,
      doubles_part1_questions: 8,
      doubles_part2_questions: 5,
      doubles_part1_timer_minutes: 30,
      doubles_part2_timer_minutes: 30,
    };
    const state = reducer(initialState, {
      type: ACTIONS.SELECT_PACK,
      payload: { pack: mockPack, questions: mockQuestions, config: overConfig },
    });

    expect(state.part1Questions).toHaveLength(8);
    expect(state.part2Questions).toHaveLength(2); // only 2 remaining
  });

  it('SET_PLAYER with string payload transitions to rules (backward compat)', () => {
    const prev = { ...initialState, phase: 'playerSetup', pack: mockPack };
    const state = reducer(prev, { type: ACTIONS.SET_PLAYER, payload: '  Alice  ' });

    expect(state.phase).toBe('rules');
    expect(state.playerName).toBe('Alice');
    expect(state.passiveParticipant).toBeNull();
  });

  it('SET_PLAYER with object payload stores playerName and passiveParticipant', () => {
    const prev = { ...initialState, phase: 'playerSetup', pack: mockPack };
    const partner = { userId: 'u-123', displayName: 'Bob', email: 'bob@test.com' };
    const state = reducer(prev, {
      type: ACTIONS.SET_PLAYER,
      payload: { playerName: '  Alice  ', passiveParticipant: partner },
    });

    expect(state.phase).toBe('rules');
    expect(state.playerName).toBe('Alice');
    expect(state.passiveParticipant).toEqual(partner);
  });

  it('SET_PLAYER with object payload and null passiveParticipant', () => {
    const prev = { ...initialState, phase: 'playerSetup', pack: mockPack };
    const state = reducer(prev, {
      type: ACTIONS.SET_PLAYER,
      payload: { playerName: 'Alice', passiveParticipant: null },
    });

    expect(state.phase).toBe('rules');
    expect(state.playerName).toBe('Alice');
    expect(state.passiveParticipant).toBeNull();
  });

  it('ACCEPT_RULES transitions to part1 with timerStartedAt', () => {
    const prev = { ...initialState, phase: 'rules' };
    const state = reducer(prev, { type: ACTIONS.ACCEPT_RULES });

    expect(state.phase).toBe('part1');
    expect(state.timerStartedAt).toBeTruthy();
  });

  it('UPDATE_RESPONSE stores text for a question', () => {
    const prev = { ...initialState, phase: 'part1', responses: {} };
    const state = reducer(prev, {
      type: ACTIONS.UPDATE_RESPONSE,
      payload: { questionId: 'q-0', text: 'Paris' },
    });

    expect(state.responses['q-0']).toBe('Paris');
  });

  it('UPDATE_RESPONSE overwrites existing response', () => {
    const prev = { ...initialState, phase: 'part1', responses: { 'q-0': 'London' } };
    const state = reducer(prev, {
      type: ACTIONS.UPDATE_RESPONSE,
      payload: { questionId: 'q-0', text: 'Paris' },
    });

    expect(state.responses['q-0']).toBe('Paris');
  });

  it('SUBMIT_PART locks part1 and goes to part1Review', () => {
    const prev = { ...initialState, phase: 'part1' };
    const state = reducer(prev, { type: ACTIONS.SUBMIT_PART });

    expect(state.phase).toBe('part1Review');
    expect(state.part1Locked).toBe(true);
  });

  it('TIMER_EXPIRED locks part1 and goes to part1Review', () => {
    const prev = { ...initialState, phase: 'part1' };
    const state = reducer(prev, { type: ACTIONS.TIMER_EXPIRED });

    expect(state.phase).toBe('part1Review');
    expect(state.part1Locked).toBe(true);
  });

  it('GO_TO_BREAK transitions to break', () => {
    const prev = { ...initialState, phase: 'part1Review' };
    const state = reducer(prev, { type: ACTIONS.GO_TO_BREAK });

    expect(state.phase).toBe('break');
  });

  it('START_PART2 transitions to part2 with new timerStartedAt', () => {
    const prev = { ...initialState, phase: 'break' };
    const state = reducer(prev, { type: ACTIONS.START_PART2 });

    expect(state.phase).toBe('part2');
    expect(state.timerStartedAt).toBeTruthy();
  });

  it('SUBMIT_PART2 locks part2 and goes to part2Review', () => {
    const prev = { ...initialState, phase: 'part2' };
    const state = reducer(prev, { type: ACTIONS.SUBMIT_PART2 });

    expect(state.phase).toBe('part2Review');
    expect(state.part2Locked).toBe(true);
  });

  it('TIMER_EXPIRED_PART2 locks part2 and goes to part2Review', () => {
    const prev = { ...initialState, phase: 'part2' };
    const state = reducer(prev, { type: ACTIONS.TIMER_EXPIRED_PART2 });

    expect(state.phase).toBe('part2Review');
    expect(state.part2Locked).toBe(true);
  });

  it('FINISH_QUIZ transitions to results', () => {
    const prev = { ...initialState, phase: 'part2Review' };
    const state = reducer(prev, { type: ACTIONS.FINISH_QUIZ });

    expect(state.phase).toBe('results');
  });

  it('SET_SESSION_ID stores part1 session ID', () => {
    const state = reducer(initialState, {
      type: ACTIONS.SET_SESSION_ID,
      payload: { part: 1, sessionId: 'session-abc' },
    });

    expect(state.part1SessionId).toBe('session-abc');
  });

  it('SET_SESSION_ID stores part2 session ID', () => {
    const state = reducer(initialState, {
      type: ACTIONS.SET_SESSION_ID,
      payload: { part: 2, sessionId: 'session-xyz' },
    });

    expect(state.part2SessionId).toBe('session-xyz');
  });

  it('RESTORE_SESSION replaces entire state including passiveParticipant', () => {
    const partner = { userId: 'u-5', displayName: 'Charlie', email: 'charlie@test.com' };
    const savedState = {
      ...initialState,
      phase: 'part1',
      playerName: 'Bob',
      passiveParticipant: partner,
      responses: { 'q-0': 'test' },
    };

    const state = reducer(initialState, {
      type: ACTIONS.RESTORE_SESSION,
      payload: savedState,
    });

    expect(state.phase).toBe('part1');
    expect(state.playerName).toBe('Bob');
    expect(state.passiveParticipant).toEqual(partner);
    expect(state.responses['q-0']).toBe('test');
  });

  it('RESET returns to initialState and clears passiveParticipant', () => {
    const prev = {
      ...initialState,
      phase: 'results',
      playerName: 'Alice',
      passiveParticipant: { userId: 'u-1', displayName: 'Bob', email: 'bob@test.com' },
      responses: { 'q-0': 'test' },
    };

    const state = reducer(prev, { type: ACTIONS.RESET });

    expect(state.phase).toBe('select');
    expect(state.playerName).toBe('');
    expect(state.passiveParticipant).toBeNull();
    expect(state.responses).toEqual({});
  });

  it('full flow: select → playerSetup → rules → part1 → part1Review → break → part2 → part2Review → results', () => {
    let state = initialState;

    state = reducer(state, {
      type: ACTIONS.SELECT_PACK,
      payload: { pack: mockPack, questions: mockQuestions, config: mockConfig },
    });
    expect(state.phase).toBe('playerSetup');

    const partner = { userId: 'u-99', displayName: 'Bob', email: 'bob@test.com' };
    state = reducer(state, {
      type: ACTIONS.SET_PLAYER,
      payload: { playerName: 'Alice', passiveParticipant: partner },
    });
    expect(state.phase).toBe('rules');
    expect(state.passiveParticipant).toEqual(partner);

    state = reducer(state, { type: ACTIONS.ACCEPT_RULES });
    expect(state.phase).toBe('part1');

    state = reducer(state, {
      type: ACTIONS.UPDATE_RESPONSE,
      payload: { questionId: 'q-0', text: 'Paris' },
    });
    expect(state.responses['q-0']).toBe('Paris');

    state = reducer(state, { type: ACTIONS.SUBMIT_PART });
    expect(state.phase).toBe('part1Review');

    state = reducer(state, { type: ACTIONS.GO_TO_BREAK });
    expect(state.phase).toBe('break');

    state = reducer(state, { type: ACTIONS.START_PART2 });
    expect(state.phase).toBe('part2');

    state = reducer(state, { type: ACTIONS.SUBMIT_PART2 });
    expect(state.phase).toBe('part2Review');

    state = reducer(state, { type: ACTIONS.FINISH_QUIZ });
    expect(state.phase).toBe('results');
  });
});
