import '@/styles/HostQuiz.css';

export default function HostTopicGrid({ topics, completedQuestionIds, skippedQuestionIds = [], onSelectQuestion, packTitle, packSubtitle }) {
  if (!topics || topics.length === 0) {
    return <p className="host-grid__empty">No questions loaded.</p>;
  }

  const completedSet = new Set(completedQuestionIds);
  const skippedSet = new Set(skippedQuestionIds);

  return (
    <div className="host-grid">
      {packTitle && (
        <div className="host-grid__header">
          <h2 className="host-grid__pack-title">{packTitle}</h2>
          {packSubtitle && <p className="host-grid__pack-subtitle">{packSubtitle}</p>}
        </div>
      )}
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
                {/* Status badge */}
                {isCompleted && (
                  <span className="host-grid__status-badge host-grid__status-badge--done" title="Answered">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </span>
                )}
                {isSkipped && (
                  <span className="host-grid__status-badge host-grid__status-badge--skipped" title="Skipped">?</span>
                )}

                <div className="host-grid__topic">{q.topic}</div>
                <div className="host-grid__points">{q.points}</div>

                {/* Category tag */}
                {q.category && (
                  <span className="host-grid__category-tag">{q.category}</span>
                )}

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
