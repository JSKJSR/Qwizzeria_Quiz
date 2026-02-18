const STORAGE_KEY = 'qwizzeria_host_session';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save host quiz session state to localStorage.
 */
export function saveHostSession(state) {
  try {
    const payload = {
      ...state,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Load host quiz session from localStorage.
 * Returns null if no session or session is expired (24h).
 */
export function loadHostSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clear stored host session.
 */
export function clearHostSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
