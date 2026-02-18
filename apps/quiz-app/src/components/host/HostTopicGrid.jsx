export default function HostTopicGrid({ topics, completedQuestionIds, onSelectQuestion }) {
  if (!topics || topics.length === 0) {
    return <p className="host-grid__empty">No questions loaded.</p>;
  }

  // Determine max questions per category for row count
  const maxQuestionsPerTopic = Math.max(...topics.map(t => t.questions.length));

  return (
    <div className="host-grid">
      <table className="host-grid__table">
        <thead>
          <tr>
            {topics.map((topic) => (
              <th key={topic.name} className="host-grid__header-cell">
                {topic.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxQuestionsPerTopic }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {topics.map((topic) => {
                const question = topic.questions[rowIndex];
                if (!question) {
                  return <td key={`${topic.name}-${rowIndex}`} className="host-grid__cell host-grid__cell--empty" />;
                }

                const isCompleted = completedQuestionIds.includes(question.id);
                const hasMedia = question.mediaType && question.mediaType !== 'none';

                return (
                  <td
                    key={question.id}
                    className={`host-grid__cell ${isCompleted ? 'host-grid__cell--completed' : ''}`}
                    onClick={() => !isCompleted && onSelectQuestion(question)}
                  >
                    <span className="host-grid__points">{question.points}</span>
                    {hasMedia && <span className="host-grid__media-icon">&#128247;</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
