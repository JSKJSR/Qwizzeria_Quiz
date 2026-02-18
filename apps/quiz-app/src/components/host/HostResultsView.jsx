import '../../styles/HostResultsView.css';

const MEDAL_ICONS = ['&#129351;', '&#129352;', '&#129353;']; // gold, silver, bronze

export default function HostResultsView({ participants, onPlayAgain, onNewQuiz }) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <div className="host-results">
      <h1 className="host-results__title">Final Results</h1>

      <div className="host-results__podium">
        {sorted.map((p, i) => {
          const rank = i + 1;
          const isTop3 = rank <= 3;
          let rankClass = 'host-results__player';
          if (rank === 1) rankClass += ' host-results__player--gold';
          else if (rank === 2) rankClass += ' host-results__player--silver';
          else if (rank === 3) rankClass += ' host-results__player--bronze';

          return (
            <div key={i} className={rankClass}>
              <div className="host-results__rank">
                {isTop3 ? (
                  <span
                    className="host-results__medal"
                    dangerouslySetInnerHTML={{ __html: MEDAL_ICONS[i] }}
                  />
                ) : (
                  <span className="host-results__rank-number">#{rank}</span>
                )}
              </div>
              <div className="host-results__name">{p.name}</div>
              <div className="host-results__score">{p.score} pts</div>
            </div>
          );
        })}
      </div>

      <div className="host-results__actions">
        <button className="host-results__btn host-results__btn--primary" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="host-results__btn host-results__btn--secondary" onClick={onNewQuiz}>
          New Quiz
        </button>
      </div>
    </div>
  );
}
