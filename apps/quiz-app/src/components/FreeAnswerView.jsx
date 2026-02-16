import { useEffect } from 'react';
import '../styles/AnswerView.css';

export default function FreeAnswerView({ question, onSelfAssess, onReturn }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onReturn();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onReturn]);

  const hasMedia = question.mediaType !== 'none';
  const isVideo = question.mediaType === 'video';
  const isDirectVideo = isVideo && /\.(mp4|webm|ogg)(\?.*)?$/i.test(question.embedUrl);

  return (
    <div className="answer-view">
      <div className="answer-view__content">
        <div className="answer-view__label">Answer</div>
        <div className="answer-view__text">{question.answer}</div>

        {question.answerExplanation && (
          <p className="answer-view__explanation">{question.answerExplanation}</p>
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

        <div className="answer-view__award-section">
          <div className="answer-view__award-label">
            Did you know the answer? ({question.points} pts)
          </div>
          <div className="answer-view__team-buttons">
            <button
              className="answer-view__team-btn"
              style={{ borderColor: 'var(--accent-success, #4caf50)' }}
              onClick={() => onSelfAssess(true)}
            >
              I Knew It
            </button>
            <button
              className="answer-view__team-btn"
              onClick={() => onSelfAssess(false)}
            >
              Didn&apos;t Know
            </button>
          </div>
          <button className="answer-view__no-points-btn" onClick={() => onSelfAssess(false, true)}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
