import { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/QuestionView.css';

function CountdownRing({ seconds, total, onExpired }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? seconds / total : 0;
  const offset = circumference * (1 - progress);
  const isUrgent = seconds <= 5 && seconds > 0;
  const isExpired = seconds <= 0;
  const expiredRef = useRef(false);

  useEffect(() => {
    if (isExpired && !expiredRef.current) {
      expiredRef.current = true;
      onExpired();
    }
  }, [isExpired, onExpired]);

  useEffect(() => { expiredRef.current = false; }, [total]);

  const strokeColor = isExpired || isUrgent ? '#f44336' : 'var(--accent-primary, #e85c1a)';

  return (
    <div className={`qv-timer ${isUrgent ? 'qv-timer--urgent' : ''} ${isExpired ? 'qv-timer--expired' : ''}`}>
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="26" cy="26" r={radius} fill="none" stroke={strokeColor} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s' }}
        />
      </svg>
      <span className="qv-timer__text" aria-label={`${seconds} seconds remaining`}>
        {isExpired ? '0' : seconds}
      </span>
    </div>
  );
}

export default function QuestionView({ question, onRevealAnswer, onSubmitAnswer, onBack, onSkip, timerSeconds, showAnswerInput = false }) {
  const [mediaVisible, setMediaVisible] = useState(question.mediaType === 'image');
  const [countdown, setCountdown] = useState(timerSeconds || 0);
  const [answerText, setAnswerText] = useState('');
  const intervalRef = useRef(null);
  const inputRef = useRef(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    setMediaVisible(question.mediaType === 'image');
    setAnswerText('');
    submittedRef.current = false;
  }, [question]);

  useEffect(() => {
    if (showAnswerInput && inputRef.current) inputRef.current.focus();
  }, [showAnswerInput, question.id]);

  useEffect(() => {
    if (!timerSeconds) return;
    setCountdown(timerSeconds);
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerSeconds, question.id]);

  const doSubmit = useCallback((text) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    onSubmitAnswer(text);
  }, [onSubmitAnswer]);

  const handleTimerExpired = () => {
    if (showAnswerInput && onSubmitAnswer) doSubmit(answerText);
    else if (onRevealAnswer) onRevealAnswer();
  };

  const handleFormSubmit = (e) => {
    e?.preventDefault();
    if (showAnswerInput && onSubmitAnswer) doSubmit(answerText);
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onBack]);

  const hasMedia = question.mediaType !== 'none';
  const isVideo = question.mediaType === 'video';
  const isDirectVideo = isVideo && /\.(mp4|webm|ogg)(\?.*)?$/i.test(question.embedUrl);

  return (
    <div className="question-view">
      <img src="/qwizzeria-logo.png" alt="" aria-hidden="true" className="qv-watermark" />
      <div className="question-view__content">
        <div className="question-view__topic">{question.topic}</div>

        <div className="question-view__points-row">
          {timerSeconds > 0 && (
            <CountdownRing seconds={countdown} total={timerSeconds} onExpired={handleTimerExpired} />
          )}
          <div className="question-view__points">{question.points} pts</div>
        </div>

        <div className="question-view__text">{question.question}</div>

        {hasMedia && isVideo && (
          <button
            className={`question-view__media-btn ${mediaVisible ? 'question-view__media-btn--active' : ''}`}
            onClick={() => setMediaVisible(!mediaVisible)}
          >
            ▶ Video
          </button>
        )}

        {hasMedia && (question.mediaType === 'image' || mediaVisible) && (
          <div className="question-view__media-container">
            {isVideo ? (
              isDirectVideo ? (
                <video controls src={question.embedUrl} />
              ) : (
                <iframe src={question.embedUrl} title="Video" allowFullScreen allow="autoplay; encrypted-media" />
              )
            ) : (
              <img src={question.embedUrl} alt="Question visual" />
            )}
          </div>
        )}

        {showAnswerInput ? (
          <>
            <form className="question-view__answer-form" onSubmit={handleFormSubmit}>
              <input
                ref={inputRef}
                type="text"
                className="question-view__answer-input"
                placeholder="Type your answer..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                maxLength={200}
                autoComplete="off"
                aria-label="Your answer"
              />
              <button type="submit" className="question-view__submit-btn" aria-label="Submit answer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>
            <div className="question-view__actions question-view__actions--secondary">
              <button className="question-view__back-btn" onClick={onBack}>Back to Grid</button>
            </div>
          </>
        ) : (
          <div className="question-view__actions">
            <button className="question-view__back-btn" onClick={onBack}>Back to Grid</button>
            {onSkip && <button className="question-view__skip-btn" onClick={onSkip}>Next</button>}
            <button className="question-view__reveal-btn" onClick={onRevealAnswer}>Reveal Answer</button>
          </div>
        )}
      </div>
    </div>
  );
}
