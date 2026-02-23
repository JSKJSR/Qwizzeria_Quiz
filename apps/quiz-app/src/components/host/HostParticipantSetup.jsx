import { useState, useCallback } from 'react';

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 8;

export default function HostParticipantSetup({ pack, questionCount, onStart, onChangePack }) {
  const [names, setNames] = useState(['']);

  const handleNameChange = useCallback((index, value) => {
    setNames(prev => prev.map((n, i) => i === index ? value : n));
  }, []);

  const handleAddPlayer = useCallback(() => {
    if (names.length < MAX_PLAYERS) {
      setNames(prev => [...prev, '']);
    }
  }, [names.length]);

  const handleRemovePlayer = useCallback((index) => {
    if (names.length > MIN_PLAYERS) {
      setNames(prev => prev.filter((_, i) => i !== index));
    }
  }, [names.length]);

  const allNamesFilled = names.every(n => n.trim().length > 0);

  const handleStart = useCallback(() => {
    if (!allNamesFilled) return;
    onStart(names.map(n => n.trim()));
  }, [allNamesFilled, names, onStart]);

  return (
    <div className="host-setup">
      <div className="host-setup__pack-info">
        <h2 className="host-setup__pack-title">{pack?.title || 'Quiz Pack'}</h2>
        <p className="host-setup__pack-meta">
          {questionCount} questions
          {pack?.category && <> &middot; {pack.category}</>}
        </p>
        <button className="host-setup__change-btn" onClick={onChangePack}>
          Change Pack
        </button>
      </div>

      <h1 className="host-setup__title">Player / Team Setup</h1>

      <div className="host-setup__players">
        {names.map((name, i) => (
          <div key={i} className="host-setup__player-row">
            <span className="host-setup__player-label">Player / Team {i + 1}</span>
            <input
              className="host-setup__player-input"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(i, e.target.value)}
              placeholder={`Player / Team ${i + 1} name`}
              maxLength={30}
            />
            {names.length > MIN_PLAYERS && (
              <button
                className="host-setup__remove-btn"
                onClick={() => handleRemovePlayer(i)}
                title="Remove player"
              >
                &times;
              </button>
            )}
          </div>
        ))}

        {names.length < MAX_PLAYERS && (
          <button className="host-setup__add-btn" onClick={handleAddPlayer}>
            + Add more (up to {MAX_PLAYERS})
          </button>
        )}
      </div>

      <button
        className="host-setup__start-btn"
        onClick={handleStart}
        disabled={!allNamesFilled}
      >
        Start Quiz
      </button>
    </div>
  );
}
