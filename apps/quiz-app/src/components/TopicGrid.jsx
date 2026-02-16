import '../styles/TopicGrid.css';

export default function TopicGrid({ topics, completedQuestionIds, onSelectQuestion }) {
  const completedSet = new Set(completedQuestionIds);

  // Build rows: each row is one point level across all categories
  const rowCount = Math.max(...topics.map(t => t.questions.length));
  const colCount = topics.length;

  return (
    <div className="topic-grid">
      <div
        className="topic-grid__table"
        style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
      >
        {/* Category headers */}
        {topics.map(topic => (
          <div key={topic.name} className="topic-grid__header">
            {topic.name}
          </div>
        ))}

        {/* Question cells row by row */}
        {Array.from({ length: rowCount }, (_, rowIdx) =>
          topics.map(topic => {
            const q = topic.questions[rowIdx];
            if (!q) return <div key={`${topic.name}-${rowIdx}`} />;
            const isCompleted = completedSet.has(q.id);
            return (
              <div
                key={q.id}
                className={`topic-grid__cell ${isCompleted ? 'topic-grid__cell--completed' : ''}`}
                onClick={() => !isCompleted && onSelectQuestion(q)}
              >
                <div className="topic-grid__points">{q.points}</div>
                {q.mediaType !== 'none' && (
                  <div className="topic-grid__media-icons">
                    <span className="topic-grid__media-icon">
                      {q.mediaType === 'video' ? '▶' : '📷'}
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
