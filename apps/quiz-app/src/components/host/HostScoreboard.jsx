import { useState, useEffect, useRef, useCallback } from 'react';
import '@/styles/HostScoreboard.css';
import TimerControl from './TimerControl';
import BuzzerQRCode from './BuzzerQRCode';
import { useTheme } from '@/hooks/useTheme';

const ADJUST_OPTIONS = [
  { label: '-5', delta: -5 },
  { label: '-1', delta: -1 },
  { label: '+1', delta: 1 },
  { label: '+5', delta: 5 },
  { label: '+10', delta: 10 },
];

const INLINE_THRESHOLD = 4; // Show inline cards for up to 4 participants

export default function HostScoreboard({
  participants,
  onEndQuiz,
  onAdjustScore,
  showEndQuiz,
  endButtonLabel = 'END QUIZ',
  matchLabel,
  buzzerRoomCode,
  buzzerPlayerCount,
  onCopyBuzzerLink,
  buzzerCopied,
  timerRef,
  onTimerExpire,
  onTimerTick,
  onPublishScores,
}) {
  const maxScore = Math.max(...participants.map(p => p.score), 0);
  const hasScores = maxScore > 0;
  const [openPopover, setOpenPopover] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const lightMode = theme === 'light';
  const [published, setPublished] = useState(false);
  const popoverRef = useRef(null);

  const useDrawer = participants.length > INLINE_THRESHOLD;

  // Find leader for drawer summary
  const leader = hasScores
    ? participants.reduce((best, p) => (p.score > best.score ? p : best), participants[0])
    : null;

  useEffect(() => {
    if (openPopover === null) return;
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpenPopover(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPopover]);

  const handleAdjust = useCallback((idx, delta) => {
    onAdjustScore(idx, delta);
    setOpenPopover(null);
  }, [onAdjustScore]);

  const renderScoreCard = (p, i) => (
    <div
      key={i}
      className={`scoreboard__team ${hasScores && p.score === maxScore ? 'scoreboard__team--leader' : ''}`}
    >
      <div className="scoreboard__name">{p.name}</div>
      <div className="scoreboard__score">
        {String(p.score).padStart(3, '0')}
      </div>
      {onAdjustScore && (
        <div className="scoreboard__adjust-wrapper">
          <button
            className="scoreboard__adjust-btn"
            onClick={() => setOpenPopover(openPopover === i ? null : i)}
            title="Adjust score"
          >
            &plusmn;
          </button>
          {openPopover === i && (
            <div className="scoreboard__adjust-popover" ref={popoverRef}>
              {ADJUST_OPTIONS.map(opt => (
                <button
                  key={opt.delta}
                  className={`scoreboard__adjust-option ${opt.delta < 0 ? 'scoreboard__adjust-option--neg' : ''}`}
                  onClick={() => handleAdjust(i, opt.delta)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="scoreboard">
        {/* Left zone: Logo + Buzzer Room */}
        <div className="scoreboard__left">
          <img
            src="/qwizzeria-logo.png"
            alt="Qwizzeria"
            className="scoreboard__logo"
            onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
          />
          {buzzerRoomCode && (
            <div className="scoreboard__buzzer-section">
              <BuzzerQRCode roomCode={buzzerRoomCode} />
              <div className="scoreboard__buzzer-info">
                <span className="scoreboard__buzzer-label">BUZZER ROOM</span>
                <span className="scoreboard__buzzer-code">{buzzerRoomCode}</span>
                <span className="scoreboard__buzzer-count">
                  {buzzerPlayerCount || 0} player{buzzerPlayerCount !== 1 ? 's' : ''} connected
                </span>
                {onCopyBuzzerLink && (
                  <button className="scoreboard__buzzer-copy" onClick={onCopyBuzzerLink}>
                    {buzzerCopied ? 'Copied!' : 'Copy Link'}
                  </button>
                )}
              </div>
            </div>
          )}
          {matchLabel && (
            <div className="scoreboard__match-label">{matchLabel}</div>
          )}
        </div>

        {/* Center zone: Timer */}
        <div className="scoreboard__center">
          <TimerControl ref={timerRef} onExpire={onTimerExpire} onTick={onTimerTick} />
        </div>

        {/* Right zone: Scores + End button */}
        <div className="scoreboard__right">
          {!useDrawer ? (
            <div className="scoreboard__teams">
              {participants.map(renderScoreCard)}
            </div>
          ) : (
            <div className="scoreboard__drawer-trigger-area">
              {leader && (
                <div className="scoreboard__leader-summary">
                  <span className="scoreboard__leader-icon">&#9733;</span>
                  <span className="scoreboard__leader-name">{leader.name}</span>
                  <span className="scoreboard__leader-score">{leader.score}</span>
                </div>
              )}
              <button
                className={`scoreboard__drawer-btn ${drawerOpen ? 'scoreboard__drawer-btn--open' : ''}`}
                onClick={() => setDrawerOpen(o => !o)}
              >
                SCORES
                <span className="scoreboard__drawer-badge">{participants.length}</span>
                <span className="scoreboard__drawer-chevron">{drawerOpen ? '\u25B2' : '\u25BC'}</span>
              </button>
            </div>
          )}
          {onPublishScores && (
            <button
              className="scoreboard__publish-btn"
              onClick={() => {
                onPublishScores();
                setPublished(true);
                setTimeout(() => setPublished(false), 2000);
              }}
            >
              {published ? 'Published!' : 'Publish Scores'}
            </button>
          )}
          <button
            className="scoreboard__theme-btn"
            onClick={toggleTheme}
            aria-label={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {lightMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            )}
          </button>
          {showEndQuiz && (
            <button className="scoreboard__end-btn" onClick={onEndQuiz}>
              {endButtonLabel}
            </button>
          )}
        </div>
      </div>

      {/* Score drawer (5+ participants) */}
      {useDrawer && drawerOpen && (
        <div className="scoreboard__drawer">
          <div className="scoreboard__drawer-grid">
            {participants.map(renderScoreCard)}
          </div>
        </div>
      )}
    </>
  );
}
