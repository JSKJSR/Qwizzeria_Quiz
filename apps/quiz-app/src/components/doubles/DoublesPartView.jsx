import { useState, useRef, useCallback, useEffect } from 'react';
import DoublesQuestionView from './DoublesQuestionView';

export default function DoublesPartView({
  partNumber,
  questions,
  responses,
  currentIndex,
  timerMinutes,
  timerStartedAt,
  onResponseChange,
  onNavigate,
  onSubmit,
  onTimerExpired,
}) {
  const [showGrid, setShowGrid] = useState(false);
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

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, questions.length, onNavigate]);

  const answeredCount = questions.filter(q => responses[q.id]?.trim()).length;
  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

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
      {/* Top bar */}
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
        <div className="doubles-part__actions-top">
          <button
            type="button"
            className="doubles-btn doubles-btn--small"
            onClick={() => setShowGrid(!showGrid)}
          >
            {showGrid ? 'Hide Grid' : 'Grid'}
          </button>
          <button
            type="button"
            className="doubles-btn doubles-btn--submit"
            onClick={onSubmit}
          >
            Submit Part {partNumber}
          </button>
        </div>
      </div>

      {/* Question number grid */}
      {showGrid && (
        <div className="doubles-part__grid">
          {questions.map((q, i) => (
            <button
              key={q.id}
              className={`doubles-part__grid-btn ${i === currentIndex ? 'doubles-part__grid-btn--active' : ''} ${responses[q.id]?.trim() ? 'doubles-part__grid-btn--answered' : ''}`}
              onClick={() => { onNavigate(i); setShowGrid(false); }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Question view */}
      <DoublesQuestionView
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        response={responses[currentQuestion.id]}
        onResponseChange={onResponseChange}
      />

      {/* Navigation */}
      <div className="doubles-part__nav">
        <button
          type="button"
          className="doubles-btn doubles-btn--secondary"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          Previous
        </button>
        <span className="doubles-part__nav-pos">
          {currentIndex + 1} / {questions.length}
        </span>
        <button
          type="button"
          className="doubles-btn doubles-btn--secondary"
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
