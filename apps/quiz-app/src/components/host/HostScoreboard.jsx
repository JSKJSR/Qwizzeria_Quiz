import { useState, useRef, useEffect } from 'react';
import '../../styles/HostScoreboard.css';
import TimerControl from './TimerControl';

const ADJUST_OPTIONS = [
  { label: '-5', delta: -5 },
  { label: '-1', delta: -1 },
  { label: '+1', delta: 1 },
  { label: '+5', delta: 5 },
  { label: '+10', delta: 10 },
];

export default function HostScoreboard({ participants, onEndQuiz, onAdjustScore, showEndQuiz, endButtonLabel = 'END QUIZ', matchLabel }) {
  const maxScore = Math.max(...participants.map(p => p.score), 0);
  const hasScores = maxScore > 0;
  const [openPopover, setOpenPopover] = useState(null);
  const popoverRef = useRef(null);

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

  const handleAdjust = (idx, delta) => {
    onAdjustScore(idx, delta);
    setOpenPopover(null);
  };

  return (
    <div className="scoreboard">
      <img
        src="/qwizzeria-logo.png"
        alt="Qwizzeria"
        className="scoreboard__logo"
        onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
      />
      <TimerControl />
      {matchLabel && (
        <div className="scoreboard__match-label">{matchLabel}</div>
      )}
      <div className="scoreboard__teams">
        {participants.map((p, i) => (
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
        ))}
      </div>
      {showEndQuiz && (
        <button className="scoreboard__end-btn" onClick={onEndQuiz}>
          {endButtonLabel}
        </button>
      )}
    </div>
  );
}
