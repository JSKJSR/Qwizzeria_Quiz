const STORAGE_KEY = 'qwizzeria_host_session';
const BUZZER_KEY = 'qwizzeria_host_buzzer';
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

/**
 * Save buzzer room state alongside the host session.
 * Kept separate so it doesn't bloat the reducer state.
 */
export function saveBuzzerState({ buzzerEnabled, roomCode, roomId }) {
  try {
    if (!buzzerEnabled) {
      localStorage.removeItem(BUZZER_KEY);
      return;
    }
    localStorage.setItem(BUZZER_KEY, JSON.stringify({
      buzzerEnabled,
      roomCode,
      roomId,
      savedAt: Date.now(),
    }));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Load saved buzzer state.
 * Returns null if no state or expired.
 */
export function loadBuzzerState() {
  try {
    const raw = localStorage.getItem(BUZZER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(BUZZER_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clear stored buzzer state.
 */
export function clearBuzzerState() {
  try {
    localStorage.removeItem(BUZZER_KEY);
  } catch {
    // Ignore
  }
}
