import { useState, useRef, useEffect, useCallback } from 'react';
import '../../styles/HostScoreboard.css';
import TimerControl from './TimerControl';

function useHostTheme() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('host-light-theme', light);
    return () => document.documentElement.classList.remove('host-light-theme');
  }, [light]);
  return [light, setLight];
}

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
}) {
  const maxScore = Math.max(...participants.map(p => p.score), 0);
  const hasScores = maxScore > 0;
  const [openPopover, setOpenPopover] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lightMode, setLightMode] = useHostTheme();
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
          )}
          {matchLabel && (
            <div className="scoreboard__match-label">{matchLabel}</div>
          )}
        </div>

        {/* Center zone: Timer */}
        <div className="scoreboard__center">
          <TimerControl />
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
          <label className="scoreboard__theme-toggle">
            <span className="scoreboard__theme-label">Light Mode</span>
            <div className={`scoreboard__toggle ${lightMode ? 'scoreboard__toggle--on' : ''}`} onClick={() => setLightMode(l => !l)}>
              <div className="scoreboard__toggle-knob" />
            </div>
          </label>
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
