import { getSupabase } from './index.js';

/**
 * Fetch global leaderboard via RPC.
 * @param {'all_time'|'this_week'|'this_month'} timeFilter
 * @param {number} limit
 */
export async function fetchGlobalLeaderboard(timeFilter = 'all_time', limit = 50) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_global_leaderboard', {
    time_filter: timeFilter,
    result_limit: limit,
  });

  if (error) throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  return data || [];
}

/**
 * Fetch per-pack leaderboard via RPC.
 * @param {string} packId
 * @param {number} limit
 */
export async function fetchPackLeaderboard(packId, limit = 10) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_pack_leaderboard', {
    target_pack_id: packId,
    result_limit: limit,
  });

  if (error) throw new Error(`Failed to fetch pack leaderboard: ${error.message}`);
  return data || [];
}
