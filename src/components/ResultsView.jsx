import '../styles/ResultsView.css';

const MEDALS = ['🏆', '🥈', '🥉'];

export default function ResultsView({ participants, onNewQuiz, onPlayAgain }) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <div className="results">
      <img src="/qwizzeria-logo.svg" alt="Qwizzeria" className="results__logo" />
      <h1 className="results__title">Final Standings</h1>

      <div className="results__standings">
        {sorted.map((p, i) => {
          const tierClass =
            i === 0 ? 'results__row--gold' :
            i === 1 ? 'results__row--silver' :
            i === 2 ? 'results__row--bronze' : '';

          return (
            <div key={p.id} className={`results__row ${tierClass}`}>
              <div className="results__rank">
                {i < 3 ? MEDALS[i] : `#${i + 1}`}
              </div>
              <div className="results__name">{p.name}</div>
              <div className="results__score">
                {String(p.score).padStart(3, '0')}
              </div>
            </div>
          );
        })}
      </div>

      <div className="results__actions">
        <button className="results__btn results__btn--play-again" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="results__btn results__btn--new-quiz" onClick={onNewQuiz}>
          New Quiz
        </button>
      </div>
      <div className="results__branding">Powered by Qwizzeria</div>
    </div>
  );
}
