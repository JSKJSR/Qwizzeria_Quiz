import { useState, useCallback } from 'react';
import '../../styles/BuzzerOverlay.css';

/**
 * BuzzerOverlay — floating buzzer controls (bottom-right).
 *
 * Shows a compact FAB that expands to reveal:
 * - Open/Lock buzzer button
 * - Ranked buzz results
 * - Award buttons
 * - Connected participants list
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
}) {
  const [expanded, setExpanded] = useState(false);

  const handleOpenBuzzer = useCallback(() => {
    onOpenBuzzer(allowedUserIds || null);
  }, [onOpenBuzzer, allowedUserIds]);

  const handleSelectWinner = useCallback((buzz) => {
    onAnnounceBuzzResult(buzz.userId, buzz.displayName);
  }, [onAnnounceBuzzResult]);

  if (isCreating || !roomCode) return null;

  const hasBuzzes = buzzes.length > 0;
  const statusLabel = isOpen ? 'ACTIVE' : hasBuzzes ? 'RESULTS' : 'READY';
  const statusClass = isOpen ? 'buzzer-fab--active' : hasBuzzes ? 'buzzer-fab--results' : '';

  return (
    <div className="buzzer-fab-container">
      {/* Expanded panel */}
      {expanded && (
        <div className="buzzer-fab__panel">
          {/* Connected participants */}
          <div className="buzzer-fab__section">
            <div className="buzzer-fab__section-label">
              Connected ({participants.length})
            </div>
            {participants.length > 0 ? (
              <div className="buzzer-fab__participant-list">
                {participants.map(p => (
                  <span key={p.userId} className="buzzer-fab__participant-chip">
                    {p.displayName}
                  </span>
                ))}
              </div>
            ) : (
              <div className="buzzer-fab__empty">Waiting for players...</div>
            )}
          </div>

          {/* Buzzer action */}
          <div className="buzzer-fab__section">
            {!isOpen && buzzes.length === 0 && (
              <button className="buzzer-fab__open-btn" onClick={handleOpenBuzzer}>
                Open Buzzer
              </button>
            )}

            {isOpen && (
              <div className="buzzer-fab__live-row">
                <span className="buzzer-fab__live-badge">BUZZER OPEN</span>
                <span className="buzzer-fab__live-count">
                  {buzzes.length} buzz{buzzes.length !== 1 ? 'es' : ''}
                </span>
                <button className="buzzer-fab__lock-btn" onClick={onLockBuzzer}>
                  Lock
                </button>
              </div>
            )}
          </div>

          {/* Tie indicator */}
          {buzzResult?.isTied && !isOpen && (
            <div className="buzzer-fab__tie-notice">
              TIE — Host decides who gets the point
            </div>
          )}

          {/* Buzz results */}
          {hasBuzzes && (
            <div className="buzzer-fab__section">
              <div className="buzzer-fab__buzz-list">
                {buzzes.map((b) => (
                  <div key={b.userId} className={`buzzer-fab__buzz-row ${b.isTied ? 'buzzer-fab__buzz-row--tied' : ''}`}>
                    <span className="buzzer-fab__buzz-rank">
                      #{b.rank || 1}{b.isTied ? ' \u2248' : ''}
                    </span>
                    <span className="buzzer-fab__buzz-name">{b.displayName}</span>
                    <span className="buzzer-fab__buzz-time">{b.buzzOffset}ms</span>
                    {!isOpen && (
                      <button
                        className="buzzer-fab__award-btn"
                        onClick={() => handleSelectWinner(b)}
                        title={`Award to ${b.displayName}`}
                      >
                        Award
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!isOpen && (
                <button className="buzzer-fab__reset-btn" onClick={onResetBuzzer}>
                  Reset Buzzer
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* FAB button */}
      <button
        className={`buzzer-fab ${statusClass}`}
        onClick={() => setExpanded(e => !e)}
        title="Buzzer controls"
      >
        <span className="buzzer-fab__icon">
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2 14h-4v-1h4v1zm0-2h-4v-1h4v1zm-1.5-3.41V14h-1v-3.41l-2.29-2.3.7-.7L12 9.67l2.09-2.08.7.7-2.29 2.3zM9 20v1c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zM9 20v1c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9z"/>
            </svg>
          )}
        </span>
        <span className="buzzer-fab__text">
          BUZZER ({statusLabel})
        </span>
        {isOpen && <span className="buzzer-fab__pulse" />}
      </button>
    </div>
  );
}
