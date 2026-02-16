import { getSupabase } from './index.js';

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
    .select('*', { count: 'exact' });

  if (category) {
    query = query.eq('category', category);
  }
  if (status) {
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

  return { data: data || [], count: count || 0, page, pageSize };
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
}

/**
 * Fetch questions in a pack with sort_order, joined with questions_master.
 */
export async function fetchPackQuestions(packId) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('pack_questions')
    .select('id, sort_order, question_id, questions_master(id, question_text, answer_text, answer_explanation, category, media_url, status)')
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

  // Update question_count on the pack
  await supabase.rpc('update_pack_question_count', { target_pack_id: packId }).catch(() => {
    // Fallback: manual count update
    supabase
      .from('pack_questions')
      .select('id', { count: 'exact', head: true })
      .eq('pack_id', packId)
      .then(({ count }) => {
        if (count != null) {
          supabase.from('quiz_packs').update({ question_count: count }).eq('id', packId);
        }
      });
  });

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
// User-facing functions
// ============================================================

/**
 * Browse public active packs, optionally filtered by category/premium.
 */
export async function browsePublicPacks({ category, isPremium } = {}) {
  const supabase = getSupabase();

  let query = supabase
    .from('quiz_packs')
    .select('id, title, description, cover_image_url, category, is_premium, question_count, play_count')
    .eq('is_public', true)
    .eq('status', 'active')
    .order('play_count', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }
  if (isPremium !== undefined && isPremium !== null) {
    query = query.eq('is_premium', isPremium);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to browse packs: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch a single public pack's metadata.
 */
export async function fetchPublicPackById(id) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('quiz_packs')
    .select('id, title, description, cover_image_url, category, is_premium, question_count, play_count')
    .eq('id', id)
    .eq('is_public', true)
    .eq('status', 'active')
    .single();

  if (error) {
    throw new Error(`Failed to fetch pack: ${error.message}`);
  }

  return data;
}

/**
 * Fetch pack questions for play (in sort_order), joined with question data.
 */
export async function fetchPackPlayQuestions(packId) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('pack_questions')
    .select('sort_order, questions_master(id, question_text, answer_text, answer_explanation, category, media_url)')
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
