import { getRoundName, isMatchPlayable, getChampion } from '../../utils/tournamentBracket';
import '../../styles/TournamentBracket.css';

/**
 * Check if an in_progress match is stale (no update for threshold).
 */
function isMatchStale(match, staleThresholdMs) {
  if (match.status !== 'in_progress' || !match.updatedAt || !staleThresholdMs) return false;
  const elapsed = Date.now() - new Date(match.updatedAt).getTime();
  return elapsed > staleThresholdMs;
}

function MatchCard({ match, teams, roundIndex, onSelectMatch, onOpenInNewTab, onResumeMatch, isRecentlyCompleted, staleThresholdMs }) {
  const playable = isMatchPlayable(match);
  const stale = isMatchStale(match, staleThresholdMs);
  const { team1Index, team2Index, team1Score, team2Score, winnerIndex, status } = match;

  const team1 = team1Index !== null ? teams[team1Index] : null;
  const team2 = team2Index !== null ? teams[team2Index] : null;

  let statusClass = `tournament-match--${status}`;
  if (playable) statusClass = 'tournament-match--playable';
  if (isRecentlyCompleted) statusClass += ' tournament-match--just-completed';
  if (stale) statusClass += ' tournament-match--stale';

  const handleClick = () => {
    if (playable && onSelectMatch) {
      onSelectMatch(roundIndex, match._matchIndex);
    }
  };

  const handleNewTab = (e) => {
    e.stopPropagation();
    if (onOpenInNewTab) {
      onOpenInNewTab(roundIndex, match._matchIndex);
    }
  };

  const handleResume = (e) => {
    e.stopPropagation();
    if (onResumeMatch) {
      onResumeMatch(roundIndex, match._matchIndex);
    }
  };

  const renderTeam = (team, teamIndex, score, isWinner, isLoser, isBye) => {
    let teamClass = 'tournament-match__team';
    if (isWinner) teamClass += ' tournament-match__team--winner';
    else if (isLoser) teamClass += ' tournament-match__team--loser';
    else if (!team) teamClass += ' tournament-match__team--tbd';
    if (isBye) teamClass += ' tournament-match__team--bye';

    return (
      <div className={teamClass}>
        {team && (
          <span className="tournament-match__team-seed">{team.seed}</span>
        )}
        <span className="tournament-match__team-name">
          {isBye ? 'BYE' : team ? team.name : 'TBD'}
        </span>
        {(status === 'completed' || status === 'in_progress') && (
          <span className="tournament-match__team-score">{score}</span>
        )}
      </div>
    );
  };

  const isTeam1Winner = winnerIndex !== null && winnerIndex === team1Index;
  const isTeam2Winner = winnerIndex !== null && winnerIndex === team2Index;

  return (
    <div className={`tournament-match ${statusClass}`} onClick={handleClick}>
      {playable && (
        <span className="tournament-match__status tournament-match__status--playable">
          Play
        </span>
      )}
      {status === 'in_progress' && !stale && (
        <span className="tournament-match__status tournament-match__status--in_progress">
          Live
        </span>
      )}
      {stale && (
        <span className="tournament-match__status tournament-match__status--stale">
          Stale
        </span>
      )}
      {status === 'bye' && (
        <span className="tournament-match__status tournament-match__status--bye">
          Bye
        </span>
      )}
      {renderTeam(
        team1, team1Index, team1Score,
        isTeam1Winner,
        status === 'completed' && !isTeam1Winner,
        status === 'bye' && team1Index === null
      )}
      {renderTeam(
        team2, team2Index, team2Score,
        isTeam2Winner,
        status === 'completed' && !isTeam2Winner,
        status === 'bye' && team2Index === null
      )}
      {/* Open in new tab button for playable matches */}
      {playable && onOpenInNewTab && (
        <button
          className="tournament-match__new-tab-btn"
          onClick={handleNewTab}
          title="Open match in new tab"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      )}
      {/* Resume button for stale matches */}
      {stale && onResumeMatch && (
        <button
          className="tournament-match__resume-btn"
          onClick={handleResume}
          title="Resume stale match"
        >
          Resume
        </button>
      )}
    </div>
  );
}

function ConnectorColumn({ matchCount }) {
  if (matchCount <= 0) return null;
  const pairs = Math.ceil(matchCount / 2);

  return (
    <div className="tournament-bracket__connector">
      {Array.from({ length: pairs }, (_, i) => (
        <div key={i} className="tournament-bracket__connector-pair">
          <div className="tournament-bracket__connector-line tournament-bracket__connector-line--top" />
          <div className="tournament-bracket__connector-line tournament-bracket__connector-line--bottom" />
        </div>
      ))}
    </div>
  );
}

export default function TournamentBracket({ bracket, onSelectMatch, onOpenInNewTab, onResumeMatch, recentlyCompleted, staleThresholdMs }) {
  if (!bracket || !bracket.rounds) return null;

  const { rounds, teams } = bracket;
  const totalRounds = rounds.length;
  const champion = getChampion(bracket);

  const taggedRounds = rounds.map(round =>
    round.map((match, i) => ({ ...match, _matchIndex: i }))
  );

  return (
    <div className="tournament-bracket">
      <div className="tournament-bracket__header">
        <h2 className="tournament-bracket__title">Tournament Bracket</h2>
        <p className="tournament-bracket__subtitle">
          {teams.length} teams &middot; {bracket.totalMatches} matches &middot; {bracket.questionsPerMatch} questions per match
        </p>
      </div>

      <div className="tournament-bracket__rounds">
        {taggedRounds.map((round, roundIndex) => (
          <div key={roundIndex} style={{ display: 'flex', alignItems: 'stretch' }}>
            <div className="tournament-bracket__round">
              <div className="tournament-bracket__round-label">
                {getRoundName(totalRounds, roundIndex)}
              </div>
              <div className="tournament-bracket__matches">
                {round.map((match, matchIndex) => (
                  <MatchCard
                    key={matchIndex}
                    match={match}
                    teams={teams}
                    roundIndex={roundIndex}
                    onSelectMatch={onSelectMatch}
                    onOpenInNewTab={onOpenInNewTab}
                    onResumeMatch={onResumeMatch}
                    isRecentlyCompleted={recentlyCompleted?.has(`${roundIndex}-${matchIndex}`)}
                    staleThresholdMs={staleThresholdMs}
                  />
                ))}
              </div>
            </div>
            {roundIndex < totalRounds - 1 && (
              <ConnectorColumn matchCount={round.length} />
            )}
          </div>
        ))}

        <div className="tournament-bracket__champion">
          <div className="tournament-bracket__champion-card">
            <div className="tournament-bracket__champion-label">Champion</div>
            {champion !== null ? (
              <>
                <div className="tournament-bracket__champion-trophy">&#127942;</div>
                <div className="tournament-bracket__champion-name">
                  {teams[champion].name}
                </div>
              </>
            ) : (
              <div className="tournament-bracket__champion-pending">TBD</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
