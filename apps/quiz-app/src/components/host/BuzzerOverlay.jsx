import { useState } from 'react';
import '../../styles/BuzzerOverlay.css';

/**
 * Generate a CSV string from all responses and trigger a browser download.
 */
function exportResponsesCSV(allResponses, questionLabels, inputQuestionOrder) {
  const escapeCSV = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [['Question #', 'Question', 'Participant', 'Answer'].map(escapeCSV).join(',')];

  inputQuestionOrder.forEach((qId, idx) => {
    const label = questionLabels[qId] || '';
    const responses = allResponses[qId] || [];
    responses.forEach((r) => {
      rows.push([
        idx + 1,
        escapeCSV(label),
        escapeCSV(r.displayName),
        escapeCSV(r.text),
      ].join(','));
    });
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `responses_${new Date().toISOString().slice(0, 16).replace(':', '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * BuzzerOverlay — floating buzzer/input controls (bottom-right).
 *
 * Shows a compact FAB that expands to reveal:
 * - Mode toggle (Buzzer / Input)
 * - Open/Lock buzzer or input button
 * - Ranked buzz results (buzzer mode)
 * - Response list with reveal + question tabs (input mode)
 * - CSV export for all responses
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
  questionLabels = {},
  inputQuestionOrder = [],
  onOpenInput,
  onLockInput,
  onRevealResponses,
  onResetInput,
}) {
  const [expanded, setExpanded] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [manualQId, setManualQId] = useState(null);
  const [prevQuestionId, setPrevQuestionId] = useState(currentInputQuestionId);

  // Auto-follow: reset manual override when host opens a new question
  if (prevQuestionId !== currentInputQuestionId) {
    setPrevQuestionId(currentInputQuestionId);
    if (manualQId !== null) setManualQId(null);
  }

  // Manual pick takes precedence; otherwise follow current
  const viewingQId = manualQId || currentInputQuestionId;

  const handleOpenBuzzer = () => {
    setAwarded(false);
    onOpenBuzzer(allowedUserIds || null);
  };

  const handleSelectWinner = (buzz) => {
    setAwarded(true);
    onAnnounceBuzzResult(buzz.userId, buzz.displayName);
  };

  const handleOpenInput = () => {
    if (onOpenInput) onOpenInput(allowedUserIds || null);
  };

  const handleExportCSV = () => {
    exportResponsesCSV(allResponses, questionLabels, inputQuestionOrder);
  };

  if (isCreating || !roomCode) return null;

  const isInputMode = interactionMode === 'input';
  const hasBuzzes = buzzes.length > 0;
  const effectiveQId = viewingQId || currentInputQuestionId;
  const viewedResponses = effectiveQId ? (allResponses[effectiveQId] || []) : [];
  const totalResponseCount = Object.values(allResponses).reduce((sum, arr) => sum + arr.length, 0);
  const isViewedRevealed = effectiveQId ? inputRevealed[effectiveQId] : false;
  const hasMultipleQuestions = inputQuestionOrder.length > 1;

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
                      {viewedResponses.length} of {participants.length} responded
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

              {/* Question tabs for browsing across questions */}
              {hasMultipleQuestions && (
                <div className="buzzer-fab__section">
                  <div className="buzzer-fab__question-tabs">
                    {inputQuestionOrder.map((qId, i) => {
                      const count = (allResponses[qId] || []).length;
                      return (
                        <button
                          key={qId}
                          className={`buzzer-fab__question-tab ${effectiveQId === qId ? 'buzzer-fab__question-tab--active' : ''}`}
                          onClick={() => setManualQId(qId)}
                          title={questionLabels[qId] || `Question ${i + 1}`}
                        >
                          Q{i + 1}
                          {count > 0 && <span className="buzzer-fab__question-tab-count">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Response list for viewed question */}
              {viewedResponses.length > 0 && (
                <div className="buzzer-fab__section">
                  <div className="buzzer-fab__section-label">
                    Responses — Q{inputQuestionOrder.indexOf(effectiveQId) + 1} ({viewedResponses.length})
                  </div>

                  {!isViewedRevealed && (
                    <button
                      className="buzzer-fab__reveal-btn"
                      onClick={() => onRevealResponses(effectiveQId)}
                    >
                      Reveal All
                    </button>
                  )}

                  <div className="buzzer-fab__response-list">
                    {viewedResponses.map((r) => (
                      <div key={r.userId} className="buzzer-fab__response-card">
                        <span className="buzzer-fab__response-name">{r.displayName}</span>
                        {isViewedRevealed ? (
                          <span className="buzzer-fab__response-text">{r.text}</span>
                        ) : (
                          <span className="buzzer-fab__response-hidden">Answer hidden</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export + Reset */}
              {totalResponseCount > 0 && (
                <div className="buzzer-fab__section buzzer-fab__actions-row">
                  <button className="buzzer-fab__export-btn" onClick={handleExportCSV} title="Download all responses as CSV">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Export CSV
                  </button>
                  <button className="buzzer-fab__reset-btn" onClick={onResetInput}>
                    Reset All
                  </button>
                </div>
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
