import { useEffect } from 'react';
import {
  createTournament as dbCreateTournament,
  setMatchPack as dbSetMatchPack,
} from '@qwizzeria/supabase-client';
import { ACTIONS } from '../components/host/hostQuizReducer';

/**
 * Persists tournament and match pack assignments to DB.
 */
export function useTournamentSync({ state, dispatch, userId }) {
  // Persist new tournament to DB when bracket phase starts without a DB ID
  useEffect(() => {
    if (state.phase !== 'bracket' || !state.tournament || state.tournamentId) return;
    if (!userId) return;
    const perMatchPacks = !!state.tournament.perMatchPacks;
    if (!perMatchPacks && !state.pack?.id) return;

    dbCreateTournament({
      userId,
      packId: perMatchPacks ? null : state.pack.id,
      teamNames: state.tournament.teams.map(t => t.name),
      questionsPerMatch: state.tournament.questionsPerMatch,
      bracket: state.tournament,
      questionPool: state.tournament.questionPool,
      perMatchPacks,
    })
      .then(tournament => {
        dispatch({ type: ACTIONS.SET_TOURNAMENT_ID, tournamentId: tournament.id });
      })
      .catch(err => console.warn('Failed to persist tournament to DB:', err));
  }, [state.phase, state.tournament, state.tournamentId, userId, state.pack, dispatch]);

  // Persist match pack assignments to DB (non-blocking, once per match)
  useEffect(() => {
    if (!state.tournamentId || !state.tournament?.perMatchPacks) return;

    for (const [matchKey, mp] of Object.entries(state.matchPacks)) {
      if (mp._persisted) continue;
      const parts = matchKey.replace('r', '').split('-m').map(Number);
      const [ri, mi] = parts;
      const matchId = `${state.tournamentId}-m-${ri}-${mi}`;
      dbSetMatchPack({
        matchId,
        packId: mp.packId,
        questionPool: mp.questionPool,
      })
        .then(() => {
          // Mark as persisted in state (fire-and-forget — no dispatch needed for correctness)
        })
        .catch(err => console.warn('Failed to persist match pack:', err));
    }
  }, [state.tournamentId, state.matchPacks, state.tournament]);
}
