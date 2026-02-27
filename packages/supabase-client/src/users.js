import { getSupabase } from './index.js';

/**
 * Fetch user profile by user ID.
 */
export async function fetchUserProfile(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch profile: ${error.message}`);
  return data;
}

/**
 * Upsert user profile (create or update).
 */
export async function upsertUserProfile(userId, profileData) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ id: userId, ...profileData, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
  return data;
}

/**
 * Fetch aggregated stats for a user via Postgres RPC.
 */
export async function fetchUserStats(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_user_stats', { target_user_id: userId });

  if (error) throw new Error(`Failed to fetch stats: ${error.message}`);
  return data;
}

/**
 * Fetch paginated session history for a user.
 */
export async function fetchUserHistory({ userId, type = 'all', status = 'all', page = 1, pageSize = 20 }) {
  const supabase = getSupabase();

  let query = supabase
    .from('quiz_sessions')
    .select('id, is_free_quiz, quiz_pack_id, started_at, completed_at, score, total_questions, status, metadata, quiz_packs(title)', { count: 'exact' })
    .eq('user_id', userId);

  if (type === 'free') query = query.eq('is_free_quiz', true);
  if (type === 'pack') {
    query = query.eq('is_free_quiz', false).neq('metadata->>is_host_quiz', 'true');
  }
  if (type === 'host') {
    query = query.eq('is_free_quiz', false).eq('metadata->>is_host_quiz', 'true');
  }
  if (status !== 'all') query = query.eq('status', status);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order('started_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to fetch history: ${error.message}`);
  return { data: data || [], count: count || 0, page, pageSize };
}

/**
 * Fetch session detail with all attempts joined with question data.
 */
export async function fetchSessionDetail(sessionId) {
  const supabase = getSupabase();

  const [sessionResult, attemptsResult] = await Promise.all([
    supabase.from('quiz_sessions')
      .select('*, quiz_packs(title)')
      .eq('id', sessionId)
      .single(),
    supabase.from('question_attempts')
      .select('*, questions_master(id, question_text, answer_text, category)')
      .eq('session_id', sessionId)
      .order('attempted_at', { ascending: true }),
  ]);

  if (sessionResult.error) throw new Error(`Failed to fetch session: ${sessionResult.error.message}`);
  if (attemptsResult.error) throw new Error(`Failed to fetch attempts: ${attemptsResult.error.message}`);

  return { session: sessionResult.data, attempts: attemptsResult.data || [] };
}

// ============================================================
// Subscription Functions
// ============================================================

/**
 * Get subscription state for a user via Postgres RPC.
 * Returns: { status, tier, gated, trialEnd?, trialDaysLeft?, cancelAtPeriodEnd?, currentPeriodEnd?, stripeCustomerId?, role? }
 */
export async function getSubscriptionState(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_subscription_state', { target_user_id: userId });

  if (error) throw new Error(`Failed to fetch subscription state: ${error.message}`);
  return data;
}

/**
 * Get subscription analytics (admin-only).
 */
export async function getSubscriptionAnalytics() {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_subscription_analytics');

  if (error) throw new Error(`Failed to fetch subscription analytics: ${error.message}`);
  return data;
}

// ============================================================
// RBAC Functions
// ============================================================

const ROLE_HIERARCHY = ['user', 'premium', 'editor', 'admin', 'superadmin'];

/**
 * Check if a role meets or exceeds a minimum required role.
 */
export function hasMinRole(userRole, minRole) {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole);
}

/**
 * Fetch only the role for a user (lightweight).
 */
export async function fetchUserRole(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch role: ${error.message}`);
  return data?.role || 'user';
}

/**
 * Fetch all users with profiles (superadmin only).
 */
export async function fetchAllUsers() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch users: ${error.message}`);
  return data || [];
}

/**
 * Update a user's role (superadmin only).
 */
export async function updateUserRole(userId, role) {
  if (!ROLE_HIERARCHY.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update role: ${error.message}`);
  return data;
}

/**
 * Fetch all users with emails via admin RPC (admin/superadmin only).
 * Returns { users: [...], total: number }
 */
export async function fetchAllUsersWithEmail({ search, role, page = 1, pageSize = 20 } = {}) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_all_users_admin', {
    search_query: search || null,
    role_filter: role || null,
    result_limit: pageSize,
    result_offset: (page - 1) * pageSize,
  });

  if (error) throw new Error(`Failed to fetch users: ${error.message}`);
  return data || { users: [], total: 0 };
}
