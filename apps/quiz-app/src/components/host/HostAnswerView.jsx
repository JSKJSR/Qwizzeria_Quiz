import TimerControl from './TimerControl';

export default function HostAnswerView({ question, participants, timerConfig, onAwardPoints, onNoPoints }) {
  const hasMedia = question.mediaType && question.mediaType !== 'none';
  const isVideo = question.mediaType === 'video';
  const isDirectVideo = isVideo && /\.(mp4|webm|ogg)(\?.*)?$/i.test(question.embedUrl);

  const isTimed = timerConfig.minutes > 0 || timerConfig.seconds > 0;

  return (
    <div className="host-answer">
      <div className="host-answer__content">
        <div className="host-answer__topic">{question.topic}</div>
        <div className="host-answer__points">{question.points} pts</div>

        <div className="host-answer__question-text">{question.question}</div>

        <div className="host-answer__answer-section">
          <div className="host-answer__answer-label">Answer</div>
          <div className="host-answer__answer-text">{question.answer}</div>
          {question.answerExplanation && (
            <div className="host-answer__explanation">{question.answerExplanation}</div>
          )}
        </div>

        {hasMedia && (
          <div className="host-answer__media">
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

        {isTimed && (
          <div className="host-answer__timer">
            <TimerControl
              initialMinutes={timerConfig.minutes}
              initialSeconds={timerConfig.seconds}
              autoStart={false}
            />
          </div>
        )}

        <div className="host-answer__scoring">
          <div className="host-answer__scoring-label">Award points to:</div>
          <div className="host-answer__scoring-buttons">
            {participants.map((p, i) => (
              <button
                key={i}
                className="host-answer__award-btn"
                onClick={() => onAwardPoints(i)}
              >
                <span className="host-answer__award-name">{p.name}</span>
                <span className="host-answer__award-score">{p.score} pts</span>
              </button>
            ))}
          </div>
          <button className="host-answer__no-points-btn" onClick={onNoPoints}>
            No Points
          </button>
        </div>
      </div>
    </div>
  );
}
