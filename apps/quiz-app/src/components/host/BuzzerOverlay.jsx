import { useState, useCallback } from 'react';
import '../../styles/BuzzerOverlay.css';

/**
 * BuzzerOverlay — floating buzzer/input controls (bottom-right).
 *
 * Shows a compact FAB that expands to reveal:
 * - Mode toggle (Buzzer / Input)
 * - Open/Lock buzzer or input button
 * - Ranked buzz results (buzzer mode)
 * - Response list with reveal (input mode)
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
  // Input mode props
  interactionMode = 'buzzer',
  allResponses = {},
  currentInputQuestionId,
  inputRevealed = {},
  onOpenInput,
  onLockInput,
  onRevealResponses,
  onResetInput,
}) {
  const [expanded, setExpanded] = useState(false);
  const [awarded, setAwarded] = useState(false);

  const handleOpenBuzzer = useCallback(() => {
    setAwarded(false);
    onOpenBuzzer(allowedUserIds || null);
  }, [onOpenBuzzer, allowedUserIds]);

  const handleSelectWinner = useCallback((buzz) => {
    setAwarded(true);
    onAnnounceBuzzResult(buzz.userId, buzz.displayName);
  }, [onAnnounceBuzzResult]);

  const handleOpenInput = useCallback(() => {
    if (onOpenInput) onOpenInput(allowedUserIds || null);
  }, [onOpenInput, allowedUserIds]);

  if (isCreating || !roomCode) return null;

  const isInputMode = interactionMode === 'input';
  const hasBuzzes = buzzes.length > 0;
  const currentResponses = currentInputQuestionId ? (allResponses[currentInputQuestionId] || []) : [];
  const totalResponseCount = Object.values(allResponses).reduce((sum, arr) => sum + arr.length, 0);
  const isCurrentRevealed = currentInputQuestionId ? inputRevealed[currentInputQuestionId] : false;

  // FAB label
  let statusLabel;
  let statusClass = '';
  if (isInputMode) {
    if (isOpen) {
      statusLabel = 'INPUT (ACTIVE)';
      statusClass = 'buzzer-fab--input-active';
    } else if (totalResponseCount > 0) {
      statusLabel = `INPUT (${totalResponseCount})`;
      statusClass = 'buzzer-fab--input-active';
    } else {
      statusLabel = 'INPUT';
    }
  } else {
    statusLabel = isOpen ? 'ACTIVE' : hasBuzzes ? 'RESULTS' : 'READY';
    statusClass = isOpen ? 'buzzer-fab--active' : hasBuzzes ? 'buzzer-fab--results' : '';
  }

  // Can toggle mode only when not actively open and no pending buzzes
  const canToggleMode = !isOpen && !hasBuzzes;

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

          {/* Mode toggle */}
          {canToggleMode && (
            <div className="buzzer-fab__section">
              <div className="buzzer-fab__mode-toggle">
                <button
                  className={`buzzer-fab__mode-btn ${!isInputMode ? 'buzzer-fab__mode-btn--active' : ''}`}
                  onClick={() => onResetInput && onResetInput()}
                  disabled={!isInputMode}
                >
                  Buzzer
                </button>
                <button
                  className={`buzzer-fab__mode-btn ${isInputMode ? 'buzzer-fab__mode-btn--active' : ''}`}
                  onClick={() => onOpenInput && onOpenInput(allowedUserIds || null)}
                  disabled={isInputMode || !onOpenInput}
                >
                  Input
                </button>
              </div>
            </div>
          )}

          {/* ─── Buzzer Mode Controls ─── */}
          {!isInputMode && (
            <>
              <div className="buzzer-fab__section">
                {!isOpen && buzzes.length === 0 && (
                  <button className="buzzer-fab__open-btn" onClick={handleOpenBuzzer}>
                    Open Buzzer
                  </button>
                )}

                {!isOpen && awarded && buzzes.length > 0 && (
                  <button className="buzzer-fab__open-btn" onClick={handleOpenBuzzer}>
                    Re Open
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
                  {!isOpen && !awarded && (
                    <button className="buzzer-fab__reset-btn" onClick={() => { setAwarded(false); onResetBuzzer(); }}>
                      Reset Buzzer
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ─── Input Mode Controls ─── */}
          {isInputMode && (
            <>
              <div className="buzzer-fab__section">
                {isOpen && (
                  <div className="buzzer-fab__live-row">
                    <span className="buzzer-fab__input-badge">INPUT OPEN</span>
                    <span className="buzzer-fab__live-count">
                      {currentResponses.length} of {participants.length} responded
                    </span>
                    <button className="buzzer-fab__lock-btn" onClick={onLockInput}>
                      Lock
                    </button>
                  </div>
                )}

                {!isOpen && currentInputQuestionId && (
                  <button className="buzzer-fab__open-input-btn" onClick={handleOpenInput}>
                    Open Input
                  </button>
                )}
              </div>

              {/* Response list for current question */}
              {currentResponses.length > 0 && (
                <div className="buzzer-fab__section">
                  <div className="buzzer-fab__section-label">
                    Responses ({currentResponses.length})
                  </div>

                  {!isCurrentRevealed && (
                    <button
                      className="buzzer-fab__reveal-btn"
                      onClick={() => onRevealResponses(currentInputQuestionId)}
                    >
                      Reveal All
                    </button>
                  )}

                  <div className="buzzer-fab__response-list">
                    {currentResponses.map((r) => (
                      <div key={r.userId} className="buzzer-fab__response-card">
                        <span className="buzzer-fab__response-name">{r.displayName}</span>
                        {isCurrentRevealed ? (
                          <span className="buzzer-fab__response-text">{r.text}</span>
                        ) : (
                          <span className="buzzer-fab__response-hidden">Answer hidden</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset All */}
              {totalResponseCount > 0 && (
                <button className="buzzer-fab__reset-btn" onClick={onResetInput}>
                  Reset All
                </button>
              )}
            </>
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
          {isInputMode ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          ) : isOpen ? (
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
          {isInputMode ? statusLabel : `BUZZER (${statusLabel})`}
        </span>
        {(isOpen && !isInputMode) && <span className="buzzer-fab__pulse" />}
        {(isOpen && isInputMode) && <span className="buzzer-fab__pulse buzzer-fab__pulse--input" />}
      </button>
    </div>
  );
}
