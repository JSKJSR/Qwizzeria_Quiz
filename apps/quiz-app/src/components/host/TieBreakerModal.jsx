export default function TieBreakerModal({ team1Name, team2Name, onSelectWinner }) {
  return (
    <div className="tiebreaker-overlay">
      <div className="tiebreaker-modal">
        <h2 className="tiebreaker-modal__title">Tie Breaker</h2>
        <p className="tiebreaker-modal__text">
          The match is tied! Choose the winner:
        </p>
        <div className="tiebreaker-modal__buttons">
          <button
            className="tiebreaker-modal__btn"
            onClick={() => onSelectWinner(0)}
          >
            {team1Name}
          </button>
          <button
            className="tiebreaker-modal__btn"
            onClick={() => onSelectWinner(1)}
          >
            {team2Name}
          </button>
        </div>
      </div>
    </div>
  );
}
