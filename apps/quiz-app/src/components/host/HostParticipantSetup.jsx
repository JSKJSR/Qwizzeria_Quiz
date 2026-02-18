import { useState, useCallback } from 'react';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

export default function HostParticipantSetup({ pack, questionCount, onStart, onChangePack }) {
  const [names, setNames] = useState(['', '']);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(30);

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
    onStart(
      names.map(n => n.trim()),
      { minutes, seconds }
    );
  }, [allNamesFilled, names, minutes, seconds, onStart]);

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

      <h1 className="host-setup__title">Player Setup</h1>

      <div className="host-setup__players">
        {names.map((name, i) => (
          <div key={i} className="host-setup__player-row">
            <span className="host-setup__player-label">Player {i + 1}</span>
            <input
              className="host-setup__player-input"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(i, e.target.value)}
              placeholder={`Player ${i + 1} name`}
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
            + Add Player
          </button>
        )}
      </div>

      <div className="host-setup__timer">
        <h2 className="host-setup__timer-title">Timer Settings</h2>
        <p className="host-setup__timer-desc">Set to 0:00 for untimed mode</p>
        <div className="host-setup__timer-inputs">
          <label className="host-setup__timer-label">
            <span>Minutes</span>
            <input
              type="number"
              className="host-setup__timer-input"
              min={0}
              max={10}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
            />
          </label>
          <span className="host-setup__timer-colon">:</span>
          <label className="host-setup__timer-label">
            <span>Seconds</span>
            <input
              type="number"
              className="host-setup__timer-input"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
            />
          </label>
        </div>
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
