import { useState } from 'react';
import '../../styles/ResponsesModal.css';

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
 * ResponsesModal — full-screen overlay showing all participant responses
 * grouped by question, with per-question reveal and CSV export.
 */
export default function ResponsesModal({
  allResponses,
  questionLabels,
  inputQuestionOrder,
  inputRevealed,
  onRevealResponses,
  onResetInput,
  onClose,
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const totalResponseCount = Object.values(allResponses).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="responses-modal" onClick={onClose}>
      <div className="responses-modal__content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="responses-modal__header">
          <h2 className="responses-modal__title">Responses</h2>
          <div className="responses-modal__header-actions">
            {totalResponseCount > 0 && (() => {
              const hasUnrevealed = inputQuestionOrder.some(
                qId => (allResponses[qId] || []).length > 0 && !inputRevealed[qId]
              );
              return (
                <>
                  {hasUnrevealed && (
                    <button
                      className="responses-modal__reveal-all-btn"
                      onClick={() => {
                        inputQuestionOrder.forEach(qId => {
                          if ((allResponses[qId]?.length > 0) && !inputRevealed[qId]) {
                            onRevealResponses(qId);
                          }
                        });
                      }}
                    >
                      Reveal All
                    </button>
                  )}
                  <button
                    className="responses-modal__export-btn"
                    onClick={() => exportResponsesCSV(allResponses, questionLabels, inputQuestionOrder)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Export CSV
                  </button>
                </>
              );
            })()}
            <button className="responses-modal__close-btn" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Question list */}
        <div className="responses-modal__body">
          {inputQuestionOrder.length === 0 && (
            <p className="responses-modal__empty">No questions opened yet.</p>
          )}

          {inputQuestionOrder.map((qId, idx) => {
            const responses = allResponses[qId] || [];
            const isRevealed = inputRevealed[qId];
            const questionText = questionLabels[qId] || '';

            return (
              <div key={qId} className="responses-modal__question">
                <div className="responses-modal__question-header">
                  <span className="responses-modal__question-number">Q{idx + 1}</span>
                  <span className="responses-modal__question-text">
                    {questionText || 'Untitled question'}
                  </span>
                  <span className="responses-modal__question-count">
                    {responses.length} response{responses.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {responses.length === 0 && (
                  <p className="responses-modal__no-responses">No responses yet</p>
                )}

                {responses.length > 0 && !isRevealed && (
                  <div className="responses-modal__hidden-state">
                    <div className="responses-modal__hidden-cards">
                      {responses.map((r) => (
                        <div key={r.userId} className="responses-modal__card responses-modal__card--hidden">
                          <span className="responses-modal__card-name">{r.displayName}</span>
                          <span className="responses-modal__card-text-hidden">Answer hidden</span>
                        </div>
                      ))}
                    </div>
                    <button
                      className="responses-modal__reveal-btn"
                      onClick={() => onRevealResponses(qId)}
                    >
                      Reveal Answers
                    </button>
                  </div>
                )}

                {responses.length > 0 && isRevealed && (
                  <div className="responses-modal__cards">
                    {responses.map((r) => (
                      <div key={r.userId} className="responses-modal__card">
                        <span className="responses-modal__card-name">{r.displayName}</span>
                        <span className="responses-modal__card-text">{r.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="responses-modal__footer">
          <button className="responses-modal__next-question-btn" onClick={onClose}>
            Select Next Question
          </button>

          {totalResponseCount > 0 && (
            <>
              <div className="responses-modal__footer-divider" />
              <button
                className="responses-modal__clear-all-btn"
                onClick={() => {
                  if (confirmClear) {
                    onResetInput();
                    setConfirmClear(false);
                  } else {
                    setConfirmClear(true);
                    setTimeout(() => setConfirmClear(false), 3000);
                  }
                }}
              >
                {confirmClear ? 'Confirm Clear?' : 'Clear All Responses'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
