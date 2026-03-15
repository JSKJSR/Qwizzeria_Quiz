import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TournamentResultsView from './TournamentResultsView';

// Mock tournamentBracket utilities
vi.mock('../../utils/tournamentBracket', () => ({
  getChampion: (tournament) => {
    // Find winner of last match
    const lastRound = tournament.rounds[tournament.rounds.length - 1];
    const final = lastRound[0];
    return final?.winnerIndex ?? null;
  },
  getRoundName: (totalRounds, roundIndex) => {
    if (totalRounds === 1) return 'Final';
    if (roundIndex === totalRounds - 1) return 'Final';
    if (roundIndex === totalRounds - 2) return 'Semi-Final';
    return `Round ${roundIndex + 1}`;
  },
}));

// Mock TournamentBracket component
vi.mock('./TournamentBracket', () => ({
  default: () => <div data-testid="tournament-bracket">Bracket</div>,
}));

const makeTournament = () => ({
  teams: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }, { name: 'Delta' }],
  rounds: [
    [
      { team1Index: 0, team2Index: 1, status: 'completed', winnerIndex: 0, team1Score: 30, team2Score: 10 },
      { team1Index: 2, team2Index: 3, status: 'completed', winnerIndex: 2, team1Score: 20, team2Score: 15 },
    ],
    [
      { team1Index: 0, team2Index: 2, status: 'completed', winnerIndex: 0, team1Score: 25, team2Score: 20 },
    ],
  ],
});

describe('TournamentResultsView', () => {
  it('displays the champion name', () => {
    render(<TournamentResultsView tournament={makeTournament()} onNewTournament={() => {}} onNewQuiz={() => {}} />);
    expect(screen.getByText('Tournament Champion')).toBeInTheDocument();
    // Champion name appears in champion section and match results — use the champion-name element
    const championName = document.querySelector('.tournament-results__champion-name');
    expect(championName).toHaveTextContent('Alpha');
  });

  it('renders match results', () => {
    render(<TournamentResultsView tournament={makeTournament()} onNewTournament={() => {}} onNewQuiz={() => {}} />);
    // Should show scores
    expect(screen.getByText(/30 - 10/)).toBeInTheDocument();
    expect(screen.getByText(/25 - 20/)).toBeInTheDocument();
  });

  it('calls onNewTournament when button clicked', () => {
    const onNew = vi.fn();
    render(<TournamentResultsView tournament={makeTournament()} onNewTournament={onNew} onNewQuiz={() => {}} />);
    fireEvent.click(screen.getByText('New Tournament'));
    expect(onNew).toHaveBeenCalled();
  });

  it('calls onNewQuiz when button clicked', () => {
    const onNew = vi.fn();
    render(<TournamentResultsView tournament={makeTournament()} onNewTournament={() => {}} onNewQuiz={onNew} />);
    fireEvent.click(screen.getByText('New Quiz'));
    expect(onNew).toHaveBeenCalled();
  });
});
