import { getSupabase } from './index.js';

/**
 * Look up a registered user by email.
 * Returns { userId, displayName } if found, or null if not found.
 * Throws on auth errors or self-lookup.
 */
export async function lookupUserByEmail(email) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('lookup_user_by_email', {
    target_email: email,
  });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  return {
    userId: data[0].user_id,
    displayName: data[0].display_name,
  };
}

/**
 * Check if a user is available for doubles (not in an active doubles session).
 * Returns true if available, false if already in an active session.
 */
export async function checkDoublesAvailability(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('check_doubles_availability', {
    target_user_id: userId,
  });

  if (error) throw new Error(error.message);
  return data;
}
