import { getSupabase } from './index.js';
import { logAdminAction } from './auditLog.js';

// ============================================================
// Admin functions
// ============================================================

/**
 * Fetch all packs with optional filters and pagination.
 */
export async function fetchAllPacks({ category, status, search, page = 1, pageSize = 20 } = {}) {
  const supabase = getSupabase();

  let query = supabase
    .from('quiz_packs')
    .select('*, pack_questions(count)', { count: 'exact' });

  if (category) {
    query = query.eq('category', category);
  }
  if (status === 'expired') {
    query = query.eq('status', 'active').lt('expires_at', new Date().toISOString());
  } else if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('updated_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch packs: ${error.message}`);
  }

  const packs = (data || []).map(({ pack_questions, ...rest }) => ({
    ...rest,
    question_count: pack_questions?.[0]?.count ?? rest.question_count,
  }));

  return { data: packs, count: count || 0, page, pageSize };
}

/**
 * Fetch a single pack by ID.
 */
export async function fetchPackById(id) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('quiz_packs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch pack: ${error.message}`);
  }

  return data;
}

/**
 * Create a new pack.
 */
export async function createPack(packData) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('quiz_packs')
    .insert(packData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create pack: ${error.message}`);
  }

  logAdminAction({ action: 'create_pack', tableName: 'quiz_packs', recordId: data.id, payload: packData });

  return data;
}

/**
 * Update an existing pack.
 */
export async function updatePack(id, packData) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('quiz_packs')
    .update({ ...packData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update pack: ${error.message}`);
  }

  logAdminAction({ action: 'update_pack', tableName: 'quiz_packs', recordId: id, payload: packData });

  return data;
}

/**
 * Delete a pack by ID.
 */
export async function deletePack(id) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('quiz_packs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete pack: ${error.message}`);
  }

  logAdminAction({ action: 'delete_pack', tableName: 'quiz_packs', recordId: id });
}

/**
 * Fetch questions in a pack with sort_order, joined with questions_master.
 */
export async function fetchPackQuestions(packId) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('pack_questions')
    .select('id, sort_order, question_id, questions_master(id, question_text, answer_text, answer_explanation, category, display_title, media_url, points, status)')
    .eq('pack_id', packId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch pack questions: ${error.message}`);
  }

  return data || [];
}

/**
 * Add a question to a pack.
 */
export async function addQuestionToPack(packId, questionId, sortOrder = 0) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('pack_questions')
    .insert({ pack_id: packId, question_id: questionId, sort_order: sortOrder })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add question to pack: ${error.message}`);
  }

  logAdminAction({ action: 'add_question_to_pack', tableName: 'pack_questions', recordId: data.id, payload: { pack_id: packId, question_id: questionId } });

  // Update question_count on the pack
  try {
    await supabase.rpc('update_pack_question_count', { target_pack_id: packId });
  } catch {
    // Fallback: manual count update
    try {
      const { count } = await supabase
        .from('pack_questions')
        .select('id', { count: 'exact', head: true })
        .eq('pack_id', packId);
      if (count != null) {
        await supabase.from('quiz_packs').update({ question_count: count }).eq('id', packId);
      }
    } catch {
      // Non-critical
    }
  }

  return data;
}

/**
 * Bulk add questions to a pack.
 * @param {string} packId
 * @param {string[]} questionIds - Array of question IDs to add
 */
export async function bulkAddQuestionsToPack(packId, questionIds) {
  const supabase = getSupabase();

  const rows = questionIds.map((qId, i) => ({
    pack_id: packId,
    question_id: qId,
    sort_order: i + 1,
  }));

  const { data, error } = await supabase
    .from('pack_questions')
    .insert(rows)
    .select();

  if (error) {
    throw new Error(`Failed to bulk add questions to pack: ${error.message}`);
  }

  logAdminAction({ action: 'bulk_add_questions_to_pack', tableName: 'pack_questions', payload: { pack_id: packId, count: data.length } });

  // Update question_count on the pack
  try {
    await supabase.rpc('update_pack_question_count', { target_pack_id: packId });
  } catch {
    const { count } = await supabase
      .from('pack_questions')
      .select('id', { count: 'exact', head: true })
      .eq('pack_id', packId);
    if (count != null) {
      await supabase.from('quiz_packs').update({ question_count: count }).eq('id', packId);
    }
  }

  return data;
}

/**
 * Remove a question from a pack.
 */
