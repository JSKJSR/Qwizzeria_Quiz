import '../styles/Scoreboard.css';

export default function Scoreboard({ participants, onEndQuiz, showEndQuiz }) {
  const maxScore = Math.max(...participants.map(p => p.score), 0);
  const hasScores = maxScore > 0;

  return (
    <div className="scoreboard">
      <img src="/qwizzeria-logo.svg" alt="Qwizzeria" className="scoreboard__logo" />
      <div className="scoreboard__teams">
        {participants.map(p => (
          <div
            key={p.id}
            className={`scoreboard__team ${hasScores && p.score === maxScore ? 'scoreboard__team--leader' : ''}`}
          >
            <div className="scoreboard__name">{p.name}</div>
            <div className="scoreboard__score">
              {String(p.score).padStart(3, '0')}
            </div>
          </div>
        ))}
      </div>
      {showEndQuiz && (
        <button className="scoreboard__end-btn" onClick={onEndQuiz}>
          End Quiz
        </button>
      )}
    </div>
  );
}
