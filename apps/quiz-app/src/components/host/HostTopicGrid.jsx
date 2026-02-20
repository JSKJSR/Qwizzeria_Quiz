import '../../styles/HostQuiz.css';

export default function HostTopicGrid({ topics, completedQuestionIds, skippedQuestionIds = [], onSelectQuestion }) {
  if (!topics || topics.length === 0) {
    return <p className="host-grid__empty">No questions loaded.</p>;
  }

  const completedSet = new Set(completedQuestionIds);
  const skippedSet = new Set(skippedQuestionIds);

  return (
    <div className="host-grid">
      <div className="host-grid__grid">
        {topics.flatMap(topic =>
          topic.questions.map(q => {
            const isCompleted = completedSet.has(q.id);
            const isSkipped = skippedSet.has(q.id);
            let cellClass = 'host-grid__cell';
            if (isSkipped) cellClass += ' host-grid__cell--skipped';
            else if (isCompleted) cellClass += ' host-grid__cell--completed';

            return (
              <div
                key={q.id}
                className={cellClass}
                onClick={() => !isCompleted && onSelectQuestion(q)}
              >
                <div className="host-grid__topic">{q.topic}</div>
                <div className="host-grid__points">{q.points}</div>
                {isSkipped && <div className="host-grid__skipped-badge">?</div>}
                {q.mediaType !== 'none' && (
                  <div className="host-grid__media-icons">
                    <span className="host-grid__media-icon">
                      {q.mediaType === 'video' ? '\u25B6' : '\uD83D\uDCF7'}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