export async function removeQuestionFromPack(packQuestionId, packId) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('pack_questions')
    .delete()
    .eq('id', packQuestionId);

  if (error) {
    throw new Error(`Failed to remove question from pack: ${error.message}`);
  }

  logAdminAction({ action: 'remove_question_from_pack', tableName: 'pack_questions', recordId: packQuestionId, payload: { pack_id: packId } });

  // Update question_count
  const { count } = await supabase
    .from('pack_questions')
    .select('id', { count: 'exact', head: true })
    .eq('pack_id', packId);

  if (count != null) {
    await supabase.from('quiz_packs').update({ question_count: count }).eq('id', packId);
  }
}

/**
 * Batch update sort_order for pack questions.
 * @param {Array<{id: string, sort_order: number}>} updates
 */
export async function updatePackQuestionOrder(updates) {
  const supabase = getSupabase();

  // Update each row individually (Supabase doesn't support batch update by PK)
  const promises = updates.map(({ id, sort_order }) =>
    supabase
      .from('pack_questions')
      .update({ sort_order })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  const failed = results.find(r => r.error);
  if (failed) {
    throw new Error(`Failed to update question order: ${failed.error.message}`);
  }

  logAdminAction({ action: 'update_pack_question_order', tableName: 'pack_questions', payload: { count: updates.length } });
}

/**
 * Fetch distinct pack categories for filter dropdowns.
 */
export async function fetchPackCategories() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('quiz_packs')
    .select('category')
    .not('category', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch pack categories: ${error.message}`);
  }

  const unique = [...new Set(data.map(d => d.category))].sort();
  return unique;
}

// ============================================================
// Public showcase (landing page)
// ============================================================

/**
 * Fetch all active packs for the landing page carousel (display only).
 * No role-based filtering — this is a read-only preview.
 */
export async function fetchShowcasePacks() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('quiz_packs')
    .select('id, title, cover_image_url, category, question_count, pack_questions(count)')
    .eq('status', 'active')
    .order('play_count', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch showcase packs: ${error.message}`);
  }

  return (data || []).map(({ pack_questions, ...rest }) => ({
    ...rest,
    question_count: pack_questions?.[0]?.count ?? rest.question_count,
  }));
}

// ============================================================
// User-facing functions
// ============================================================

/**
 * Browse host packs (is_host=true) for the Host Quiz flow.
 * Requires admin/editor/superadmin role (RLS enforced at DB level).
 */
export async function browseHostPacks({ category, userRole } = {}) {
  const supabase = getSupabase();

  let query = supabase
    .from('quiz_packs')
    .select('id, title, description, cover_image_url, category, is_premium, is_host, question_count, play_count, pack_questions(count)')
    .eq('status', 'active')
    .order('title', { ascending: true });

  // Admin/editor/superadmin: show all active packs (host + public + premium)
  // Other roles: show only host packs (RLS will filter appropriately)
  if (!['admin', 'superadmin', 'editor'].includes(userRole)) {
    query = query.eq('is_host', true);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to browse host packs: ${error.message}`);
  }

  return (data || []).map(({ pack_questions, ...rest }) => ({
    ...rest,
    question_count: pack_questions?.[0]?.count ?? rest.question_count,
  }));
}

/**
 * Browse packs visible to the current user, optionally filtered by category.
 *
 * Visibility is role-aware (RLS enforces DB-level access, but the query
 * must not over-filter with hard-coded column checks for elevated roles):
 *
 *   Role          Premium  Host  Public
 *   superadmin    Yes      Yes   Yes
 *   admin         Yes      Yes   Yes
 *   editor        Yes      Yes   Yes
 *   premium       Yes      No    Yes
 *   user          No       No    Yes
 *
 * @param {object} [opts]
 * @param {string} [opts.category]
 * @param {string} [opts.userRole] - Caller's DB role (user/editor/admin/superadmin)
 * @param {string} [opts.subscriptionTier] - Caller's subscription tier (free/basic/pro)
 */
export async function browsePublicPacks({ category, userRole, subscriptionTier } = {}) {
  const supabase = getSupabase();

  let query = supabase
    .from('quiz_packs')
    .select('id, title, description, cover_image_url, category, is_premium, is_host, question_count, play_count, pack_questions(count)')
    .eq('status', 'active')
    .order('play_count', { ascending: false });

  // Staff roles: see all active packs (public, premium, host)
  if (['admin', 'superadmin', 'editor'].includes(userRole)) {
    // No extra filters — RLS + status=active is sufficient
  } else if (subscriptionTier === 'basic' || subscriptionTier === 'pro') {
    // Paid subscribers see public + premium packs, but NOT host packs
    query = query.eq('is_host', false);
  } else {
    // Free/trial-expired users: public, non-host packs (premium shown but gated in PackDetail)
    query = query.eq('is_public', true).eq('is_host', false);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to browse packs: ${error.message}`);
  }

  return (data || []).map(({ pack_questions, ...rest }) => ({
    ...rest,
    question_count: pack_questions?.[0]?.count ?? rest.question_count,
  }));
}

