import { useState, useCallback } from 'react';
import '../../styles/BuzzerOverlay.css';

/**
 * BuzzerOverlay — shown on the host screen during buzzer-enabled quizzes.
 *
 * Modes:
 * - lobby: Show room code + join URL + participant count
 * - active: "Open Buzzer" button + incoming buzz results
 * - results: Ranked buzz list with winner highlighted
 *
 * @param {object} props
 * @param {string} props.roomCode - 6-char room code
 * @param {Array} props.participants - [{ userId, displayName }]
 * @param {Array} props.buzzes - [{ userId, displayName, buzzOffset, rank, isTied }] ranked
 * @param {object} [props.buzzResult] - { winner, isTied, tiedBuzzes } from determineBuzzWinner
 * @param {boolean} props.isOpen - Whether buzzer is currently accepting presses
 * @param {boolean} props.isCreating - Whether room is being created
 * @param {string[]} [props.allowedUserIds] - Current match participants (for tournament)
 * @param {function} props.onOpenBuzzer - (allowedUserIds?) => void
 * @param {function} props.onLockBuzzer - () => void
 * @param {function} props.onAnnounceBuzzResult - (winnerId, winnerName) => void
 * @param {function} props.onResetBuzzer - () => void
 * @param {'lobby'|'question'} [props.mode='lobby']
 */
export default function BuzzerOverlay({
  roomCode,
  participants,
  buzzes,
  buzzResult,
  isOpen,
  isCreating,
  allowedUserIds,
  onOpenBuzzer,
  onLockBuzzer,
  onAnnounceBuzzResult,
  onResetBuzzer,
  mode = 'lobby',
}) {
  const [copied, setCopied] = useState(false);

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/buzz/${roomCode}`
    : '';

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [joinUrl]);

  const handleOpenBuzzer = useCallback(() => {
    onOpenBuzzer(allowedUserIds || null);
  }, [onOpenBuzzer, allowedUserIds]);

  const handleSelectWinner = useCallback((buzz) => {
    onAnnounceBuzzResult(buzz.userId, buzz.displayName);
  }, [onAnnounceBuzzResult]);

  // --- CREATING ---
  if (isCreating) {
    return (
      <div className="buzzer-overlay">
        <div className="buzzer-overlay__status">Setting up buzzer room...</div>
      </div>
    );
  }

  // --- NO ROOM ---
  if (!roomCode) {
    return null;
  }

  return (
    <div className="buzzer-overlay">
      {/* Room code + join info */}
      <div className="buzzer-overlay__room">
        <div className="buzzer-overlay__code-section">
          <span className="buzzer-overlay__label">Buzzer Room</span>
          <span className="buzzer-overlay__code">{roomCode}</span>
        </div>
        <div className="buzzer-overlay__join-section">
          <button className="buzzer-overlay__copy-btn" onClick={handleCopyUrl}>
            {copied ? 'Copied!' : 'Copy Join Link'}
          </button>
          <span className="buzzer-overlay__participants">
            {participants.length} player{participants.length !== 1 ? 's' : ''} connected
          </span>
        </div>
      </div>

      {/* Participant list (lobby mode) */}
      {mode === 'lobby' && participants.length > 0 && (
        <div className="buzzer-overlay__participant-list">
          {participants.map(p => (
            <span key={p.userId} className="buzzer-overlay__participant-chip">
              {p.displayName}
            </span>
          ))}
        </div>
      )}

      {/* Question mode — buzzer controls */}
      {mode === 'question' && (
        <div className="buzzer-overlay__controls">
          {!isOpen && buzzes.length === 0 && (
            <button className="buzzer-overlay__open-btn" onClick={handleOpenBuzzer}>
              Open Buzzer
            </button>
          )}

          {isOpen && (
            <div className="buzzer-overlay__live">
              <span className="buzzer-overlay__live-badge">BUZZER OPEN</span>
              <span className="buzzer-overlay__live-count">
                {buzzes.length} buzz{buzzes.length !== 1 ? 'es' : ''}
              </span>
              <button className="buzzer-overlay__lock-btn" onClick={onLockBuzzer}>
                Lock
              </button>
            </div>
          )}

          {/* Tie indicator */}
          {buzzResult?.isTied && !isOpen && (
            <div className="buzzer-overlay__tie-notice">
              TIE — Host decides who gets the point
            </div>
          )}

          {/* Buzz results */}
          {buzzes.length > 0 && (
            <div className="buzzer-overlay__buzz-list">
              {buzzes.map((b) => (
                <div key={b.userId} className={`buzzer-overlay__buzz-row ${b.isTied ? 'buzzer-overlay__buzz-row--tied' : ''}`}>
                  <span className="buzzer-overlay__buzz-rank">
                    #{b.rank || 1}{b.isTied ? ' ≈' : ''}
                  </span>
                  <span className="buzzer-overlay__buzz-name">{b.displayName}</span>
                  <span className="buzzer-overlay__buzz-time">{b.buzzOffset}ms</span>
                  {!isOpen && (
                    <button
                      className="buzzer-overlay__award-btn"
                      onClick={() => handleSelectWinner(b)}
                      title={`Award to ${b.displayName}`}
                    >
                      Award
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isOpen && buzzes.length > 0 && (
            <button className="buzzer-overlay__reset-btn" onClick={onResetBuzzer}>
              Reset Buzzer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
