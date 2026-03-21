import { getSupabase } from './index.js';
import { logAdminAction } from './auditLog.js';

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
    query = query.eq('is_free_quiz', false)
      .neq('metadata->>is_host_quiz', 'true')
      .neq('metadata->>format', 'doubles');
  }
  if (type === 'host') {
    query = query.eq('is_free_quiz', false).eq('metadata->>is_host_quiz', 'true');
  }
  if (type === 'doubles') {
    query = query.eq('is_free_quiz', false).eq('metadata->>format', 'doubles');
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

const ROLE_HIERARCHY = ['user', 'editor', 'admin', 'superadmin'];

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

  logAdminAction({ action: 'update_user_role', tableName: 'user_profiles', recordId: userId, payload: { role } });

  return data;
}

/**
 * Fetch all users with emails via admin RPC (admin/superadmin only).
 * Returns { users: [...], total: number }
 */
export async function fetchUserManagementKPIs() {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_user_management_kpis');

  if (error) throw new Error(`Failed to fetch KPIs: ${error.message}`);
  return data;
}

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

// ============================================================
// Admin Doubles Functions
// ============================================================

/**
 * Fetch all doubles sessions for admin review (admin-only via RLS).
 */
export async function fetchDoublesSessionsAdmin({ userId, packId, status, dateFrom, dateTo, page = 1, pageSize = 20 } = {}) {
  const supabase = getSupabase();

  // quiz_sessions.user_id FKs to auth.users, not user_profiles — fetch sessions + packs, then batch-resolve display names
  let query = supabase
    .from('quiz_sessions')
    .select('id, user_id, quiz_pack_id, started_at, completed_at, score, total_questions, status, metadata, quiz_packs(title)', { count: 'exact' })
    .eq('metadata->>format', 'doubles');

  if (userId) query = query.eq('user_id', userId);
  if (packId) query = query.eq('quiz_pack_id', packId);
  if (status && status !== 'all') query = query.eq('status', status);
  if (dateFrom) query = query.gte('started_at', dateFrom);
  if (dateTo) query = query.lte('started_at', dateTo);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order('started_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to fetch doubles sessions: ${error.message}`);

  const sessions = data || [];

  // Batch-fetch display names for unique user IDs
  const userIds = [...new Set(sessions.map((s) => s.user_id).filter(Boolean))];
  let profileMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name')
      .in('id', userIds);
    for (const p of (profiles || [])) {
      profileMap[p.id] = p;
    }
  }

  // Attach user_profiles to each session
  const enriched = sessions.map((s) => ({
    ...s,
    user_profiles: profileMap[s.user_id] || null,
  }));

  return { data: enriched, count: count || 0, page, pageSize };
}

/**
 * Grade all doubles responses for a session (admin-only via RLS).
 * @param {string} sessionId
 * @param {Object} grades - { [questionId]: true/false }
 */
export async function gradeAllDoublesResponses(sessionId, grades) {
  const supabase = getSupabase();

  // Read current metadata
  const { data: session, error: readErr } = await supabase
    .from('quiz_sessions')
    .select('metadata')
    .eq('id', sessionId)
    .single();

  if (readErr) throw new Error(`Failed to read session: ${readErr.message}`);

  const updatedMetadata = { ...session.metadata, grades };

  const { error: writeErr } = await supabase
    .from('quiz_sessions')
    .update({ metadata: updatedMetadata })
    .eq('id', sessionId);

  if (writeErr) throw new Error(`Failed to grade session: ${writeErr.message}`);

  logAdminAction({ action: 'grade_doubles_session', tableName: 'quiz_sessions', recordId: sessionId, payload: { gradeCount: Object.keys(grades).length } });
}

/**
 * Fetch gamification stats for a user.
 */
export async function fetchGamificationStats(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('xp_total, daily_streak_count, daily_streak_last_play, badges, total_correct')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch gamification stats: ${error.message}`);
  return data;
}

/**
 * Save gamification stats for a user (fire-and-forget from caller).
 */
export async function saveGamificationStats(userId, stats) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('user_profiles')
    .update({
      xp_total: stats.xp_total,
      daily_streak_count: stats.daily_streak_count,
      daily_streak_last_play: stats.daily_streak_last_play,
      badges: stats.badges,
      total_correct: stats.total_correct,
    })
    .eq('id', userId);

  if (error) throw new Error(`Failed to save gamification stats: ${error.message}`);
}
