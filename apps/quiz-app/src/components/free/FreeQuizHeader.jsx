export default function FreeQuizHeader({ score, streak, scoreBounce, children }) {
  return (
    <div className="free-quiz__header">
      <img
        src="/qwizzeria-logo.png"
        alt="Qwizzeria"
        className="free-quiz__logo"
        onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
      />
      <div className={`free-quiz__score-bar ${scoreBounce ? 'free-quiz__score-bar--bounce' : ''}`}>
        Score: {score}
      </div>
      {streak >= 2 && (
        <div className="free-quiz__streak-badge">{streak} streak</div>
      )}
      {children}
    </div>
  );
}
