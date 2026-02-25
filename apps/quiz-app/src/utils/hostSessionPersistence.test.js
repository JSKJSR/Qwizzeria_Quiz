import { describe, it, expect, beforeEach } from 'vitest';
import { saveHostSession, loadHostSession, clearHostSession } from './hostSessionPersistence.js';

describe('hostSessionPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveHostSession', () => {
    it('saves state to localStorage with savedAt timestamp', () => {
      const state = { phase: 'grid', participants: ['A', 'B'] };
      saveHostSession(state);

      const stored = JSON.parse(localStorage.getItem('qwizzeria_host_session'));
      expect(stored.phase).toBe('grid');
      expect(stored.participants).toEqual(['A', 'B']);
      expect(typeof stored.savedAt).toBe('number');
      expect(stored.savedAt).toBeGreaterThan(0);
    });

    it('handles storage errors gracefully', () => {
      const original = localStorage.setItem;
      localStorage.setItem = () => { throw new Error('QuotaExceeded'); };

      expect(() => saveHostSession({ phase: 'grid' })).not.toThrow();

      localStorage.setItem = original;
    });
  });

  describe('loadHostSession', () => {
    it('returns null when localStorage is empty', () => {
      expect(loadHostSession()).toBeNull();
    });

    it('returns parsed session when valid and not expired', () => {
      const state = { phase: 'grid', savedAt: Date.now() };
      localStorage.setItem('qwizzeria_host_session', JSON.stringify(state));

      const result = loadHostSession();
      expect(result.phase).toBe('grid');
    });

    it('returns null and removes entry when expired (25h ago)', () => {
      const state = { phase: 'grid', savedAt: Date.now() - 25 * 60 * 60 * 1000 };
      localStorage.setItem('qwizzeria_host_session', JSON.stringify(state));

      expect(loadHostSession()).toBeNull();
      expect(localStorage.getItem('qwizzeria_host_session')).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      localStorage.setItem('qwizzeria_host_session', '{invalid json');
      expect(loadHostSession()).toBeNull();
    });
  });

  describe('clearHostSession', () => {
    it('removes the storage entry', () => {
      localStorage.setItem('qwizzeria_host_session', '{"phase":"grid"}');
      clearHostSession();
      expect(localStorage.getItem('qwizzeria_host_session')).toBeNull();
    });
  });
});
