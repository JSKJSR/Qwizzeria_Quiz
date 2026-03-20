import { useRef, useEffect, useState } from 'react';
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
  const intervalRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!timerStartedAt) return timerMinutes * 60;
    const elapsed = Math.floor((Date.now() - new Date(timerStartedAt).getTime()) / 1000);
    return Math.max(0, timerMinutes * 60 - elapsed);
  });
  const expiredRef = useRef(false);

  // Timer countdown
  useEffect(() => {
    if (!timerStartedAt) return;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(timerStartedAt).getTime()) / 1000);
      const remaining = Math.max(0, timerMinutes * 60 - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(intervalRef.current);
        onTimerExpired();
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [timerStartedAt, timerMinutes, onTimerExpired]);

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

  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = timeLeft % 60;
  const timerDisplay = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

  const getTimerClass = () => {
    if (timeLeft <= 0) return 'doubles-timer--expired';
    if (timeLeft <= 60) return 'doubles-timer--critical';
    if (timeLeft <= 300) return 'doubles-timer--warning';
    return '';
  };

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
        <div className={`doubles-timer ${getTimerClass()}`}>
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
