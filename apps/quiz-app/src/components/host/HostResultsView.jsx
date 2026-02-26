import { useState } from 'react';
import '../../styles/HostResultsView.css';

const MEDAL_ICONS = ['&#129351;', '&#129352;', '&#129353;']; // gold, silver, bronze

export default function HostResultsView({ participants, skippedQuestions = [], onPlayAgain, onNewQuiz }) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  const [skippedExpanded, setSkippedExpanded] = useState(true);

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

      {skippedQuestions.length > 0 && (
        <div className="host-results__skipped">
          <button
            className="host-results__skipped-toggle"
            onClick={() => setSkippedExpanded(prev => !prev)}
          >
            <span>Skipped Answers ({skippedQuestions.length})</span>
            <span className={`host-results__skipped-arrow ${skippedExpanded ? 'host-results__skipped-arrow--open' : ''}`}>
              &#9660;
            </span>
          </button>
          {skippedExpanded && (
            <div className="host-results__skipped-list">
              {skippedQuestions.map((q, i) => (
                <div key={q.id || i} className="host-results__skipped-card">
                  <div className="host-results__skipped-category">{q.topic}</div>
                  <div className="host-results__skipped-question">{q.question}</div>
                  <div className="host-results__skipped-answer">{q.answer}</div>
                  {q.answerExplanation && (
                    <div className="host-results__skipped-explanation">{q.answerExplanation}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="host-results__actions">
        <button className="host-results__btn host-results__btn--primary" onClick={onPlayAgain}>
          Play Again
        </button>
        <button className="host-results__btn host-results__btn--secondary" onClick={onNewQuiz}>
          New Quiz
        </button>
      </div>

      <div className="results-watermark">
        <img src="/qwizzeria-logo.png" alt="" className="results-watermark__logo" onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }} />
        <span className="results-watermark__tagline">I learn, therefore I am</span>
      </div>
    </div>
  );
}
