/**
 * Pure utility functions for pack expiration logic.
 * Keeps expiration concerns out of UI components.
 */

const SOON_DAYS_DEFAULT = 7;

/**
 * Check if a pack has expired.
 * @param {string|null} expiresAt - ISO timestamp or null
 * @returns {boolean}
 */
export function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt) <= new Date();
}

/**
 * Check if a pack expires within the given number of days.
 * Returns false if already expired or no expiration set.
 * @param {string|null} expiresAt - ISO timestamp or null
 * @param {number} [days=7]
 * @returns {boolean}
 */
export function isExpiringSoon(expiresAt, days = SOON_DAYS_DEFAULT) {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  const now = new Date();
  if (expiry <= now) return false;
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return expiry <= threshold;
}

/**
 * Get the expiration status of a pack.
 * @param {string|null} expiresAt - ISO timestamp or null
 * @param {number} [soonDays=7]
 * @returns {'expired'|'expiring_soon'|'active'|null} null = no expiration set
 */
export function getExpirationStatus(expiresAt, soonDays = SOON_DAYS_DEFAULT) {
  if (!expiresAt) return null;
  if (isExpired(expiresAt)) return 'expired';
  if (isExpiringSoon(expiresAt, soonDays)) return 'expiring_soon';
  return 'active';
}

/**
 * Format an expiration timestamp for display.
 * @param {string|null} expiresAt - ISO timestamp or null
 * @returns {string} Formatted date string or '—'
 */
export function formatExpiration(expiresAt) {
  if (!expiresAt) return '—';
  return new Date(expiresAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Convert a datetime-local input value to an ISO string for DB storage.
 * Returns null if empty (no expiration).
 * @param {string} localDatetimeStr - Value from <input type="datetime-local">
 * @returns {string|null}
 */
export function toExpiresAtValue(localDatetimeStr) {
  if (!localDatetimeStr) return null;
  return new Date(localDatetimeStr).toISOString();
}

/**
 * Convert an ISO timestamp to a datetime-local input value.
 * Returns empty string if null (no expiration).
 * @param {string|null} isoStr - ISO timestamp from DB
 * @returns {string}
 */
export function toDatetimeLocalValue(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  // datetime-local expects YYYY-MM-DDTHH:mm format in local time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
