export default function DoublesQuestionView({ question, questionNumber, response, onResponseChange }) {
  return (
    <div className="doubles-question">
      <div className="doubles-question__header">
        <span className="doubles-question__number">Q{questionNumber}</span>
        {question.category && (
          <span className="doubles-question__category">{question.category}</span>
        )}
      </div>

      {question.media_url && (
        <div className="doubles-question__media">
          <img src={question.media_url} alt="Question media" className="doubles-question__media-img" />
        </div>
      )}

      <p className="doubles-question__text">{question.question_text}</p>

      <div className="doubles-question__input-wrapper">
        <input
          type="text"
          className="doubles-question__input"
          value={response || ''}
          onChange={(e) => onResponseChange(question.id, e.target.value)}
          placeholder="Type your answer..."
          autoComplete="off"
        />
      </div>
    </div>
  );
}
