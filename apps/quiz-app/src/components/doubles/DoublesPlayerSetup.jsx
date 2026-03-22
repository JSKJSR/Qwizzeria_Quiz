import { useState, useRef, useCallback } from 'react';
import { lookupUserByEmail, checkDoublesAvailability } from '@qwizzeria/supabase-client';

const DEBOUNCE_MS = 500;

export default function DoublesPlayerSetup({ packTitle, onSubmit, onBack }) {
  const [name, setName] = useState('');
  const [showPartner, setShowPartner] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerStatus, setPartnerStatus] = useState('empty'); // empty | checking | found | not_found | unavailable | self_error | error
  const [partnerData, setPartnerData] = useState(null); // { userId, displayName }
  const debounceRef = useRef(null);

  const validateEmail = useCallback(async (email) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setPartnerStatus('empty');
      setPartnerData(null);
      return;
    }

    setPartnerStatus('checking');
    setPartnerData(null);

    try {
      const result = await lookupUserByEmail(trimmed);
      if (!result) {
        setPartnerStatus('not_found');
        return;
      }

      const available = await checkDoublesAvailability(result.userId);
      if (!available) {
        setPartnerStatus('unavailable');
        setPartnerData(result);
        return;
      }

      setPartnerStatus('found');
      setPartnerData(result);
    } catch (err) {
      if (err.message?.includes('own email')) {
        setPartnerStatus('self_error');
      } else {
        setPartnerStatus('error');
      }
    }
  }, []);

  const handleEmailChange = useCallback((e) => {
    const value = e.target.value;
    setPartnerEmail(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setPartnerStatus('empty');
      setPartnerData(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      validateEmail(value);
    }, DEBOUNCE_MS);
  }, [validateEmail]);

  const handleTogglePartner = () => {
    setShowPartner((prev) => {
      if (prev) {
        setPartnerEmail('');
        setPartnerStatus('empty');
        setPartnerData(null);
      }
      return !prev;
    });
  };

  const isPartnerValid = !showPartner || partnerStatus === 'found';
  const canSubmit = name.trim() && isPartnerValid;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      playerName: name.trim(),
      passiveParticipant: showPartner && partnerData
        ? { userId: partnerData.userId, displayName: partnerData.displayName, email: partnerEmail.trim().toLowerCase() }
        : null,
    });
  };

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

        <div className="doubles-player-setup__partner-toggle">
          <button
            type="button"
            className="doubles-btn doubles-btn--link"
            onClick={handleTogglePartner}
          >
            {showPartner ? 'Remove partner' : 'Add a partner'}
          </button>
        </div>

        {showPartner && (
          <div className="doubles-player-setup__section doubles-player-setup__partner">
            <label className="doubles-player-setup__label" htmlFor="partner-email">
              Partner&apos;s Registered Email
            </label>
            <input
              id="partner-email"
              type="email"
              className={`doubles-player-setup__input ${
                partnerStatus === 'found' ? 'doubles-player-setup__input--valid' :
                ['not_found', 'unavailable', 'self_error', 'error'].includes(partnerStatus) ? 'doubles-player-setup__input--invalid' : ''
              }`}
              value={partnerEmail}
              onChange={handleEmailChange}
              placeholder="partner@example.com"
            />

            <div className="doubles-player-setup__status" role="status" aria-live="polite">
              {partnerStatus === 'checking' && (
                <span className="doubles-player-setup__status--checking">Checking...</span>
              )}
              {partnerStatus === 'found' && partnerData && (
                <span className="doubles-player-setup__status--found">
                  Partner found: <strong>{partnerData.displayName || partnerEmail.trim()}</strong>
                </span>
              )}
              {partnerStatus === 'not_found' && (
                <span className="doubles-player-setup__status--error">
                  No registered user found with this email
                </span>
              )}
              {partnerStatus === 'unavailable' && (
                <span className="doubles-player-setup__status--error">
                  This user is already in an active doubles session
                </span>
              )}
              {partnerStatus === 'self_error' && (
                <span className="doubles-player-setup__status--error">
                  You cannot partner with yourself
                </span>
              )}
              {partnerStatus === 'error' && (
                <span className="doubles-player-setup__status--error">
                  Something went wrong. Please try again.
                </span>
              )}
            </div>
          </div>
        )}

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
