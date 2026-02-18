import '../../styles/HostScoreboard.css';

export default function HostScoreboard({ participants }) {
  if (!participants || participants.length === 0) return null;

  const maxScore = Math.max(...participants.map(p => p.score));

  return (
    <div className="host-scoreboard">
      {participants.map((p, i) => {
        const isLeading = p.score > 0 && p.score === maxScore;
        return (
          <div
            key={i}
            className={`host-scoreboard__player ${isLeading ? 'host-scoreboard__player--leading' : ''}`}
          >
            <span className="host-scoreboard__name">{p.name}</span>
            <span className="host-scoreboard__score">
              {String(p.score).padStart(3, '0')}
            </span>
          </div>
        );
      })}
    </div>
  );
}
