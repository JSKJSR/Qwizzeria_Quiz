export default function DoublesBreakView({ part2QuestionCount, part2TimerMinutes, onStartPart2 }) {
  return (
    <div className="doubles-break">
      <h2 className="doubles-break__title">Part 1 Complete!</h2>
      <p className="doubles-break__text">Take a breather. When you're ready, start Part 2.</p>
      <p className="doubles-break__info">
        Part 2 has {part2QuestionCount} questions with a {part2TimerMinutes}-minute timer.
      </p>
      <div className="doubles-rules__warning">
        <strong>Important:</strong> Once you start Part 2, you cannot go back or reset the quiz. The timer begins immediately.
      </div>
      <button
        type="button"
        className="doubles-btn doubles-btn--primary doubles-btn--large"
        onClick={onStartPart2}
      >
        Start Part 2
      </button>
    </div>
  );
}
