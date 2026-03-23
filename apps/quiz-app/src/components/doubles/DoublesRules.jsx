import { useState } from 'react';

export default function DoublesRules({ packTitle, part1TimerMinutes, part2TimerMinutes, part1Count, part2Count, part2Skipped, partnerName, onAccept, onBack }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="doubles-rules">
      <h2 className="doubles-rules__title">Rules &amp; Instructions</h2>
      <p className="doubles-rules__subtitle">
        {packTitle}
        {partnerName && <> &middot; Playing with <strong>{partnerName}</strong></>}
      </p>

      <div className="doubles-rules__card">
        <ul className="doubles-rules__list">
          {part2Skipped ? (
            <li>The quiz has <strong>{part1Count} questions</strong> with a <strong>{part1TimerMinutes}-minute</strong> timer.</li>
          ) : (
            <>
              <li>The quiz has <strong>two parts</strong>: Part 1 ({part1Count} questions, {part1TimerMinutes} min) and Part 2 ({part2Count} questions, {part2TimerMinutes} min).</li>
            </>
          )}
          <li>Type your answer for each question in the text field provided.</li>
          <li>All questions are visible in a scrollable list &mdash; answer in any order.</li>
          <li>Your responses are <strong>auto-saved</strong> as you type.</li>
          <li>When the timer expires, your part is <strong>automatically submitted</strong>.</li>
          <li>You can also submit manually before the timer runs out.</li>
          {!part2Skipped && (
            <li>After each part, you will see a <strong>review</strong> of all questions with correct answers.</li>
          )}
          <li>Do <strong>not</strong> refresh or close the browser during the quiz &mdash; your progress will be saved, but the timer keeps running.</li>
        </ul>
      </div>

      <div className="doubles-rules__warning">
        <strong>Important:</strong> Once you start the quiz, you cannot go back or reset it. The timer begins immediately and cannot be paused.
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
          {part2Skipped ? 'Start Quiz' : 'Start Part 1'}
        </button>
      </div>
    </div>
  );
}
