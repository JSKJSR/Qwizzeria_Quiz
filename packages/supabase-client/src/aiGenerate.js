import { getSupabase } from './index.js';

/**
 * Generate quiz questions using AI.
 * Calls the Supabase Edge Function `generate-quiz`.
 *
 * @param {object} params
 * @param {string} params.topic - Quiz topic (required, max 200 chars)
 * @param {number} [params.questionCount=10] - Number of questions (5-20)
 * @param {string} [params.difficulty='medium'] - easy, medium, or hard
 * @returns {Promise<Array<{question_text, answer_text, answer_explanation, category, points}>>}
 */
export async function generateQuiz({ topic, questionCount = 10, difficulty = 'medium' }) {
  const supabase = getSupabase();

  const { data, error } = await supabase.functions.invoke('generate-quiz', {
    body: { topic, questionCount, difficulty },
  });

  if (error) {
    // Supabase functions.invoke wraps HTTP errors
    throw new Error(error.message || 'Failed to generate quiz');
  }

  if (data?.error) {
    const err = new Error(data.error);
    err.detail = data.detail;
    err.status = data.status;
    throw err;
  }

  if (!data?.questions || !Array.isArray(data.questions)) {
    throw new Error('Invalid response from AI generation');
  }

  return data.questions;
}

/**
 * Save AI-generated questions as a quiz pack in the database.
 *
 * Orchestrates:
 * 1. Insert questions into questions_master
 * 2. Create a quiz pack
 * 3. Link questions to pack via pack_questions junction
 *
 * @param {object} params
 * @param {string} params.title - Pack title
 * @param {Array} params.questions - Array of question objects from generateQuiz
 * @param {string} params.userId - Current user's ID
 * @returns {Promise<{pack: object, questions: Array}>} - Same shape as fetchPackPlayQuestions output
 */
export async function saveGeneratedPack({ title, questions, userId }) {
  const supabase = getSupabase();

  // 1. Insert questions into questions_master
  const questionRows = questions.map((q) => ({
    question_text: q.question_text,
    answer_text: q.answer_text,
    answer_explanation: q.answer_explanation || '',
    category: q.category || 'General',
    points: q.points || 10,
    status: 'active',
    is_public: false,
    tags: ['ai-generated'],
  }));

  const { data: insertedQuestions, error: qError } = await supabase
    .from('questions_master')
    .insert(questionRows)
    .select('id, question_text, answer_text, answer_explanation, category, display_title, media_url, points');

  if (qError) {
    throw new Error(`Failed to save questions: ${qError.message}`);
  }

  // 2. Create the quiz pack
  const { data: pack, error: packError } = await supabase
    .from('quiz_packs')
    .insert({
      title,
      category: questions[0]?.category || 'AI Generated',
      status: 'active',
      is_public: false,
      is_premium: false,
      is_host: true,
      question_count: insertedQuestions.length,
      created_by: userId,
    })
    .select()
    .single();

  if (packError) {
    throw new Error(`Failed to create pack: ${packError.message}`);
  }

  // 3. Link questions to pack via pack_questions junction
  const junctionRows = insertedQuestions.map((q, i) => ({
    pack_id: pack.id,
    question_id: q.id,
    sort_order: i + 1,
  }));

  const { error: junctionError } = await supabase
    .from('pack_questions')
    .insert(junctionRows);

  if (junctionError) {
    throw new Error(`Failed to link questions to pack: ${junctionError.message}`);
  }

  // Return in the same shape that HostQuiz expects (matching fetchPackPlayQuestions output)
  const formattedQuestions = insertedQuestions.map((q, i) => ({
    ...q,
    sort_order: i + 1,
    media_url: q.media_url || null,
    display_title: q.display_title || null,
  }));

  return { pack, questions: formattedQuestions };
}
