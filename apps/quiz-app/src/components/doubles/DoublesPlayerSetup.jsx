import { useState } from 'react';

export default function DoublesPlayerSetup({ packTitle, onSubmit, onBack }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="doubles-player-setup">
      <h2 className="doubles-player-setup__title">Enter Your Name</h2>
      <p className="doubles-player-setup__subtitle">
        You are about to play: <strong>{packTitle}</strong>
      </p>

      <form onSubmit={handleSubmit} className="doubles-player-setup__form">
        <input
          type="text"
          className="doubles-player-setup__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={50}
          autoFocus
        />
        <div className="doubles-player-setup__actions">
          <button
            type="button"
            className="doubles-btn doubles-btn--secondary"
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="submit"
            className="doubles-btn doubles-btn--primary"
            disabled={!name.trim()}
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
