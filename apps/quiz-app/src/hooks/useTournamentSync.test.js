import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTournamentSync } from './useTournamentSync';

const mockCreateTournament = vi.fn();
const mockSetMatchPack = vi.fn();

vi.mock('@qwizzeria/supabase-client/src/tournaments.js', () => ({
  createTournament: (...args) => mockCreateTournament(...args),
  setMatchPack: (...args) => mockSetMatchPack(...args),
}));

vi.mock('../components/host/hostQuizReducer', () => ({
  ACTIONS: { SET_TOURNAMENT_ID: 'SET_TOURNAMENT_ID' },
}));

describe('useTournamentSync', () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not create tournament when not in bracket phase', () => {
    renderHook(() => useTournamentSync({
      state: { phase: 'grid', tournament: null, tournamentId: null, pack: null, matchPacks: {} },
      dispatch,
      userId: 'user-1',
    }));
    expect(mockCreateTournament).not.toHaveBeenCalled();
  });

  it('does not create tournament when already has DB ID', () => {
    renderHook(() => useTournamentSync({
      state: {
        phase: 'bracket',
        tournament: { teams: [], questionsPerMatch: 3, questionPool: [], perMatchPacks: false },
        tournamentId: 'existing-id',
        pack: { id: 'p1' },
        matchPacks: {},
      },
      dispatch,
      userId: 'user-1',
    }));
    expect(mockCreateTournament).not.toHaveBeenCalled();
  });

  it('creates tournament in DB when bracket phase starts', async () => {
    mockCreateTournament.mockResolvedValue({ id: 'new-tournament-id' });

    renderHook(() => useTournamentSync({
      state: {
        phase: 'bracket',
        tournament: {
          teams: [{ name: 'A' }, { name: 'B' }],
          questionsPerMatch: 3,
          questionPool: [1, 2, 3],
          perMatchPacks: false,
        },
        tournamentId: null,
        pack: { id: 'pack-1' },
        matchPacks: {},
      },
      dispatch,
      userId: 'user-1',
    }));

    await waitFor(() => {
      expect(mockCreateTournament).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-1',
        packId: 'pack-1',
        teamNames: ['A', 'B'],
        questionsPerMatch: 3,
      }));
    });

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: 'SET_TOURNAMENT_ID',
        tournamentId: 'new-tournament-id',
      });
    });
  });

  it('persists unpersisted match packs to DB', async () => {
    mockSetMatchPack.mockResolvedValue({});

    renderHook(() => useTournamentSync({
      state: {
        phase: 'matchGrid',
        tournament: { perMatchPacks: true },
        tournamentId: 'tid-1',
        pack: null,
        matchPacks: {
          'r0-m0': { packId: 'p1', questionPool: [1, 2], _persisted: false },
          'r0-m1': { packId: 'p2', questionPool: [3, 4], _persisted: true },
        },
      },
      dispatch,
      userId: 'user-1',
    }));

    await waitFor(() => {
      expect(mockSetMatchPack).toHaveBeenCalledTimes(1);
      expect(mockSetMatchPack).toHaveBeenCalledWith({
        matchId: 'tid-1-m-0-0',
        packId: 'p1',
        questionPool: [1, 2],
      });
    });
  });

  it('does not persist match packs when no tournament ID', () => {
    renderHook(() => useTournamentSync({
      state: {
        phase: 'matchGrid',
        tournament: { perMatchPacks: true },
        tournamentId: null,
        pack: null,
        matchPacks: {
          'r0-m0': { packId: 'p1', questionPool: [], _persisted: false },
        },
      },
      dispatch,
      userId: 'user-1',
    }));
    expect(mockSetMatchPack).not.toHaveBeenCalled();
  });
});
