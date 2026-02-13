import { useEffect } from 'react';
import '../styles/AnswerView.css';

export default function AnswerView({ question, participants, onAwardPoints, onReturn }) {
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

  function handleAward(participantId) {
    onAwardPoints(participantId, question.points);
  }

  return (
    <div className="answer-view">
      <div className="answer-view__content">
        <div className="answer-view__label">Answer</div>
        <div className="answer-view__text">{question.answer}</div>

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
            Award {question.points} pts to:
          </div>
          <div className="answer-view__team-buttons">
            {participants.map(p => (
              <button
                key={p.id}
                className="answer-view__team-btn"
                onClick={() => handleAward(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button className="answer-view__no-points-btn" onClick={onReturn}>
            No Points
          </button>
        </div>
      </div>
    </div>
  );
}
