import { useEffect } from 'react';
import useCountdownTimer from '@/hooks/useCountdownTimer';
import DoublesQuestionView from './DoublesQuestionView';

export default function DoublesPartView({
  partNumber,
  questions,
  responses,
  timerMinutes,
  timerStartedAt,
  onResponseChange,
  onSubmit,
  onTimerExpired,
}) {
  const { timerDisplay, timerClass } = useCountdownTimer(timerMinutes, timerStartedAt, onTimerExpired);

  // Navigation guard
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const answeredCount = questions.filter(q => responses[q.id]?.trim()).length;

  return (
    <div className="doubles-part">
      {/* Sticky top bar */}
      <div className="doubles-part__topbar">
        <div className="doubles-part__info">
          <span className="doubles-part__label">Part {partNumber}</span>
          <span className="doubles-part__progress">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
        <div className={`doubles-timer ${timerClass}`}>
          {timerDisplay}
        </div>
        <button
          type="button"
          className="doubles-btn doubles-btn--submit"
          onClick={onSubmit}
        >
          Submit Part {partNumber}
        </button>
      </div>

      {/* Scrollable question list */}
      <div className="doubles-part__questions">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className={`doubles-part__question-card ${responses[q.id]?.trim() ? 'doubles-part__question-card--answered' : ''}`}
          >
            <DoublesQuestionView
              question={q}
              questionNumber={i + 1}
              response={responses[q.id]}
              onResponseChange={onResponseChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
