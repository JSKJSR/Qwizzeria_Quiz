import { describe, it, expect } from 'vitest';
import { rankBuzzes, determineBuzzWinner, isValidBuzz, TIE_THRESHOLD_MS } from './buzzerTimestamp';

describe('buzzerTimestamp', () => {
  describe('rankBuzzes', () => {
    it('returns empty array for no buzzes', () => {
      expect(rankBuzzes([])).toEqual([]);
      expect(rankBuzzes(null)).toEqual([]);
    });

    it('ranks buzzes by offset ascending', () => {
      const buzzes = [
        { userId: 'b', displayName: 'Bob', buzzOffset: 500 },
        { userId: 'a', displayName: 'Alice', buzzOffset: 200 },
        { userId: 'c', displayName: 'Charlie', buzzOffset: 800 },
      ];
      const ranked = rankBuzzes(buzzes);
      expect(ranked[0].userId).toBe('a');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].userId).toBe('b');
      expect(ranked[1].rank).toBe(2);
      expect(ranked[2].userId).toBe('c');
      expect(ranked[2].rank).toBe(3);
    });

    it('marks tied buzzes within threshold', () => {
      const buzzes = [
        { userId: 'a', displayName: 'Alice', buzzOffset: 200 },
        { userId: 'b', displayName: 'Bob', buzzOffset: 230 }, // 30ms diff < 50ms threshold
      ];
      const ranked = rankBuzzes(buzzes);
      expect(ranked[0].isTied).toBe(true);
      expect(ranked[1].isTied).toBe(true);
    });

    it('does not mark non-tied buzzes', () => {
      const buzzes = [
        { userId: 'a', displayName: 'Alice', buzzOffset: 200 },
        { userId: 'b', displayName: 'Bob', buzzOffset: 400 }, // 200ms diff > threshold
      ];
      const ranked = rankBuzzes(buzzes);
      expect(ranked[0].isTied).toBe(false);
      expect(ranked[1].isTied).toBe(false);
    });

    it('handles single buzz', () => {
      const buzzes = [{ userId: 'a', displayName: 'Alice', buzzOffset: 300 }];
      const ranked = rankBuzzes(buzzes);
      expect(ranked).toHaveLength(1);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].isTied).toBe(false);
    });
  });

  describe('determineBuzzWinner', () => {
    it('returns null winner for empty buzzes', () => {
      const result = determineBuzzWinner([]);
      expect(result.winner).toBeNull();
      expect(result.isTied).toBe(false);
    });

    it('returns clear winner when no tie', () => {
      const buzzes = [
        { userId: 'a', displayName: 'Alice', buzzOffset: 200 },
        { userId: 'b', displayName: 'Bob', buzzOffset: 500 },
      ];
      const result = determineBuzzWinner(buzzes);
      expect(result.winner.userId).toBe('a');
      expect(result.winner.displayName).toBe('Alice');
      expect(result.isTied).toBe(false);
    });

    it('detects tie when top buzzes are within threshold', () => {
      const buzzes = [
        { userId: 'a', displayName: 'Alice', buzzOffset: 200 },
        { userId: 'b', displayName: 'Bob', buzzOffset: 220 },
      ];
      const result = determineBuzzWinner(buzzes);
      expect(result.isTied).toBe(true);
      expect(result.winner).toBeNull();
      expect(result.tiedBuzzes).toHaveLength(2);
    });

    it('returns winner for single buzz', () => {
      const buzzes = [{ userId: 'a', displayName: 'Alice', buzzOffset: 300 }];
      const result = determineBuzzWinner(buzzes);
      expect(result.winner.userId).toBe('a');
      expect(result.isTied).toBe(false);
    });
  });

  describe('isValidBuzz', () => {
    it('rejects negative offset', () => {
      expect(isValidBuzz(-10)).toBe(false);
    });

    it('rejects unreasonably fast buzz (< 100ms)', () => {
      expect(isValidBuzz(50)).toBe(false);
      expect(isValidBuzz(99)).toBe(false);
    });

    it('accepts valid buzz offset', () => {
      expect(isValidBuzz(100)).toBe(true);
      expect(isValidBuzz(500)).toBe(true);
      expect(isValidBuzz(3000)).toBe(true);
    });
  });

  describe('TIE_THRESHOLD_MS', () => {
    it('is 50ms', () => {
      expect(TIE_THRESHOLD_MS).toBe(50);
    });
  });
});