/**
 * Fetch a single pack's metadata (role-aware).
 * @param {string} id - Pack UUID
 * @param {object} [opts]
 * @param {string} [opts.userRole] - Caller's DB role (user/editor/admin/superadmin)
 * @param {string} [opts.subscriptionTier] - Caller's subscription tier (free/basic/pro)
 */
export async function fetchPublicPackById(id, { userRole, subscriptionTier } = {}) {
  const supabase = getSupabase();

  let query = supabase
    .from('quiz_packs')
    .select('id, title, description, cover_image_url, category, is_premium, is_host, question_count, play_count, pack_questions(count)')
    .eq('id', id)
    .eq('status', 'active');

  // Staff roles: see any active pack
  if (['admin', 'superadmin', 'editor'].includes(userRole)) {
    // No extra filters
  } else if (subscriptionTier === 'basic' || subscriptionTier === 'pro') {
    query = query.eq('is_host', false);
  } else {
    query = query.eq('is_public', true).eq('is_host', false);
  }

  const { data, error } = await query.single();

  if (error) {
    throw new Error(`Failed to fetch pack: ${error.message}`);
  }

  const { pack_questions, ...rest } = data;
  return {
    ...rest,
    question_count: pack_questions?.[0]?.count ?? rest.question_count,
  };
}

/**
 * Fetch pack questions for play (in sort_order), joined with question data.
 */
export async function fetchPackPlayQuestions(packId) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('pack_questions')
    .select('sort_order, questions_master(id, question_text, answer_text, answer_explanation, category, display_title, media_url, points)')
    .eq('pack_id', packId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch pack questions: ${error.message}`);
  }

  return (data || []).map(pq => ({
    ...pq.questions_master,
    sort_order: pq.sort_order,
  }));
}

/**
 * Increment pack play count via Postgres RPC.
 */
export async function incrementPackPlayCount(packId) {
  const supabase = getSupabase();

  const { error } = await supabase.rpc('increment_pack_play_count', { pack_id: packId });

  if (error) {
    throw new Error(`Failed to increment play count: ${error.message}`);
  }
}

// ============================================================
// Doubles quiz functions
// ============================================================

/**
 * Fetch all active packs with doubles_enabled in their config.
 */
export async function fetchDoublesPacks() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('quiz_packs')
    .select('id, title, description, cover_image_url, category, question_count, config, pack_questions(count)')
    .eq('status', 'active')
    .not('config', 'is', null)
    .order('title', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch doubles packs: ${error.message}`);
  }

  // Filter client-side for doubles_enabled since JSONB filtering varies
  const doublesPacks = (data || [])
    .filter(p => p.config?.doubles_enabled === true)
    .map(({ pack_questions, ...rest }) => ({
      ...rest,
      question_count: pack_questions?.[0]?.count ?? rest.question_count,
    }));

  return doublesPacks;
}

/**
 * Fetch a single doubles pack by ID with validation.
 */
export async function fetchDoublesPackById(id) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('quiz_packs')
    .select('id, title, description, cover_image_url, category, question_count, config, pack_questions(count)')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error) {
    throw new Error(`Failed to fetch doubles pack: ${error.message}`);
  }

  if (!data.config?.doubles_enabled) {
    throw new Error('This pack is not configured for doubles play.');
  }

  const { pack_questions, ...rest } = data;
  return {
    ...rest,
    question_count: pack_questions?.[0]?.count ?? rest.question_count,
  };
}

// ============================================================
// Admin Analytics RPCs
// ============================================================

/**
 * Fetch platform-level analytics (admin-only).
 */
export async function fetchAdminAnalytics() {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_admin_analytics');

  if (error) throw new Error(`Failed to fetch analytics: ${error.message}`);
  return data;
}

/**
 * Fetch per-pack performance metrics (admin-only).
 */
export async function fetchPackPerformance() {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_pack_performance');

  if (error) throw new Error(`Failed to fetch pack performance: ${error.message}`);
  return data || [];
}

/**
 * Fetch hardest questions by accuracy (admin-only).
 */
export async function fetchHardestQuestions(limit = 10) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_hardest_questions', { result_limit: limit });

  if (error) throw new Error(`Failed to fetch hardest questions: ${error.message}`);
  return data || [];
}
