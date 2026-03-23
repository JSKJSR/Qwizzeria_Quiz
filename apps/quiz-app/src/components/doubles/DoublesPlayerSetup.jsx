import { useState } from 'react';
import usePartnerLookup from '@/hooks/usePartnerLookup';

const STATUS_MESSAGES = {
  checking: { className: '--checking', text: 'Checking...' },
  not_found: { className: '--error', text: 'No registered user found with this email' },
  unavailable: { className: '--error', text: 'This user is already in an active doubles session' },
  self_error: { className: '--error', text: 'You cannot partner with yourself' },
  error: { className: '--error', text: 'Something went wrong. Please try again.' },
};

export default function DoublesPlayerSetup({ packTitle, onSubmit, onBack }) {
  const [name, setName] = useState('');
  const partner = usePartnerLookup();

  const canSubmit = name.trim() && partner.status === 'found';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      playerName: name.trim(),
      passiveParticipant: {
        displayName: partner.data.displayName || partner.email.trim(),
        userId: partner.data.userId,
        email: partner.email.trim().toLowerCase(),
      },
    });
  };

  const statusInfo = STATUS_MESSAGES[partner.status];

  return (
    <div className="doubles-player-setup">
      <h2 className="doubles-player-setup__title">Player Setup</h2>
      <p className="doubles-player-setup__subtitle">
        You are about to play: <strong>{packTitle}</strong>
      </p>

      <form onSubmit={handleSubmit} className="doubles-player-setup__form">
        <div className="doubles-player-setup__section">
          <label className="doubles-player-setup__label" htmlFor="player-name">Your Name</label>
          <input
            id="player-name"
            type="text"
            className="doubles-player-setup__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={50}
            autoFocus
          />
        </div>

        <div className="doubles-player-setup__section doubles-player-setup__partner">
          <label className="doubles-player-setup__label" htmlFor="partner-email">
            Partner&apos;s Registered Email
          </label>
          <input
            id="partner-email"
            type="email"
            className={`doubles-player-setup__input ${
              partner.status === 'found' ? 'doubles-player-setup__input--valid' :
              statusInfo ? 'doubles-player-setup__input--invalid' : ''
            }`}
            value={partner.email}
            onChange={(e) => partner.handleEmailChange(e.target.value)}
            placeholder="partner@example.com"
          />

          <div className="doubles-player-setup__status" role="status" aria-live="polite">
            {partner.status === 'found' && partner.data && (
              <span className="doubles-player-setup__status--found">
                Partner found: <strong>{partner.data.displayName || partner.email.trim()}</strong>
              </span>
            )}
            {statusInfo && (
              <span className={`doubles-player-setup__status${statusInfo.className}`}>
                {statusInfo.text}
              </span>
            )}
          </div>
        </div>

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
            disabled={!canSubmit}
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
