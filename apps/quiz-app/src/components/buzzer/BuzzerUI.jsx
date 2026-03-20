import SEO from '../SEO';

export function BuzzerHeader({ roomCode, displayName, connectionStatus }) {
  return (
    <div className="buzzer-page__header">
      <h1 className="sr-only">Buzzer Room {roomCode}</h1>
      <img
        src="/qwizzeria-logo.png"
        alt="Qwizzeria"
        className="buzzer-page__logo"
        onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
      />
      <div className="buzzer-page__room-info">
        <div className="buzzer-page__room-code-row">
          <span
            className={`buzzer-page__status-dot buzzer-page__status-dot--${connectionStatus}`}
            title={connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'disconnected' ? 'Disconnected' : 'Connecting...'}
          />
          <span className="buzzer-page__room-code">{roomCode}</span>
        </div>
        <span className="buzzer-page__player-name">{displayName}</span>
      </div>
    </div>
  );
}

export function BuzzerLoading({ roomCode }) {
  return (
    <div className="buzzer-page">
      <SEO title="Buzzer" path={`/buzz/${roomCode}`} noIndex />
      <div className="buzzer-page__center">
        <div className="buzzer-page__spinner" />
        <p className="buzzer-page__status-text">Joining room {roomCode}...</p>
      </div>
    </div>
  );
}

