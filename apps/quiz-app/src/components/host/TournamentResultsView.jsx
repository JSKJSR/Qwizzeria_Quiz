import { getChampion, getRoundName } from '@/utils/tournamentBracket';
import TournamentBracket from './TournamentBracket';

export default function TournamentResultsView({ tournament, onNewTournament, onNewQuiz }) {
  const champion = getChampion(tournament);
  const { teams, rounds } = tournament;

  // Build match results summary
  const matchResults = [];
  for (let ri = 0; ri < rounds.length; ri++) {
    for (let mi = 0; mi < rounds[ri].length; mi++) {
      const m = rounds[ri][mi];
      if (m.status === 'completed' && m.winnerIndex !== null) {
        matchResults.push({
          round: getRoundName(rounds.length, ri),
          team1: teams[m.team1Index]?.name || 'BYE',
          team2: teams[m.team2Index]?.name || 'BYE',
          team1Score: m.team1Score,
          team2Score: m.team2Score,
          winner: teams[m.winnerIndex].name,
        });
      }
    }
  }

  return (
    <div className="tournament-results">
      <div className="tournament-results__champion-section">
        <div className="tournament-results__trophy">&#127942;</div>
        <h1 className="tournament-results__title">Tournament Champion</h1>
        {champion !== null && (
          <div className="tournament-results__champion-name">
            {teams[champion].name}
          </div>
        )}
      </div>

      {/* Full bracket recap */}
      <TournamentBracket bracket={tournament} />

      <div className="tournament-results__matches">
        <h3 className="tournament-results__matches-title">Match Results</h3>
        {matchResults.map((m, i) => (
          <div key={i} className="tournament-results__match-row">
            <span className="tournament-results__match-round">{m.round}</span>
            <span className="tournament-results__match-teams">
              <span className={m.winner === m.team1 ? 'tournament-results__match-winner' : ''}>
                {m.team1}
              </span>
              {' '}{m.team1Score} - {m.team2Score}{' '}
              <span className={m.winner === m.team2 ? 'tournament-results__match-winner' : ''}>
                {m.team2}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="tournament-results__actions">
        <button className="host-results__btn host-results__btn--primary" onClick={onNewTournament}>
          New Tournament
        </button>
        <button className="host-results__btn host-results__btn--secondary" onClick={onNewQuiz}>
          New Quiz
        </button>
      </div>
    </div>
  );
}
