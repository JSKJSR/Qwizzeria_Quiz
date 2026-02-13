import { useState } from 'react';
import '../styles/ParticipantSetup.css';

export default function ParticipantSetup({ quizLoaded, onStart }) {
  const [names, setNames] = useState(['', '']);

  function updateName(index, value) {
    const updated = [...names];
    updated[index] = value;
    setNames(updated);
  }

  function addParticipant() {
    if (names.length < 8) {
      setNames([...names, '']);
    }
  }

  function removeParticipant() {
    if (names.length > 2) {
      setNames(names.slice(0, -1));
    }
  }

  const allFilled = names.every(n => n.trim() !== '');
  const canStart = quizLoaded && allFilled;

  function handleStart() {
    if (canStart) {
      onStart(names.map(n => n.trim()));
    }
  }

  return (
    <div className="participant-setup">
      <div className="participant-setup__title">Teams / Players</div>
      <div className="participant-setup__list">
        {names.map((name, i) => (
          <div className="participant-setup__row" key={i}>
            <span className="participant-setup__number">{i + 1}.</span>
            <input
              className="participant-setup__input"
              type="text"
              placeholder={`Team ${i + 1}`}
              value={name}
              onChange={(e) => updateName(i, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />
          </div>
        ))}
      </div>
      <div className="participant-setup__buttons">
        <button
          className="participant-setup__btn participant-setup__btn--add"
          onClick={addParticipant}
          disabled={names.length >= 8}
        >
          + Add
        </button>
        <button
          className="participant-setup__btn participant-setup__btn--remove"
          onClick={removeParticipant}
          disabled={names.length <= 2}
        >
          - Remove
        </button>
      </div>
      <button
        className="participant-setup__start"
        onClick={handleStart}
        disabled={!canStart}
      >
        Start Quiz
      </button>
    </div>
  );
}
