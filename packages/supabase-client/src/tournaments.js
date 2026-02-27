import { getSupabase } from './index.js';

/**
 * Create a new tournament and its initial match rows.
 *
 * @param {object} params
 * @param {string} params.userId - Creator's auth user ID
 * @param {string|null} params.packId - Quiz pack ID (null for per-match pack mode)
 * @param {string[]} params.teamNames - Team names in seed order
 * @param {number} params.questionsPerMatch
 * @param {object} params.bracket - Full bracket state (rounds, teams, etc.)
 * @param {string[]} params.questionPool - Shuffled question IDs (empty for per-match mode)
 * @param {boolean} [params.perMatchPacks] - Whether each match selects its own pack
 * @returns {object} Created tournament row
 */
export async function createTournament({ userId, packId, teamNames, questionsPerMatch, bracket, questionPool, perMatchPacks = false }) {
  const supabase = getSupabase();

  // Insert tournament
  const { data: tournament, error: tError } = await supabase
    .from('host_tournaments')
    .insert({
      created_by: userId,
      pack_id: perMatchPacks ? null : packId,
      status: 'in_progress',
      team_names: teamNames,
      questions_per_match: questionsPerMatch,
      question_pool: perMatchPacks ? [] : questionPool,
      bracket,
    })
    .select()
    .single();

  if (tError) {
    throw new Error(`Failed to create tournament: ${tError.message}`);
  }

  // Insert match rows for all rounds
  const matchRows = [];
  for (let ri = 0; ri < bracket.rounds.length; ri++) {
    for (let mi = 0; mi < bracket.rounds[ri].length; mi++) {
      const match = bracket.rounds[ri][mi];
      matchRows.push({
        id: `${tournament.id}-m-${ri}-${mi}`,
        tournament_id: tournament.id,
        round_index: ri,
        match_index: mi,
        team1_index: match.team1Index,
        team2_index: match.team2Index,
        team1_score: match.team1Score || 0,
        team2_score: match.team2Score || 0,
        winner_index: match.winnerIndex,
        status: match.status,
      });
    }
  }

  if (matchRows.length > 0) {
    const { error: mError } = await supabase
      .from('host_tournament_matches')
      .insert(matchRows);

    if (mError) {
      throw new Error(`Failed to create tournament matches: ${mError.message}`);
    }
  }

  return tournament;
}

/**
 * Fetch a tournament by ID, including its matches.
 *
 * @param {string} tournamentId
 * @returns {{ tournament: object, matches: object[] }}
 */
export async function fetchTournament(tournamentId) {
  const supabase = getSupabase();

  const { data: tournament, error: tError } = await supabase
    .from('host_tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (tError) {
    throw new Error(`Failed to fetch tournament: ${tError.message}`);
  }

  const { data: matches, error: mError } = await supabase
    .from('host_tournament_matches')
    .select('*, quiz_packs(id, title)')
    .eq('tournament_id', tournamentId)
    .order('round_index', { ascending: true })
    .order('match_index', { ascending: true });

  if (mError) {
    throw new Error(`Failed to fetch tournament matches: ${mError.message}`);
  }

  return { tournament, matches: matches || [] };
}

/**
 * Fetch all tournaments for a user.
 *
 * @param {string} userId
 * @param {string} [status] - Optional status filter
 * @returns {object[]}
 */
export async function fetchUserTournaments(userId, status) {
  const supabase = getSupabase();

  let query = supabase
    .from('host_tournaments')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch tournaments: ${error.message}`);
  }

  return data || [];
}

/**
 * Update a tournament match row.
 *
 * @param {string} matchId - Match composite key
 * @param {object} updates - Fields to update
 * @returns {object} Updated match row
 */
export async function updateTournamentMatch(matchId, updates) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('host_tournament_matches')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update tournament match: ${error.message}`);
  }

  return data;
}

/**
 * Claim a match for play (optimistic lock).
 * Returns the match if successfully claimed, null if already claimed.
 *
 * @param {string} matchId
 * @param {string} userId
 * @returns {object|null}
 */
