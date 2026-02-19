import '../../styles/HostQuiz.css';

export default function HostTopicGrid({ topics, completedQuestionIds, onSelectQuestion }) {
  if (!topics || topics.length === 0) {
    return <p className="host-grid__empty">No questions loaded.</p>;
  }

  const completedSet = new Set(completedQuestionIds);

  return (
    <div className="host-grid">
      <div className="host-grid__grid">
        {topics.flatMap(topic =>
          topic.questions.map(q => {
            const isCompleted = completedSet.has(q.id);
            return (
              <div
                key={q.id}
                className={`host-grid__cell ${isCompleted ? 'host-grid__cell--completed' : ''}`}
                onClick={() => !isCompleted && onSelectQuestion(q)}
              >
                <div className="host-grid__topic">{q.topic}</div>
                <div className="host-grid__points">{q.points}</div>
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
