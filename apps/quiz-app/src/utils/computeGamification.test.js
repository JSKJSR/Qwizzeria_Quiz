import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const store = {};
const localStorageMock = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, val) => { store[key] = val; }),
  removeItem: vi.fn((key) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k in store) delete store[k]; }),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock supabase-client (fire-and-forget DB calls)
vi.mock('@qwizzeria/supabase-client', () => ({
  saveGamificationStats: vi.fn(() => Promise.resolve()),
  updateMissionProgress: vi.fn(() => Promise.resolve({ newly_completed: [], xp_earned: 0 })),
  addWeeklyLeagueXP: vi.fn(() => Promise.resolve()),
  useStreakFreeze: vi.fn(() => Promise.resolve(true)),
  MISSION_DEFINITIONS: {},
}));

import { computeGamification, syncGamificationToDB } from './computeGamification';
import { saveGamificationStats, updateMissionProgress, addWeeklyLeagueXP, useStreakFreeze as consumeStreakFreeze } from '@qwizzeria/supabase-client';
import { SESSION_COMPLETE_XP } from './gamification';

describe('computeGamification', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds session XP + completion bonus to localStorage', () => {
    const result = computeGamification({
      results: [{ isCorrect: true }, { isCorrect: false }],
      sessionXP: 20,
      totalQuestions: 2,
      bestStreak: 1,
    });

    expect(result.sessionXP).toBe(20 + SESSION_COMPLETE_XP);
    expect(result.totalXP).toBe(20 + SESSION_COMPLETE_XP);
    expect(result.level).toBe(1);
    expect(result.levelTitle).toBe('Curious Cat');
  });

  it('detects level-up', () => {
    // Pre-fill XP to just below level 2 (100 XP threshold)
    store[`qwizzeria_xp`] = '90';

    const result = computeGamification({
      results: [{ isCorrect: true }],
      sessionXP: 10,
      totalQuestions: 1,
      bestStreak: 1,
    });

    // 90 + 10 + 25(completion) = 125 -> level 2
    expect(result.leveledUp).toBe(true);
    expect(result.level).toBe(2);
    expect(result.totalXP).toBe(125);
  });

  it('awards first_steps badge on first play', () => {
    const result = computeGamification({
      results: [{ isCorrect: true }],
      sessionXP: 10,
      totalQuestions: 1,
      bestStreak: 1,
    });

    expect(result.newBadges).toContain('first_steps');
    expect(result.playCount).toBe(1);
  });

  it('awards sharp_shooter for perfect score', () => {
    const result = computeGamification({
      results: [{ isCorrect: true }, { isCorrect: true }, { isCorrect: true }],
      sessionXP: 30,
      totalQuestions: 3,
      bestStreak: 3,
    });

    expect(result.newBadges).toContain('sharp_shooter');
  });

  it('does not duplicate existing badges', () => {
    store[`qwizzeria_badges`] = JSON.stringify(['first_steps']);

    const result = computeGamification({
      results: [{ isCorrect: true }],
      sessionXP: 10,
      totalQuestions: 1,
      bestStreak: 1,
    });

    expect(result.newBadges).not.toContain('first_steps');
  });

  it('starts a new daily streak', () => {
    const result = computeGamification({
      results: [{ isCorrect: true }],
      sessionXP: 10,
      totalQuestions: 1,
      bestStreak: 1,
    });

    expect(result.dailyStreak.count).toBe(1);
    expect(result.dailyStreak.lastPlayDate).toBe('2026-04-05');
    expect(result.streakFrozeUsed).toBe(false);
  });

  it('uses streak freeze when available and missed 1 day', () => {
    // Streak from 2 days ago (missed yesterday)
    store[`qwizzeria_daily_streak`] = JSON.stringify({ count: 5, lastPlayDate: '2026-04-03' });
    store[`qwizzeria_streak_freezes`] = '2';

    const result = computeGamification({
      results: [{ isCorrect: true }],
      sessionXP: 10,
      totalQuestions: 1,
      bestStreak: 1,
    });

    expect(result.streakFrozeUsed).toBe(true);
    expect(result.dailyStreak.count).toBe(6); // Preserved + incremented
    // Freeze count decremented
    expect(store[`qwizzeria_streak_freezes`]).toBe('1');
  });

  it('resets streak when no freeze available and missed 1 day', () => {
    store[`qwizzeria_daily_streak`] = JSON.stringify({ count: 5, lastPlayDate: '2026-04-03' });
    store[`qwizzeria_streak_freezes`] = '0';

    const result = computeGamification({
      results: [{ isCorrect: true }],
      sessionXP: 10,
      totalQuestions: 1,
      bestStreak: 1,
    });

    expect(result.streakFrozeUsed).toBe(false);
    expect(result.dailyStreak.count).toBe(1); // Reset
  });
});

describe('syncGamificationToDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('returns null for missing userId', async () => {
    const result = await syncGamificationToDB(null, { sessionXP: 10 }, {});
    expect(result).toBeNull();
    expect(saveGamificationStats).not.toHaveBeenCalled();
  });

  it('calls saveGamificationStats before updateMissionProgress', async () => {
    const callOrder = [];
    saveGamificationStats.mockImplementation(() => {
      callOrder.push('save');
      return Promise.resolve();
    });
    updateMissionProgress.mockImplementation(() => {
      callOrder.push('mission');
      return Promise.resolve({ newly_completed: [], xp_earned: 0 });
    });

    const gamData = {
      totalXP: 100,
      sessionXP: 35,
      dailyStreak: { count: 1, lastPlayDate: '2026-04-05' },
      streakFrozeUsed: false,
    };

    await syncGamificationToDB('user-1', gamData, {
      totalQuestions: 5,
      correctCount: 3,
      bestStreak: 2,
      isPackQuiz: false,
    });

    expect(callOrder).toEqual(['save', 'mission']);
    expect(addWeeklyLeagueXP).toHaveBeenCalledWith('user-1', 35);
  });

  it('calls consumeStreakFreeze when freeze was used', async () => {
    const gamData = {
      totalXP: 100,
      sessionXP: 35,
      dailyStreak: { count: 6, lastPlayDate: '2026-04-05' },
      streakFrozeUsed: true,
    };

    await syncGamificationToDB('user-1', gamData, {
      totalQuestions: 5,
      correctCount: 3,
      bestStreak: 2,
      isPackQuiz: true,
    });

    expect(consumeStreakFreeze).toHaveBeenCalledWith('user-1');
  });

  it('does not call consumeStreakFreeze when freeze was not used', async () => {
    const gamData = {
      totalXP: 100,
      sessionXP: 35,
      dailyStreak: { count: 1, lastPlayDate: '2026-04-05' },
      streakFrozeUsed: false,
    };

    await syncGamificationToDB('user-1', gamData, {
      totalQuestions: 5,
      correctCount: 3,
      bestStreak: 2,
      isPackQuiz: false,
    });

    expect(consumeStreakFreeze).not.toHaveBeenCalled();
  });

  it('passes isPerfect correctly', async () => {
    const gamData = {
      totalXP: 50,
      sessionXP: 25,
      dailyStreak: { count: 1, lastPlayDate: '2026-04-05' },
      streakFrozeUsed: false,
    };

    await syncGamificationToDB('user-1', gamData, {
      totalQuestions: 3,
      correctCount: 3,
      bestStreak: 3,
      isPackQuiz: true,
    });

    expect(updateMissionProgress).toHaveBeenCalledWith('user-1', expect.objectContaining({
      isPerfect: true,
      isPackQuiz: true,
    }));
  });
});
