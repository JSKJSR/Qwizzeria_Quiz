import '../styles/TopicGrid.css';

export default function TopicGrid({ topics, completedQuestionIds, onSelectQuestion }) {
  const completedSet = new Set(completedQuestionIds);

  return (
    <div className="topic-grid">
      <div className="topic-grid__grid">
        {topics.flatMap(topic =>
          topic.questions.map(q => {
            const isCompleted = completedSet.has(q.id);
            return (
              <div
                key={q.id}
                className={`topic-grid__cell ${isCompleted ? 'topic-grid__cell--completed' : ''}`}
                onClick={() => !isCompleted && onSelectQuestion(q)}
              >
                <div className="topic-grid__topic">{q.topic}</div>
                <div className="topic-grid__points">{q.points}</div>
                {q.mediaType !== 'none' && (
                  <div className="topic-grid__media-icons">
                    <span className="topic-grid__media-icon">
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
