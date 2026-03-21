import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateXP, getLevel, getLevelTitle, getLevelProgress, checkNewBadges, updateStreak, SESSION_COMPLETE_XP, LEVELS } from './gamification';

describe('gamification', () => {
  describe('calculateXP', () => {
    it('returns 0 if incorrect', () => {
      expect(calculateXP({ isCorrect: false, points: 10, timeSpentMs: 2000, streak: 3 })).toBe(0);
    });

    it('returns base points if slow and no streak', () => {
      expect(calculateXP({ isCorrect: true, points: 10, timeSpentMs: 10000, streak: 0 })).toBe(10);
    });

    it('adds speed bonus if timeSpentMs > 0 and < 5000', () => {
      expect(calculateXP({ isCorrect: true, points: 10, timeSpentMs: 3000, streak: 0 })).toBe(15);
    });

    it('adds streak multiplier if streak >= 1', () => {
      expect(calculateXP({ isCorrect: true, points: 10, timeSpentMs: 10000, streak: 2 })).toBe(16); // 10 + (2 * 3)
    });

    it('combines speed bonus and streak', () => {
      expect(calculateXP({ isCorrect: true, points: 10, timeSpentMs: 2000, streak: 3 })).toBe(24); // 10 + 5 + (3 * 3)
    });
  });

  describe('getLevel', () => {
    it('returns 1 for 0 XP', () => {
      expect(getLevel(0)).toBe(1);
    });

    it('returns the correct level based on thresholds', () => {
      expect(getLevel(99)).toBe(1);
      expect(getLevel(100)).toBe(2);
      expect(getLevel(299)).toBe(2);
      expect(getLevel(300)).toBe(3);
    });

    it('returns max level for very high XP', () => {
      expect(getLevel(50000)).toBe(10);
    });
  });

  describe('getLevelTitle', () => {
    it('returns correct titles', () => {
      expect(getLevelTitle(1)).toBe('Curious Cat');
      expect(getLevelTitle(10)).toBe('Qwizzeria Legend');
    });

    it('falls back to level 1 title for unknown levels', () => {
      expect(getLevelTitle(99)).toBe('Curious Cat');
    });
  });

  describe('getLevelProgress', () => {
    it('calculates progress for level 1 (0 to 100)', () => {
      const progress = getLevelProgress(50);
      expect(progress).toEqual({ current: 50, needed: 100, pct: 50 });
    });

    it('calculates progress for mid level (level 2: 100 to 300)', () => {
      const progress = getLevelProgress(150); // Level 2
      // Level 2 base is 100, next is 300. Needed is 200. Current is 50. Pct = 25%
      expect(progress).toEqual({ current: 50, needed: 200, pct: 25 });
    });

    it('handles max level (level 10)', () => {
      const progress = getLevelProgress(15000);
      expect(progress.pct).toBe(100);
      expect(progress.current).toBe(5000); // 15000 - 10000
      expect(progress.needed).toBe(0);
    });
  });

  describe('checkNewBadges', () => {
    it('awards first_steps badge', () => {
      const badges = checkNewBadges({ existingBadges: [], playCount: 1 });
      expect(badges).toContain('first_steps');
    });

    it('does not award if already earned', () => {
      const badges = checkNewBadges({ existingBadges: ['first_steps'], playCount: 1 });
      expect(badges).not.toContain('first_steps');
    });

    it('awards sharp_shooter for perfect score', () => {
      const badges = checkNewBadges({ existingBadges: [], totalCount: 10, correctCount: 10 });
      expect(badges).toContain('sharp_shooter');
    });

    it('awards legend for reaching level 10', () => {
      const badges = checkNewBadges({ existingBadges: [], level: 10 });
      expect(badges).toContain('legend');
    });
  });

  describe('updateStreak', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-21T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('starts a new streak if no current streak', () => {
      expect(updateStreak(null)).toEqual({ count: 1, lastPlayDate: '2026-03-21' });
    });

    it('keeps same streak if played on same day', () => {
      const current = { count: 5, lastPlayDate: '2026-03-21' };
      expect(updateStreak(current)).toEqual({ count: 5, lastPlayDate: '2026-03-21' });
    });

    it('increments streak if played next day', () => {
      const current = { count: 3, lastPlayDate: '2026-03-20' };
      expect(updateStreak(current)).toEqual({ count: 4, lastPlayDate: '2026-03-21' });
    });

    it('resets streak if missed a day', () => {
      const current = { count: 3, lastPlayDate: '2026-03-19' };
      expect(updateStreak(current)).toEqual({ count: 1, lastPlayDate: '2026-03-21' });
    });
  });
});
