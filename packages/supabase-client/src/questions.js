import { getSupabase } from './index.js';

/**
 * Fetch N random public+active questions for the free quiz.
 * Uses Supabase's PostgREST random ordering (via a Postgres function).
 */
export async function fetchRandomPublicQuestions(count = 10) {
  const supabase = getSupabase();

  // Fetch more than needed, then pick random subset client-side
  // (Supabase doesn't support ORDER BY random() directly via PostgREST)
  const { data, error } = await supabase
    .from('questions_master')
    .select('id, question_text, answer_text, answer_explanation, category, media_url, points')
    .eq('is_public', true)
    .eq('status', 'active')
    .limit(200);

  if (error) {
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No questions available. Please check back later.');
  }

  // Shuffle and pick the requested count
  const shuffled = data.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Fetch questions grouped by category for a Jeopardy-style grid.
 * Returns up to 6 categories with exactly 4 questions each.
 */
export async function fetchGridQuestions({ categoriesCount = 3, perCategory = 3 } = {}) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('questions_master')
    .select('id, question_text, answer_text, answer_explanation, category, media_url, points')
    .eq('is_public', true)
    .eq('status', 'active')
    .limit(500);

  if (error) {
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No questions available. Please check back later.');
  }

  // Group by category
  const grouped = {};
  for (const q of data) {
    const cat = q.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(q);
  }

  // Filter categories with enough questions, shuffle, pick top N
  const eligibleCategories = Object.entries(grouped)
    .filter(([, qs]) => qs.length >= perCategory)
    .sort(() => Math.random() - 0.5)
    .slice(0, categoriesCount);

  if (eligibleCategories.length === 0) {
    throw new Error('Not enough questions to build a grid. Please check back later.');
  }

  const pointValues = [10, 20, 30];

  const topics = eligibleCategories.map(([categoryName, qs]) => {
    // Shuffle and pick perCategory questions
    const selected = qs.sort(() => Math.random() - 0.5).slice(0, perCategory);
    return {
      name: categoryName,
      questions: selected.map((q, i) => ({
        id: q.id,
        topic: categoryName,
        points: q.points != null ? q.points : (pointValues[i] || (i + 1) * 10),
        question: q.question_text,
        answer: q.answer_text,
        answerExplanation: q.answer_explanation,
        mediaUrl: q.media_url,
      })),
    };
  });

  const allQuestions = topics.flatMap(t => t.questions);

  return { topics, allQuestions };
}

/**
 * Create a new quiz session.
 */
export async function createQuizSession({ userId = null, isFreeQuiz = true, totalQuestions, quizPackId = null }) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      is_free_quiz: isFreeQuiz,
      total_questions: totalQuestions,
      quiz_pack_id: quizPackId,
      status: 'in_progress',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create quiz session: ${error.message}`);
  }

  return data;
}

/**
 * Record a question attempt.
 */
export async function recordAttempt({ sessionId, questionId, isCorrect, timeSpentMs, skipped = false }) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('question_attempts')
    .insert({
      session_id: sessionId,
      question_id: questionId,
      is_correct: isCorrect,
      time_spent_ms: timeSpentMs,
      skipped,
    });

  if (error) {
    throw new Error(`Failed to record attempt: ${error.message}`);
  }
}

/**
 * Complete a quiz session with the final score.
 */
export async function completeQuizSession(sessionId, score) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('quiz_sessions')
    .update({
      completed_at: new Date().toISOString(),
      score,
      status: 'completed',
    })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to complete session: ${error.message}`);
  }
}

/**
 * Abandon a quiz session (e.g., user quits mid-quiz).
 */
export async function abandonQuizSession(sessionId) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('quiz_sessions')
    .update({ status: 'abandoned' })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to abandon session: ${error.message}`);
  }
}

/**
 * Fetch a resumable (in_progress) session with its answered question IDs.
 */
export async function fetchResumableSession(sessionId) {
  const supabase = getSupabase();

  const [sessionResult, attemptsResult] = await Promise.all([
    supabase.from('quiz_sessions')
      .select('*, quiz_packs(id, title, description, category, is_premium, question_count)')
      .eq('id', sessionId)
      .eq('status', 'in_progress')
      .single(),
    supabase.from('question_attempts')
      .select('question_id, is_correct, skipped')
      .eq('session_id', sessionId),
  ]);

  if (sessionResult.error) {
    throw new Error(`Session not found or already completed`);
  }

  return {
    session: sessionResult.data,
    answeredQuestionIds: (attemptsResult.data || []).map(a => a.question_id),
    attempts: attemptsResult.data || [],
  };
}

/**
 * Update session metadata JSONB (e.g., store question_ids for resume).
 */
export async function updateSessionMetadata(sessionId, metadata) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('quiz_sessions')
    .update({ metadata })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to update session metadata: ${error.message}`);
  }
}

// ============================================================
// Admin CRUD functions (require admin role via RLS)
// ============================================================

/**
 * Fetch all questions with optional filters and pagination.
 */
export async function fetchAllQuestions({ category, status, search, page = 1, pageSize = 20 } = {}) {
  const supabase = getSupabase();

  let query = supabase
    .from('questions_master')
    .select('*', { count: 'exact' });

  if (category) {
    query = query.eq('category', category);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`question_text.ilike.%${search}%,answer_text.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('updated_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  return { data: data || [], count: count || 0, page, pageSize };
}

/**
 * Fetch a single question by ID.
 */
export async function fetchQuestionById(id) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('questions_master')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch question: ${error.message}`);
  }

  return data;
}

/**
 * Create a new question.
 */
export async function createQuestion(questionData) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('questions_master')
    .insert(questionData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create question: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing question.
 */
export async function updateQuestion(id, questionData) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('questions_master')
    .update({ ...questionData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update question: ${error.message}`);
  }

  return data;
}

/**
 * Delete a question by ID.
 */
export async function deleteQuestion(id) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('questions_master')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete question: ${error.message}`);
  }
}

/**
 * Bulk create questions from an array.
 */
export async function bulkCreateQuestions(questionsArray) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('questions_master')
    .insert(questionsArray)
    .select();

  if (error) {
    throw new Error(`Failed to bulk create questions: ${error.message}`);
  }

  return data;
}

/**
 * Fetch distinct categories for filter dropdowns.
 */
export async function fetchCategories() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('questions_master')
    .select('category')
    .not('category', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  const unique = [...new Set(data.map(d => d.category))].sort();
  return unique;
}
