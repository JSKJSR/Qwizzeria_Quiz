import { useEffect, useState, useCallback } from 'react';
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
  const [showConfirm, setShowConfirm] = useState(false);

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
  const unansweredCount = questions.length - answeredCount;

  const handleSubmitClick = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setShowConfirm(false);
    onSubmit();
  }, [onSubmit]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

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
          onClick={handleSubmitClick}
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

      {/* Submit confirmation modal */}
      {showConfirm && (
        <div className="doubles-confirm-overlay" onClick={handleCancel}>
          <div className="doubles-confirm" onClick={(e) => e.stopPropagation()}>
            <h3 className="doubles-confirm__title">Submit Part {partNumber}?</h3>
            <p className="doubles-confirm__text">
              Once submitted, you will <strong>not be able to edit</strong> your responses for Part {partNumber}.
            </p>
            {unansweredCount > 0 && (
              <p className="doubles-confirm__warning">
                You have <strong>{unansweredCount} unanswered</strong> {unansweredCount === 1 ? 'question' : 'questions'}.
              </p>
            )}
            <div className="doubles-confirm__actions">
              <button
                type="button"
                className="doubles-btn doubles-btn--secondary"
                onClick={handleCancel}
              >
                Go Back
              </button>
              <button
                type="button"
                className="doubles-btn doubles-btn--primary"
                onClick={handleConfirm}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
