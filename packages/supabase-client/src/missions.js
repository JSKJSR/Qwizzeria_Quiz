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
 * Minimum tier required for each mission.
 * Missions not listed here default to 'free'.
 * Edit this map when adding new tier-gated missions.
 */
export const MISSION_TIERS = {
  play_pack: 'basic',
};

/**
 * Premium teaser missions shown to free users as locked upgrade nudges.
 * These are NOT in the DB pool — purely client-side teasers.
 * Each entry mirrors the shape returned by the RPC but with is_locked: true.
 */
const PREMIUM_TEASERS = [
  { mission_key: 'play_pack', target: 1, xp_reward: 50, progress: 0, completed_at: null },
];

/**
 * Check if a mission requires a tier above the user's current tier.
 * @param {string} missionKey
 * @param {string} userTier - 'free' | 'basic' | 'pro'
 * @param {Function} tierSatisfies - from config/tiers.js
 * @returns {boolean} true if the mission is locked for this tier
 */
export function isMissionLocked(missionKey, userTier, tierSatisfies) {
  const requiredTier = MISSION_TIERS[missionKey] || 'free';
  return !tierSatisfies(userTier, requiredTier);
}

/**
 * Get a locked teaser mission for users who don't already have one.
 * Uses date-based index for daily variety (when more teasers are added).
 * @returns {Object} teaser mission object
 */
export function getLockedTeaser() {
  const dayIndex = Math.floor(Date.now() / 86400000) % PREMIUM_TEASERS.length;
  return { ...PREMIUM_TEASERS[dayIndex], is_locked: true };
}

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
