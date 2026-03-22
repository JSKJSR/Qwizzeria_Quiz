import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isExpired,
  isExpiringSoon,
  getExpirationStatus,
  formatExpiration,
  toExpiresAtValue,
  toDatetimeLocalValue,
} from './packExpiration.js';

describe('packExpiration', () => {
  const NOW = new Date('2026-03-22T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ——— isExpired ———

  describe('isExpired', () => {
    it('returns false for null', () => {
      expect(isExpired(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isExpired(undefined)).toBe(false);
    });

    it('returns true for a past date', () => {
      expect(isExpired('2026-03-21T00:00:00Z')).toBe(true);
    });

    it('returns true for the exact current time', () => {
      expect(isExpired('2026-03-22T12:00:00Z')).toBe(true);
    });

    it('returns false for a future date', () => {
      expect(isExpired('2026-03-23T00:00:00Z')).toBe(false);
    });
  });

  // ——— isExpiringSoon ———

  describe('isExpiringSoon', () => {
    it('returns false for null', () => {
      expect(isExpiringSoon(null)).toBe(false);
    });

    it('returns false for already expired', () => {
      expect(isExpiringSoon('2026-03-21T00:00:00Z')).toBe(false);
    });

    it('returns true for date within 7 days', () => {
      expect(isExpiringSoon('2026-03-28T00:00:00Z')).toBe(true);
    });

    it('returns false for date beyond 7 days', () => {
      expect(isExpiringSoon('2026-04-01T00:00:00Z')).toBe(false);
    });

    it('respects custom days parameter', () => {
      expect(isExpiringSoon('2026-03-24T00:00:00Z', 3)).toBe(true);
      expect(isExpiringSoon('2026-03-28T00:00:00Z', 3)).toBe(false);
    });
  });

  // ——— getExpirationStatus ———

  describe('getExpirationStatus', () => {
    it('returns null for no expiration', () => {
      expect(getExpirationStatus(null)).toBeNull();
    });

    it('returns "expired" for past date', () => {
      expect(getExpirationStatus('2026-03-20T00:00:00Z')).toBe('expired');
    });

    it('returns "expiring_soon" for date within 7 days', () => {
      expect(getExpirationStatus('2026-03-27T00:00:00Z')).toBe('expiring_soon');
    });

    it('returns "active" for date far in the future', () => {
      expect(getExpirationStatus('2026-06-01T00:00:00Z')).toBe('active');
    });
  });

  // ——— formatExpiration ———

  describe('formatExpiration', () => {
    it('returns em dash for null', () => {
      expect(formatExpiration(null)).toBe('—');
    });

    it('returns a formatted string for a valid date', () => {
      const result = formatExpiration('2026-04-15T14:30:00Z');
      expect(result).toContain('2026');
      expect(result).toContain('Apr');
    });
  });

  // ——— toExpiresAtValue ———

  describe('toExpiresAtValue', () => {
    it('returns null for empty string', () => {
      expect(toExpiresAtValue('')).toBeNull();
    });

    it('returns null for falsy value', () => {
      expect(toExpiresAtValue(null)).toBeNull();
    });

    it('returns ISO string for a datetime-local value', () => {
      const result = toExpiresAtValue('2026-04-15T14:30');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  // ——— toDatetimeLocalValue ———

  describe('toDatetimeLocalValue', () => {
    it('returns empty string for null', () => {
      expect(toDatetimeLocalValue(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(toDatetimeLocalValue(undefined)).toBe('');
    });

    it('returns YYYY-MM-DDTHH:mm format', () => {
      const result = toDatetimeLocalValue('2026-04-15T14:30:00Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });

  // ——— round-trip ———

  describe('round-trip conversion', () => {
    it('preserves the value through toExpiresAtValue → toDatetimeLocalValue', () => {
      const input = '2026-04-15T14:30';
      const iso = toExpiresAtValue(input);
      const roundTripped = toDatetimeLocalValue(iso);
      // Should match the original input (minute precision)
      expect(roundTripped).toBe(input);
    });
  });
});
