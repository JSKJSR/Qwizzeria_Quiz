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
  if (type === 'pack') query = query.eq('is_free_quiz', false);
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
