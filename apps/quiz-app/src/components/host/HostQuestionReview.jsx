import '../../styles/HostQuestionReview.css';

export default function HostQuestionReview({ topics, completedQuestionIds, skippedQuestions, onConfirmEnd }) {
  const skippedIds = new Set(skippedQuestions.map(q => q.id));
  const completedIds = new Set(completedQuestionIds);

  // Flatten all questions grouped by category
  const categories = topics.map(topic => {
    const questions = topic.questions.map(q => {
      const isSkipped = skippedIds.has(q.id);
      const isCompleted = completedIds.has(q.id);
      return { ...q, isSkipped, isCompleted };
    });
    return { name: topic.name, questions };
  });

  const totalCompleted = completedQuestionIds.length;
  const totalSkipped = skippedQuestions.length;
  const totalQuestions = topics.reduce((sum, t) => sum + t.questions.length, 0);
  const totalUnanswered = totalQuestions - totalCompleted;

  return (
    <div className="host-review">
      <h2 className="host-review__title">Question Review</h2>
      <p className="host-review__summary">
        {totalCompleted - totalSkipped} answered, {totalSkipped} skipped, {totalUnanswered} unanswered
      </p>

      <div className="host-review__list">
        {categories.map(cat => (
          <div key={cat.name} className="host-review__category">
            <div className="host-review__category-name">{cat.name}</div>
            {cat.questions.map(q => {
              let cardClass = 'host-review__card';
              if (q.isSkipped) cardClass += ' host-review__card--skipped';
              else if (!q.isCompleted) cardClass += ' host-review__card--unanswered';

              return (
                <div key={q.id} className={cardClass}>
                  <div className="host-review__question-text">{q.question}</div>
                  {q.isSkipped && <span className="host-review__badge host-review__badge--skipped">Skipped</span>}
                  {!q.isCompleted && !q.isSkipped && <span className="host-review__badge host-review__badge--unanswered">Unanswered</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="host-review__actions">
        <button className="host-results__btn host-results__btn--primary" onClick={onConfirmEnd}>
          Confirm End Quiz
        </button>
      </div>
    </div>
  );
}
