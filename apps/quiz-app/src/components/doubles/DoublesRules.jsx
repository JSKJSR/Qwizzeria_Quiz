import { useState } from 'react';

export default function DoublesRules({ packTitle, timerMinutes, part1Count, part2Count, onAccept, onBack }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="doubles-rules">
      <h2 className="doubles-rules__title">Rules &amp; Instructions</h2>
      <p className="doubles-rules__subtitle">{packTitle}</p>

      <div className="doubles-rules__card">
        <ul className="doubles-rules__list">
          <li>The quiz has <strong>two parts</strong>: Part 1 ({part1Count} questions) and Part 2 ({part2Count} questions).</li>
          <li>You have <strong>{timerMinutes} minutes</strong> per part.</li>
          <li>Type your answer for each question in the text field provided.</li>
          <li>You can navigate freely between questions using Previous/Next or the question grid.</li>
          <li>Your responses are <strong>auto-saved</strong> as you type.</li>
          <li>When the timer expires, your part is <strong>automatically submitted</strong>.</li>
          <li>You can also submit manually before the timer runs out.</li>
          <li>After each part, you will see a <strong>review</strong> of all questions with correct answers.</li>
          <li>Do <strong>not</strong> refresh or close the browser during the quiz &mdash; your progress will be saved, but the timer keeps running.</li>
        </ul>
      </div>

      <label className="doubles-rules__accept">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>I have read and accept the rules. I am ready to begin.</span>
      </label>

      <div className="doubles-rules__actions">
        <button
          type="button"
          className="doubles-btn doubles-btn--secondary"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="doubles-btn doubles-btn--primary"
          disabled={!accepted}
          onClick={onAccept}
        >
          Start Part 1
        </button>
      </div>
    </div>
  );
}
