import { getScoreMessage, getBestScore } from '@/utils/freeQuizStorage';

export default function FreeQuizResults({
  score, maxScore, results, allQuestions, bestStreak,
  isNewBest, shareConfirm, user,
  onShareScore, onPlayAgain, onNavigateHome,
}) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const correctCount = results.filter(r => r.isCorrect).length;
  const bestScoreData = getBestScore();
  const playCount = parseInt(localStorage.getItem('qwizzeria_free_play_count') || '0', 10);

  return (
    <div className="free-quiz">
      <div className="free-quiz__header">
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="free-quiz__logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
      </div>

      <div className="free-quiz__results">
        <div className="free-quiz__score-display">
          <div className={`free-quiz__score-number ${isNewBest ? 'free-quiz__score-number--new-best' : ''}`}>
            {score}/{maxScore}
          </div>
          <div className="free-quiz__score-label">Points Earned</div>
          {isNewBest && (
            <div className="free-quiz__new-best">New Personal Best!</div>
          )}
        </div>

        <p className="free-quiz__score-message">
          {getScoreMessage(score, maxScore)}
        </p>

        <div className="free-quiz__stats-bar">
          <div className="free-quiz__stat">
            <span className="free-quiz__stat-value">{correctCount}/{allQuestions.length}</span>
            <span className="free-quiz__stat-label">Correct</span>
          </div>
          <div className="free-quiz__stat">
            <span className="free-quiz__stat-value">{pct}%</span>
            <span className="free-quiz__stat-label">Accuracy</span>
          </div>
          <div className="free-quiz__stat">
            <span className="free-quiz__stat-value">{bestStreak}</span>
            <span className="free-quiz__stat-label">Best Streak</span>
          </div>
          {bestScoreData && !isNewBest && (
            <div className="free-quiz__stat">
              <span className="free-quiz__stat-value">{Math.round(bestScoreData.pct * 100)}%</span>
              <span className="free-quiz__stat-label">All-Time Best</span>
            </div>
          )}
        </div>

        <button className="free-quiz__share-btn" onClick={onShareScore} aria-label="Share your score">
          {shareConfirm ? 'Copied!' : 'Share Score'}
        </button>

        {!user && (
          <div className="free-quiz__leaderboard-teaser">
            <span className="free-quiz__teaser-text">
              Sign up to see how you rank on the global leaderboard!
            </span>
          </div>
        )}

        {!user && playCount >= 3 && (
          <div className="free-quiz__play-nudge">
            You&apos;ve played {playCount} times! Sign up to track your progress.
          </div>
        )}

        <div className="free-quiz__review">
          {allQuestions.map((q) => {
            const r = results.find(res => res.questionId === q.id);
            const status = r?.skipped ? 'skipped' : r?.isCorrect ? 'correct' : 'wrong';
            return (
              <div key={q.id} className={`free-quiz__review-item free-quiz__review-item--${status}`}>
                <div className="free-quiz__review-header">
                  <span className="free-quiz__review-topic">{q.topic}</span>
                  <span className="free-quiz__review-points">
                    {r?.isCorrect ? `+${q.points}` : '0'} pts
                  </span>
                </div>
                <div className="free-quiz__review-question">{q.question}</div>
                <div className="free-quiz__review-answer">{q.answer}</div>
                {q.answerExplanation && (
                  <div className="free-quiz__review-explanation">{q.answerExplanation}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="free-quiz__cta">
          <p className="free-quiz__cta-title">Want more quizzes?</p>
          <div className="free-quiz__cta-buttons">
            <button className="free-quiz__cta-btn free-quiz__cta-btn--primary" onClick={onPlayAgain}>
              Play Again
            </button>
            {!user && (
              <button className="free-quiz__cta-btn free-quiz__cta-btn--primary" onClick={onNavigateHome}>
                Sign Up Free
              </button>
            )}
            <button className="free-quiz__cta-btn free-quiz__cta-btn--secondary" onClick={onNavigateHome}>
              Back to Home
            </button>
          </div>
        </div>

        <div className="results-watermark">
          <img src="/qwizzeria-logo.png" alt="" className="results-watermark__logo" onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }} />
          <span className="results-watermark__tagline">I learn, therefore I am</span>
        </div>
      </div>
    </div>
  );
}