export async function claimTournamentMatch(matchId, userId) {
  const supabase = getSupabase();

  // Only claim if still pending
  const { data, error } = await supabase
    .from('host_tournament_matches')
    .update({ status: 'in_progress', played_by: userId })
    .eq('id', matchId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    // No rows matched = already claimed
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to claim match: ${error.message}`);
  }

  return data;
}

/**
 * Reclaim a stale in_progress match (tab crash recovery).
 * Updates played_by to the new user regardless of current state.
 *
 * @param {string} matchId
 * @param {string} userId
 * @returns {object|null}
 */
export async function reclaimStaleMatch(matchId, userId) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('host_tournament_matches')
    .update({ played_by: userId })
    .eq('id', matchId)
    .eq('status', 'in_progress')
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to reclaim match: ${error.message}`);
  }

  return data;
}

/**
 * Complete a match: update scores, set winner, advance to next round.
 * Also updates the tournament bracket JSONB and next-round match row.
 *
 * @param {string} tournamentId
 * @param {string} matchId
 * @param {number} roundIndex
 * @param {number} matchIndex
 * @param {number} winnerIndex - Team index of the winner
 * @param {number} team1Score
 * @param {number} team2Score
 * @param {string[]} completedQuestionIds
 * @param {object[]} skippedQuestions
 * @param {object} updatedBracket - Full updated bracket JSONB
 * @param {string[]} updatedQuestionPool - Remaining question pool (unused in per-match mode)
 * @param {boolean} [isPerMatch] - When true, skip updating tournament-level question pool
 */
export async function advanceMatchWinner({
  tournamentId,
  matchId,
  roundIndex,
  matchIndex,
  winnerIndex,
  team1Score,
  team2Score,
  completedQuestionIds,
  skippedQuestions,
  updatedBracket,
  updatedQuestionPool,
  isPerMatch = false,
}) {
  const supabase = getSupabase();

  // 1. Update the completed match row
  const { error: matchError } = await supabase
    .from('host_tournament_matches')
    .update({
      status: 'completed',
      winner_index: winnerIndex,
      team1_score: team1Score,
      team2_score: team2Score,
      completed_question_ids: completedQuestionIds,
      skipped_questions: skippedQuestions,
    })
    .eq('id', matchId);

  if (matchError) {
    throw new Error(`Failed to complete match: ${matchError.message}`);
  }

  // 2. Update the next-round match row (advance winner)
  const nextRoundIndex = roundIndex + 1;
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const slot = matchIndex % 2 === 0 ? 'team1_index' : 'team2_index';

  if (nextRoundIndex < updatedBracket.rounds.length) {
    const nextMatchId = `${tournamentId}-m-${nextRoundIndex}-${nextMatchIndex}`;
    const { error: advanceError } = await supabase
      .from('host_tournament_matches')
      .update({ [slot]: winnerIndex })
      .eq('id', nextMatchId);

    if (advanceError) {
      console.warn('Failed to advance winner to next round:', advanceError.message);
    }
  }

  // 3. Update tournament bracket JSONB (and question pool for single-pack mode)
  const bracketUpdate = { bracket: updatedBracket };
  if (!isPerMatch) {
    bracketUpdate.question_pool = updatedQuestionPool;
  }

  const { error: bracketError } = await supabase
    .from('host_tournaments')
    .update(bracketUpdate)
    .eq('id', tournamentId);

  if (bracketError) {
    throw new Error(`Failed to update tournament bracket: ${bracketError.message}`);
  }
}

/**
 * Set the pack for a specific match (before it starts) in per-match pack mode.
 *
 * @param {object} params
 * @param {string} params.matchId - Match row ID
 * @param {string} params.packId - Pack UUID to assign
 * @param {string[]} params.questionPool - Shuffled question IDs for this match
 * @returns {object} Updated match row
 */
export async function setMatchPack({ matchId, packId, questionPool }) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('host_tournament_matches')
    .update({
      pack_id: packId,
      match_question_pool: questionPool,
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to set match pack: ${error.message}`);
  }

  return data;
}

/**
 * Mark a tournament as completed with a champion.
 *
 * @param {string} tournamentId
 * @param {number} championIndex - Team index of the champion
 */
export async function completeTournament(tournamentId, championIndex) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('host_tournaments')
    .update({
      status: 'completed',
      champion_team_index: championIndex,
    })
    .eq('id', tournamentId);

  if (error) {
    throw new Error(`Failed to complete tournament: ${error.message}`);
  }
}
