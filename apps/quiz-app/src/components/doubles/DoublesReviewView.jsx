export default function DoublesReviewView({ partNumber, questions, responses, onContinue, continueLabel }) {
  const answeredCount = questions.filter(q => responses[q.id]?.trim()).length;

  return (
    <div className="doubles-review">
      <h2 className="doubles-review__title">Part {partNumber} Review</h2>
      <p className="doubles-review__summary">
        You answered {answeredCount} of {questions.length} questions.
      </p>

      <div className="doubles-review__actions">
        <button
          type="button"
          className="doubles-btn doubles-btn--primary"
          onClick={onContinue}
        >
          {continueLabel}
        </button>
      </div>

      <div className="doubles-review__list">
        {questions.map((q, i) => {
          const userResponse = responses[q.id] || '';
          const hasAnswer = userResponse.trim().length > 0;

          return (
            <div key={q.id} className="doubles-review__item">
              <div className="doubles-review__item-header">
                <span className="doubles-review__item-number">Q{i + 1}</span>
                {q.category && (
                  <span className="doubles-review__item-category">{q.category}</span>
                )}
              </div>

              {q.media_url && (
                <img src={q.media_url} alt="" className="doubles-review__item-media" />
              )}

              <p className="doubles-review__item-question">{q.question_text}</p>

              <div className="doubles-review__item-answers">
                <div className="doubles-review__correct">
                  <span className="doubles-review__label">Correct Answer:</span>
                  <span className="doubles-review__value">{q.answer_text}</span>
                </div>
                <div className={`doubles-review__response ${!hasAnswer ? 'doubles-review__response--empty' : ''}`}>
                  <span className="doubles-review__label">Your Response:</span>
                  <span className="doubles-review__value">
                    {hasAnswer ? userResponse : '(no answer)'}
                  </span>
                </div>
              </div>

              {q.answer_explanation && (
                <p className="doubles-review__explanation">{q.answer_explanation}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
