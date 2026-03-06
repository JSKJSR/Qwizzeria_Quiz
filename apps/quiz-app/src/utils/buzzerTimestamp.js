/**
 * Buzzer Timestamp Utilities
 *
 * Server-relative ordering: all buzz times are measured as offsets
 * from when each client received the question_open event, eliminating
 * clock sync issues between devices.
 */

/** Threshold in ms — buzzes within this window are considered a tie */
export const TIE_THRESHOLD_MS = 50;

/**
 * Sort and rank buzz entries by offset.
 * @param {Array<{userId: string, displayName: string, buzzOffset: number}>} buzzes
 * @returns {Array<{userId, displayName, buzzOffset, rank, isTied}>}
 */
export function rankBuzzes(buzzes) {
  if (!buzzes || buzzes.length === 0) return [];

  const sorted = [...buzzes].sort((a, b) => a.buzzOffset - b.buzzOffset);

  return sorted.map((buzz, i) => {
    const prevOffset = i > 0 ? sorted[i - 1].buzzOffset : null;
    const isTied = prevOffset !== null && (buzz.buzzOffset - prevOffset) <= TIE_THRESHOLD_MS;
    // First place can also be tied if second is within threshold
    const nextOffset = i < sorted.length - 1 ? sorted[i + 1].buzzOffset : null;
    const isTiedWithNext = nextOffset !== null && (nextOffset - buzz.buzzOffset) <= TIE_THRESHOLD_MS;

    return {
      ...buzz,
      rank: i + 1,
      isTied: isTied || (i === 0 && isTiedWithNext),
    };
  });
}

/**
 * Determine the buzz winner, handling ties.
 * @param {Array<{userId: string, displayName: string, buzzOffset: number}>} buzzes
 * @returns {{ winner: object|null, isTied: boolean, tiedBuzzes: Array }}
 */
export function determineBuzzWinner(buzzes) {
  const ranked = rankBuzzes(buzzes);

  if (ranked.length === 0) {
    return { winner: null, isTied: false, tiedBuzzes: [] };
  }

  const first = ranked[0];

  // Check if top buzzes are tied
  const tiedBuzzes = ranked.filter(b => b.isTied || b.rank === 1);

  if (tiedBuzzes.length > 1 && tiedBuzzes.every(b => b.isTied || b === first)) {
    return {
      winner: null,
      isTied: true,
      tiedBuzzes: tiedBuzzes.map(({ userId, displayName, buzzOffset }) => ({
        userId, displayName, buzzOffset,
      })),
    };
  }

  return {
    winner: { userId: first.userId, displayName: first.displayName, buzzOffset: first.buzzOffset },
    isTied: false,
    tiedBuzzes: [],
  };
}

/**
 * Validate a buzz event (reject if before question opened or unreasonably fast).
 * @param {number} buzzOffset - ms since question_open was received
 * @returns {boolean}
 */
export function isValidBuzz(buzzOffset) {
  // Reject negative offsets (buzzed before question opened)
  if (buzzOffset < 0) return false;
  // Reject unreasonably fast buzzes (< 100ms is likely automated)
  if (buzzOffset < 100) return false;
  return true;
}
