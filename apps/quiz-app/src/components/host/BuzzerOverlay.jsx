import { useState, useEffect } from 'react';
import ResponsesModal from './ResponsesModal';
import { getHostHint } from '@/utils/hostHintText';
import '@/styles/BuzzerOverlay.css';

/**
 * BuzzerOverlay — floating buzzer/input controls (bottom-right).
 *
 * Compact FAB that expands to reveal:
 * - Dual action buttons: Open Buzzer / Collect Answers (no mode toggle)
 * - Buzz results + award
 * - Response count + "View Responses" (opens modal)
 * - Connected participants
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
  hasSelectedQuestion = false,
  onOpenInput,
  onLockInput,
  onRevealResponses,
  onResetInput,
  // Auto-timer flow props
  autoShowResponses = false,
  onAutoShowResponsesHandled,
  // Navigation
  onGoToGrid,
}) {
  const [expanded, setExpanded] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [showHints, setShowHints] = useState(() => {
    try { return localStorage.getItem('qwizzeria_host_hints') !== 'false'; }
    catch { /* ignore */ return true; }
  });
  const [guideOpen, setGuideOpen] = useState(false);

  // Auto-expand panel and open responses modal when timer expires and collection is locked
  useEffect(() => {
    if (autoShowResponses) {
      setExpanded(true);
      setShowResponsesModal(true);
      onAutoShowResponsesHandled?.();
    }
  }, [autoShowResponses, onAutoShowResponsesHandled]);

  if (isCreating || !roomCode) return null;

  const isInputMode = interactionMode === 'input';
  const hasBuzzes = buzzes.length > 0;
  const currentResponses = currentInputQuestionId ? (allResponses[currentInputQuestionId] || []) : [];
  const totalResponseCount = Object.values(allResponses).reduce((sum, arr) => sum + arr.length, 0);

  // FAB label — action-oriented
  let statusLabel;
  let statusClass = '';
  if (isOpen && isInputMode) {
    statusLabel = 'COLLECTING...';
    statusClass = 'buzzer-fab--input-active';
  } else if (isOpen && !isInputMode) {
    statusLabel = 'BUZZER OPEN';
    statusClass = 'buzzer-fab--active';
  } else if (totalResponseCount > 0) {
    statusLabel = `RESPONSES (${totalResponseCount})`;
    statusClass = 'buzzer-fab--input-active';
  } else if (hasBuzzes) {
    statusLabel = 'RESULTS';
    statusClass = 'buzzer-fab--results';
  } else {
    statusLabel = 'READY';
    statusClass = '';
  }

  return (
    <div className="buzzer-fab-container">
      {/* Responses modal */}
      {showResponsesModal && (
        <ResponsesModal
          allResponses={allResponses}
          participants={participants}
          questionLabels={questionLabels}
          inputQuestionOrder={inputQuestionOrder}
          inputRevealed={inputRevealed}
          onRevealResponses={onRevealResponses}
          onResetInput={() => { onResetInput(); setShowResponsesModal(false); }}
          onClose={() => setShowResponsesModal(false)}
          onGoToGrid={() => { setShowResponsesModal(false); onGoToGrid?.(); }}
        />
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="buzzer-fab__panel">
          {/* Contextual hint line */}
          {showHints && (
            <div className="buzzer-fab__hint">
              <span className="buzzer-fab__hint-text">
                {getHostHint({ isOpen, isInputMode, hasBuzzes, totalResponseCount, hasSelectedQuestion, awarded })}
              </span>
              <button
                className="buzzer-fab__hint-dismiss"
                onClick={() => {
                  setShowHints(false);
                  try { localStorage.setItem('qwizzeria_host_hints', 'false'); } catch { /* ignore */ }
                }}
                title="Dismiss hints"
                aria-label="Dismiss hints"
              >
                ×
              </button>
            </div>
          )}

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

          {/* ─── Input Active: Stop Collection ─── */}
          {isOpen && isInputMode && (
            <div className="buzzer-fab__section">
              <div className="buzzer-fab__live-row">
                <span className="buzzer-fab__input-badge">COLLECTING</span>
                <span className="buzzer-fab__live-count">
                  {currentResponses.length} of {participants.length} responded
                </span>
              </div>
              <button
                className="buzzer-fab__stop-collection-btn"
                onClick={() => { onLockInput(); }}
              >
                Stop Collection
              </button>
            </div>
          )}

          {/* ─── Buzzer Active: Live row ─── */}
          {isOpen && !isInputMode && (
            <div className="buzzer-fab__section">
              <div className="buzzer-fab__live-row">
                <span className="buzzer-fab__live-badge">BUZZER OPEN</span>
                <span className="buzzer-fab__live-count">
                  {buzzes.length} buzz{buzzes.length !== 1 ? 'es' : ''}
                </span>
                <button className="buzzer-fab__lock-btn" onClick={onLockBuzzer}>
                  Lock
                </button>
              </div>
            </div>
          )}

          {/* ─── Buzzer Results (not open) ─── */}
          {!isOpen && buzzResult?.isTied && (
            <div className="buzzer-fab__tie-notice">
              TIE — Host decides who gets the point
            </div>
          )}

          {!isOpen && hasBuzzes && (
            <div className="buzzer-fab__section">
              <div className="buzzer-fab__buzz-list">
                {buzzes.map((b) => (
                  <div key={b.userId} className={`buzzer-fab__buzz-row ${b.isTied ? 'buzzer-fab__buzz-row--tied' : ''}`}>
                    <span className="buzzer-fab__buzz-rank">
                      #{b.rank || 1}{b.isTied ? ' \u2248' : ''}
                    </span>
                    <span className="buzzer-fab__buzz-name">{b.displayName}</span>
                    <span className="buzzer-fab__buzz-time">{b.buzzOffset}ms</span>
                    <button
                      className="buzzer-fab__award-btn"
                      onClick={() => { setAwarded(true); onAnnounceBuzzResult(b.userId, b.displayName); }}
                      title={`Award to ${b.displayName}`}
                    >
                      Award
                    </button>
                  </div>
                ))}
              </div>
              {!awarded && (
                <button className="buzzer-fab__reset-btn" onClick={() => { setAwarded(false); onResetBuzzer(); }}>
                  Reset Buzzer
                </button>
              )}
              {/* Collect Answers available even after buzz results */}
              <button
                className="buzzer-fab__open-input-btn"
                onClick={() => onOpenInput(allowedUserIds || null)}
                disabled={!hasSelectedQuestion}
                title={hasSelectedQuestion ? 'Collect text answers for this question' : 'Select a question from the grid first'}
              >
                {hasSelectedQuestion ? 'Collect Answers' : 'Select a question first'}
              </button>
            </div>
          )}

          {/* ─── Idle State: Mode Selector ─── */}
          {!isOpen && !hasBuzzes && (
            <div className="buzzer-fab__section">
              {/* Participant readiness */}
              <div className="buzzer-fab__readiness">
                {participants.length === 0 ? (
                  <div className="buzzer-fab__readiness-warning">
                    No participants connected yet
                  </div>
                ) : (
                  <div className="buzzer-fab__readiness-count">
                    {participants.length} participant{participants.length !== 1 ? 's' : ''} connected
                  </div>
                )}
              </div>

              {!hasSelectedQuestion ? (
                <div className="buzzer-fab__mode-disabled">
                  Select a question from the grid first
                </div>
              ) : (
                <div className="buzzer-fab__mode-selector">
                  <button
                    className="buzzer-fab__mode-card buzzer-fab__mode-card--buzzer"
                    onClick={() => { setAwarded(false); onOpenBuzzer(allowedUserIds || null); }}
                  >
                    <svg className="buzzer-fab__mode-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zM9 20v1c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9z"/>
                    </svg>
                    <span className="buzzer-fab__mode-title">Buzzer</span>
                    <span className="buzzer-fab__mode-desc">Speed-based — first to buzz wins</span>
                  </button>
                  <button
                    className="buzzer-fab__mode-card buzzer-fab__mode-card--input"
                    onClick={() => onOpenInput(allowedUserIds || null)}
                  >
                    <svg className="buzzer-fab__mode-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    <span className="buzzer-fab__mode-title">Collect Answers</span>
                    <span className="buzzer-fab__mode-desc">Text input — everyone types an answer</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── Re-open buzzer after award ─── */}
          {!isOpen && awarded && hasBuzzes && (
            <div className="buzzer-fab__section">
              <button className="buzzer-fab__open-btn" onClick={() => { setAwarded(false); onOpenBuzzer(allowedUserIds || null); }}>
                Re Open
              </button>
            </div>
          )}

          {/* ─── Submitted Names + Response Actions (when responses exist and not actively collecting) ─── */}
          {!isOpen && totalResponseCount > 0 && (
            <div className="buzzer-fab__section">
              {/* Names-only submitted list */}
              {currentResponses.length > 0 && (
                <>
                  <div className="buzzer-fab__section-label">
                    Submitted ({currentResponses.length} of {participants.length})
                  </div>
                  <div className="buzzer-fab__participant-list">
                    {participants.map(p => {
                      const hasResponded = currentResponses.some(r => r.userId === p.userId);
                      return (
                        <span
                          key={p.userId}
                          className={`buzzer-fab__participant-chip ${hasResponded ? 'buzzer-fab__participant-chip--submitted' : 'buzzer-fab__participant-chip--pending'}`}
                        >
                          {p.displayName}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
              <button
                className="buzzer-fab__view-responses-btn"
                onClick={() => setShowResponsesModal(true)}
              >
                View Responses ({totalResponseCount})
              </button>
            </div>
          )}

          {/* ─── Quick Guide (collapsible) ─── */}
          <div
            className="buzzer-fab__guide-toggle"
            onClick={() => setGuideOpen(g => !g)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setGuideOpen(g => !g); } }}
          >
            <span className="buzzer-fab__guide-chevron">{guideOpen ? '▾' : '▸'}</span>
            Quick Guide
          </div>
          {guideOpen && (
            <div className="buzzer-fab__guide-content">
              <div className="buzzer-fab__guide-flow">Buzzer Flow</div>
              {[
                'Select question from grid',
                'Choose "Buzzer" from the mode selector',
                'Players buzz → results ranked',
                'Click "Award" next to winner',
                'Select next question (auto-resets)',
              ].map((step, i) => (
                <div key={i} className="buzzer-fab__guide-step">
                  <span className="buzzer-fab__guide-step-num">{i + 1}</span>
                  <span>{step}</span>
                </div>
              ))}

              <div className="buzzer-fab__guide-flow">Collect Answers Flow</div>
              {[
                'Select question from grid',
                'Choose "Collect Answers" (timer auto-starts)',
                'Timer expires → auto-locks & opens responses',
                'Reveal answers, then "Go to Grid" to continue',
                'Participants see live countdown on their device',
              ].map((step, i) => (
                <div key={i} className="buzzer-fab__guide-step">
                  <span className="buzzer-fab__guide-step-num">{i + 1}</span>
                  <span>{step}</span>
                </div>
              ))}

              <label className="buzzer-fab__guide-hint-toggle">
                <input
                  type="checkbox"
                  checked={showHints}
                  onChange={e => {
                    setShowHints(e.target.checked);
                    try { localStorage.setItem('qwizzeria_host_hints', e.target.checked ? 'true' : 'false'); } catch { /* ignore */ }
                  }}
                />
                Show step hints
              </label>
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
          {isInputMode && isOpen ? (
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
        <span className="buzzer-fab__text">{statusLabel}</span>
        {(isOpen && !isInputMode) && <span className="buzzer-fab__pulse" />}
        {(isOpen && isInputMode) && <span className="buzzer-fab__pulse buzzer-fab__pulse--input" />}
      </button>
    </div>
  );
}
