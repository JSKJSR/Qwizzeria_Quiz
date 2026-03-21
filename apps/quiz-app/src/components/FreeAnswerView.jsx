import { useEffect } from 'react';
import '../styles/AnswerView.css';

export default function FreeAnswerView({ question, isCorrect, userAnswer, xpEarned, onContinue, onOverride, onReturn }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onReturn();
      if (e.key === 'Enter') onContinue();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onReturn, onContinue]);

  const hasMedia = question.mediaType !== 'none';
  const isVideo = question.mediaType === 'video';
  const isDirectVideo = isVideo && /\.(mp4|webm|ogg)(\?.*)?$/i.test(question.embedUrl);

  return (
    <div className="answer-view">
      <img
        src="/qwizzeria-logo.png"
        alt=""
        aria-hidden="true"
        className="av-watermark"
      />
      <div className="answer-view__content">
        <div className={`answer-view__result-badge ${isCorrect ? 'answer-view__result-badge--correct' : 'answer-view__result-badge--wrong'}`}>
          {isCorrect ? 'Correct!' : 'Not quite'}
        </div>

        {xpEarned > 0 && (
          <div className="answer-view__xp-earned" aria-live="polite">
            +{xpEarned} XP
          </div>
        )}

        <div className="answer-view__label">Answer</div>
        <div className="answer-view__text">{question.answer}</div>

        {question.answerExplanation && (
          <p className="answer-view__explanation">{question.answerExplanation}</p>
        )}

        {userAnswer && (
          <div className={`answer-view__user-answer ${isCorrect ? 'answer-view__user-answer--correct' : 'answer-view__user-answer--wrong'}`}>
            Your answer: &ldquo;{userAnswer}&rdquo; {isCorrect ? '\u2713' : '\u2717'}
          </div>
        )}

        {hasMedia && (
          <div className="answer-view__media-container">
            {isVideo ? (
              isDirectVideo ? (
                <video controls src={question.embedUrl} />
              ) : (
                <iframe
                  src={question.embedUrl}
                  title="Answer visual"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              )
            ) : (
              <img src={question.embedUrl} alt="Answer visual" />
            )}
          </div>
        )}

        <div className="answer-view__feedback-actions">
          <button className="answer-view__continue-btn" onClick={onContinue}>
            Continue <span className="answer-view__shortcut">Enter</span>
          </button>
          {!isCorrect && onOverride && (
            <button className="answer-view__override-btn" onClick={onOverride}>
              I was close
            </button>
          )}
        </div>

        <button className="answer-view__back-link" onClick={onReturn}>
          Back to Grid
        </button>
      </div>
    </div>
  );
}