export function BuzzerError({ roomCode, errorInfo, onRetry, onBack }) {
  const info = errorInfo || { title: 'Something went wrong', detail: 'Please try again.', canRetry: true };
  return (
    <div className="buzzer-page">
      <SEO title="Buzzer" path={`/buzz/${roomCode}`} noIndex />
      <div className="buzzer-page__center">
        <h2 className="buzzer-page__title">{info.title}</h2>
        <p className="buzzer-page__error-text">{info.detail}</p>
        <div className="buzzer-page__error-actions">
          {info.canRetry && (
            <button className="buzzer-page__btn buzzer-page__btn--retry" onClick={onRetry}>
              Try Again
            </button>
          )}
          <button className="buzzer-page__btn buzzer-page__btn--back" onClick={onBack}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export function BuzzerClosed({ roomCode, onBack }) {
  return (
    <div className="buzzer-page">
      <SEO title="Buzzer" path={`/buzz/${roomCode}`} noIndex />
      <div className="buzzer-page__center">
        <div className="buzzer-page__closed-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="buzzer-page__title">Room Closed</h2>
        <p className="buzzer-page__status-text">The host has ended this session. You can close this tab.</p>
        <button className="buzzer-page__btn buzzer-page__btn--back" onClick={onBack}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export function BuzzerWaiting() {
  return (
    <div className="buzzer-page__center">
      <div className="buzzer-btn buzzer-btn--waiting" aria-disabled="true">
        <span className="buzzer-btn__label">WAITING</span>
      </div>
      <p className="buzzer-page__status-text">Waiting for the host to open the buzzer...</p>
    </div>
  );
}

export function BuzzerReady({ onBuzz }) {
  return (
    <div className="buzzer-page__center">
      <button className="buzzer-btn buzzer-btn--ready" onClick={onBuzz} aria-label="Press buzzer">
        <span className="buzzer-btn__label">BUZZ!</span>
      </button>
      <p className="buzzer-page__status-text">Tap to buzz in!</p>
    </div>
  );
}

export function BuzzerBuzzed() {
  return (
    <div className="buzzer-page__center">
      <div className="buzzer-btn buzzer-btn--buzzed">
        <span className="buzzer-btn__label">BUZZED!</span>
      </div>
      <p className="buzzer-page__status-text">Waiting for results...</p>
    </div>
  );
}

export function BuzzerSpectating() {
  return (
    <div className="buzzer-page__center">
      <div className="buzzer-btn buzzer-btn--spectating" aria-disabled="true">
        <span className="buzzer-btn__label">SPECTATING</span>
      </div>
      <p className="buzzer-page__status-text">Watching this round — your match is coming up!</p>
    </div>
  );
}

export function BuzzerResult({ buzzResult, userId }) {
  const isWinner = buzzResult?.winnerId === userId;
  return (
    <div className="buzzer-page__center">
      <div className={`buzzer-btn ${isWinner ? 'buzzer-btn--won' : 'buzzer-btn--lost'}`}>
        <span className="buzzer-btn__label">
          {isWinner ? 'FIRST!' : buzzResult.winnerName || 'Too slow!'}
        </span>
      </div>
      <p className="buzzer-page__status-text">
        {isWinner ? 'You buzzed first!' : `${buzzResult.winnerName} buzzed first`}
      </p>
      {buzzResult.buzzes && buzzResult.buzzes.length > 0 && (
        <div className="buzzer-page__results-list">
          {buzzResult.buzzes.map((b, i) => (
            <div
              key={b.userId}
              className={`buzzer-page__result-row ${b.userId === userId ? 'buzzer-page__result-row--self' : ''}`}
            >
              <span className="buzzer-page__result-rank">#{i + 1}</span>
              <span className="buzzer-page__result-name">{b.displayName}</span>
              <span className="buzzer-page__result-time">{b.buzzOffset}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BuzzerScoreOverlay({ scoreOverlay, displayName, onDismiss }) {
  return (
    <div
      className="buzzer-page__score-overlay"
      onClick={onDismiss}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onDismiss(); }}
    >
      <div className="buzzer-page__score-overlay-content">
        <h3 className="buzzer-page__score-overlay-title">Leaderboard</h3>
        {scoreOverlay.map((entry, i) => (
          <div
            key={i}
            className={`buzzer-page__score-row ${entry.name === displayName ? 'buzzer-page__score-row--self' : ''}`}
          >
            <span className="buzzer-page__score-rank">#{entry.rank}</span>
            <span className="buzzer-page__score-name">{entry.name}</span>
            <span className="buzzer-page__score-pts">{entry.score} pts</span>
          </div>
        ))}
        <p className="buzzer-page__score-dismiss">Tap to dismiss</p>
      </div>
    </div>
  );
}

export function BuzzerInputArea({
  currentQuestionText,
  viewingQuestionId,
  currentQuestionId,
  questionHistory,
  timerLeft,
  inputText,
  setInputText,
  inputLocked,
  savedFlash,
  myResponses,
  onViewQuestion,
  onSubmit,
}) {
  const isViewingCurrent = viewingQuestionId === currentQuestionId;
  const hasExistingAnswer = viewingQuestionId && myResponses[viewingQuestionId];

  return (
    <div className="buzzer-page__center">
      {currentQuestionText && isViewingCurrent && (
        <div className="buzzer-page__question-header">{currentQuestionText}</div>
      )}
      {!isViewingCurrent && viewingQuestionId && (
        <div className="buzzer-page__question-header buzzer-page__question-header--past">
          {questionHistory.find(q => q.id === viewingQuestionId)?.text || 'Previous question'}
        </div>
      )}

      {questionHistory.length > 1 && (
        <div className="buzzer-page__question-tabs">
          {questionHistory.map((q, i) => (
            <button
              key={q.id}
              className={`buzzer-page__question-tab ${viewingQuestionId === q.id ? 'buzzer-page__question-tab--active' : ''} ${myResponses[q.id] ? 'buzzer-page__question-tab--answered' : ''}`}
              onClick={() => onViewQuestion(q.id)}
            >
              Q{i + 1}
              {myResponses[q.id] && ' \u2713'}
            </button>
          ))}
        </div>
      )}

      {timerLeft !== null && (
        <div className={`buzzer-page__timer ${timerLeft <= 10 ? 'buzzer-page__timer--critical' : timerLeft <= 30 ? 'buzzer-page__timer--warning' : 'buzzer-page__timer--running'}`}>
          {String(Math.floor(timerLeft / 60)).padStart(2, '0')}:{String(timerLeft % 60).padStart(2, '0')}
        </div>
      )}

      <textarea
        className="buzzer-page__input-field"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={inputLocked ? 'Answers locked' : 'Type your answer...'}
        maxLength={500}
        rows={4}
        disabled={inputLocked}
        autoFocus
      />

      <div className="buzzer-page__input-meta">
        <span>{inputText.length}/500</span>
      </div>

      <button
        className={`buzzer-page__btn ${hasExistingAnswer ? 'buzzer-btn--update' : 'buzzer-btn--submit'}`}
        onClick={onSubmit}
        disabled={inputLocked || !inputText.trim()}
      >
        {hasExistingAnswer ? 'UPDATE' : 'SUBMIT'}
      </button>

      <p className="buzzer-page__status-text">
        {savedFlash && <span className="buzzer-page__saved-flash">Answer saved!</span>}
        {!savedFlash && inputLocked && 'Answers locked — waiting for host...'}
        {!savedFlash && !inputLocked && !hasExistingAnswer && 'Type your answer'}
        {!savedFlash && !inputLocked && hasExistingAnswer && 'You can update your answer'}
      </p>
    </div>
  );
}
