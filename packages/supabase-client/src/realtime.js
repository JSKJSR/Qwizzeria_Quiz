import { getSupabase } from './index.js';

/**
 * Subscribe to tournament match updates via Supabase Realtime.
 * Listens for UPDATE events on host_tournament_matches filtered by tournament_id.
 *
 * @param {string} tournamentId - Tournament to subscribe to
 * @param {(match: object) => void} onMatchUpdate - Callback with updated match row
 * @returns {object} Supabase Realtime channel (pass to unsubscribeTournament)
 */
export function subscribeTournamentMatches(tournamentId, onMatchUpdate) {
  const supabase = getSupabase();

  const channel = supabase
    .channel(`tournament-${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'host_tournament_matches',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      (payload) => {
        onMatchUpdate(payload.new);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a tournament Realtime channel.
 *
 * @param {object} channel - Channel returned by subscribeTournamentMatches
 */
export function unsubscribeTournament(channel) {
  if (channel) {
    const supabase = getSupabase();
    supabase.removeChannel(channel);
  }
}
