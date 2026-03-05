import { useState, useEffect } from 'react';
import '../styles/QuestionView.css';

export default function QuestionView({ question, onRevealAnswer, onBack, onSkip }) {
  const [mediaVisible, setMediaVisible] = useState(question.mediaType === 'image');

  useEffect(() => {
    setMediaVisible(question.mediaType === 'image');
  }, [question]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onBack();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onBack]);

  const hasMedia = question.mediaType !== 'none';
  const isVideo = question.mediaType === 'video';
  const isDirectVideo = isVideo && /\.(mp4|webm|ogg)(\?.*)?$/i.test(question.embedUrl);

  return (
    <div className="question-view">
      <img
        src="/qwizzeria-logo.png"
        alt=""
        aria-hidden="true"
        className="qv-watermark"
      />
      <div className="question-view__content">
        <div className="question-view__topic">{question.topic}</div>
        <div className="question-view__points">{question.points} pts</div>
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
                <iframe
                  src={question.embedUrl}
                  title="Video"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              )
            ) : (
              <img src={question.embedUrl} alt="Question visual" />
            )}
          </div>
        )}

        <div className="question-view__actions">
          <button className="question-view__back-btn" onClick={onBack}>
            Back to Grid
          </button>
          {onSkip && (
            <button className="question-view__skip-btn" onClick={onSkip}>
              Next
            </button>
          )}
          <button className="question-view__reveal-btn" onClick={onRevealAnswer}>
            Reveal Answer
          </button>
        </div>
      </div>
    </div>
  );
}
