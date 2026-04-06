import { getSupabase } from './index.js';

/**
 * League definitions for UI display.
 */
export const LEAGUES = {
  bronze: { name: 'Bronze', color: '#cd7f32', icon: '3' },
  silver: { name: 'Silver', color: '#c0c0c0', icon: '2' },
  gold: { name: 'Gold', color: '#ffd700', icon: '1' },
  diamond: { name: 'Diamond', color: '#b9f2ff', icon: 'D' },
};

export const LEAGUE_ORDER = ['bronze', 'silver', 'gold', 'diamond'];

/**
 * Get the user's current league and weekly XP.
 * Creates a league entry for the current week if none exists.
 */
export async function fetchUserLeague(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_user_league', {
    target_user_id: userId,
  });

  if (error) throw new Error(`Failed to fetch league: ${error.message}`);
  return data;
}

/**
 * Add XP to the user's weekly league total.
 * Called after quiz completion alongside gamification sync.
 */
export async function addWeeklyLeagueXP(userId, xpAmount) {
  const supabase = getSupabase();
  const { error } = await supabase.rpc('add_weekly_league_xp', {
    target_user_id: userId,
    xp_amount: xpAmount,
  });

  if (error) throw new Error(`Failed to add league XP: ${error.message}`);
}

/**
 * Fetch league standings for a specific league.
 * @param {string} league - 'bronze' | 'silver' | 'gold' | 'diamond'
 * @param {number} limit
 */
export async function fetchLeagueStandings(league = 'bronze', limit = 50) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_league_standings', {
    target_league: league,
    target_week: null,
    result_limit: limit,
  });

  if (error) throw new Error(`Failed to fetch standings: ${error.message}`);
  return data || [];
}
