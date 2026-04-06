import { getSupabase } from './index.js';

/**
 * Mission definitions (client-side labels/descriptions).
 * Keys must match the mission_pool in the get_daily_missions RPC.
 */
export const MISSION_DEFINITIONS = {
  answer_10: { label: 'Answer 10 questions', icon: '?' },
  answer_20: { label: 'Answer 20 questions', icon: '??' },
  correct_5: { label: 'Get 5 correct answers', icon: '5' },
  correct_10: { label: 'Get 10 correct answers', icon: '10' },
  play_quiz: { label: 'Complete a quiz', icon: 'Q' },
  play_3_quizzes: { label: 'Complete 3 quizzes', icon: '3Q' },
  streak_3: { label: 'Get a 3-answer streak', icon: '3x' },
  streak_5: { label: 'Get a 5-answer streak', icon: '5x' },
  perfect_quiz: { label: 'Get 100% on a quiz', icon: '100' },
  play_pack: { label: 'Play a quiz pack', icon: 'P' },
};

/**
 * Fetch (or initialize) today's daily missions for a user.
 * @param {string} userId
 * @returns {Promise<Array>} missions with progress
 */
export async function fetchDailyMissions(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('get_daily_missions', {
    target_user_id: userId,
  });

  if (error) throw new Error(`Failed to fetch daily missions: ${error.message}`);

  // Enrich with client-side labels
  return (data || []).map(m => ({
    ...m,
    label: MISSION_DEFINITIONS[m.mission_key]?.label || m.mission_key,
    icon: MISSION_DEFINITIONS[m.mission_key]?.icon || '?',
  }));
}

/**
 * Update mission progress after completing a quiz.
 * @param {string} userId
 * @param {Object} event - Quiz completion event data
 * @returns {Promise<Object>} { newly_completed, xp_earned }
 */
export async function updateMissionProgress(userId, {
  questionsAnswered = 0,
  correctAnswers = 0,
  bestStreak = 0,
  quizzesCompleted = 1,
  isPackQuiz = false,
  isPerfect = false,
} = {}) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('update_mission_progress', {
    target_user_id: userId,
    questions_answered: questionsAnswered,
    correct_answers: correctAnswers,
    best_streak: bestStreak,
    quizzes_completed: quizzesCompleted,
    is_pack_quiz: isPackQuiz,
    is_perfect: isPerfect,
  });

  if (error) throw new Error(`Failed to update mission progress: ${error.message}`);
  return data || { newly_completed: [], xp_earned: 0 };
}
