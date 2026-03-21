import { useNavigate } from 'react-router-dom';
import { getScoreMessage, getBestScore } from '@/utils/freeQuizStorage';
import { BADGES } from '@/utils/gamification';
import SignupNudge from './SignupNudge';

function getNudgeMessage({ gamification, isNewBest, user }) {
  if (user) return null;
  if (!gamification) return null;

  const { newBadges, leveledUp, playCount } = gamification;

  // Priority: badge > level-up > personal best > play count
  if (newBadges?.length > 0) {
    const badge = BADGES.find(b => b.key === newBadges[0]);
    return `You earned ${badge?.label || 'a badge'}! Sign up to display it.`;
  }
  if (leveledUp) {
    return `Level ${gamification.level}: ${gamification.levelTitle} — Sign up to keep your rank.`;
  }
  if (isNewBest) {
    return 'New best! Create an account so you never lose it.';
  }
  if (playCount >= 3) {
    return `You've played ${playCount} quizzes — sign up to track everything.`;
  }
  if (playCount === 1) {
    return 'Nice! Sign up free to save your progress.';
  }
  return null;
}

export default function FreeQuizResults({
  score, maxScore, results, allQuestions, bestStreak,
  isNewBest, shareConfirm, user,
  onShareScore, onPlayAgain, onNavigateHome,
  gamification,
}) {
  const navigate = useNavigate();
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const correctCount = results.filter(r => r.isCorrect).length;
  const bestScoreData = getBestScore();

  const nudgeMessage = getNudgeMessage({ gamification, isNewBest, user });

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

        {/* Gamification: XP + Level */}
        {gamification && (
          <div className="free-quiz__gamification-section">
            <div className="free-quiz__xp-earned">
              +{gamification.sessionXP} XP
            </div>

            {gamification.leveledUp && (
              <div className="free-quiz__level-up" aria-live="polite">
                Level Up!
              </div>
            )}

            <div className="free-quiz__level-display">
              <span className="free-quiz__level-title">
                Level {gamification.level}: {gamification.levelTitle}
              </span>
              <div className="free-quiz__xp-progress-bar">
                <div
                  className="free-quiz__xp-progress-fill"
                  style={{ width: `${gamification.levelProgress.pct}%` }}
                />
              </div>
              {gamification.levelProgress.needed > 0 && (
                <span className="free-quiz__xp-progress-text">
                  {gamification.levelProgress.current} / {gamification.levelProgress.needed} XP to next level
                </span>
              )}
            </div>

            {/* Badges earned */}
            {gamification.newBadges?.length > 0 && (
              <div className="free-quiz__badges-earned">
                <div className="free-quiz__badges-title">Badges Earned!</div>
                <div className="free-quiz__badge-tiles">
                  {gamification.newBadges.map(key => {
                    const badge = BADGES.find(b => b.key === key);
                    if (!badge) return null;
                    return (
                      <div key={key} className="free-quiz__badge-tile">
                        <span className="free-quiz__badge-icon">{badge.icon}</span>
                        <span className="free-quiz__badge-label">{badge.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

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
                {r?.userAnswer && (
                  <div className={`free-quiz__review-user-answer free-quiz__review-user-answer--${status}`}>
                    Your answer: &ldquo;{r.userAnswer}&rdquo;
                  </div>
                )}
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

        {/* Signup nudge for anonymous users */}
        {nudgeMessage && (
          <SignupNudge
            message={nudgeMessage}
            onSignUp={() => navigate('/')}
            onDismiss={() => {}}
          />
        )}

        <div className="results-watermark">
          <img src="/qwizzeria-logo.png" alt="" className="results-watermark__logo" onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }} />
          <span className="results-watermark__tagline">I learn, therefore I am</span>
        </div>
      </div>
    </div>
  );
}
