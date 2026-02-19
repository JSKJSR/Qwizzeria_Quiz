import { useState, useRef, useCallback } from 'react';
import '../../styles/TimerControl.css';

export default function TimerControl() {
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null); // null = use input values; number = countdown active/done
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);

  // Effective display time: countdown value if started, otherwise derived from inputs
  const displayTime = timeLeft !== null ? timeLeft : minutes * 60 + seconds;
  const displayMinutes = Math.floor(displayTime / 60);
  const displaySeconds = displayTime % 60;
  const timeDisplay = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

  const playAlarmSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.4);

        oscillator.start(audioContext.currentTime + i * 0.4);
        oscillator.stop(audioContext.currentTime + i * 0.4 + 0.2);
      }
    } catch (error) {
      console.warn('Failed to play alarm sound:', error);
    }
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  function handleStartPause() {
    if (isRunning) {
      // Pause
      stopInterval();
      setIsRunning(false);
    } else {
      // Start
      const startTime = timeLeft !== null ? timeLeft : minutes * 60 + seconds;
      if (startTime <= 0) return;

      setTimeLeft(startTime);
      setIsRunning(true);

      const startedAt = Date.now();
      const startValue = startTime;

      stopInterval();
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = Math.max(0, startValue - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          playAlarmSound();
        }
      }, 200);
    }
  }

  function handleReset() {
    stopInterval();
    setIsRunning(false);
    setTimeLeft(null); // Back to using input values
  }

  function handleMinutesChange(e) {
    const value = parseInt(e.target.value) || 0;
    setMinutes(Math.max(0, Math.min(99, value)));
  }

  function handleSecondsChange(e) {
    const value = parseInt(e.target.value) || 0;
    setSeconds(Math.max(0, Math.min(59, value)));
  }

  const getColorClass = () => {
    if (displayTime === 0 && timeLeft !== null) return 'timer--expired';
    if (isRunning && displayTime <= 10) return 'timer--critical';
    if (isRunning && displayTime <= 30) return 'timer--warning';
    if (isRunning) return 'timer--running';
    return '';
  };

  return (
    <div className={`timer ${getColorClass()}`}>
      <div className="timer__input-group">
        <input
          type="number"
          className="timer__input"
          value={minutes}
          onChange={handleMinutesChange}
          disabled={isRunning || timeLeft !== null}
          min="0"
          max="99"
        />
        <span className="timer__label">min</span>
      </div>

      <div className="timer__input-group">
        <input
          type="number"
          className="timer__input"
          value={seconds}
          onChange={handleSecondsChange}
          disabled={isRunning || timeLeft !== null}
          min="0"
          max="59"
        />
        <span className="timer__label">sec</span>
      </div>

      <div className={`timer__display ${displayTime === 0 && timeLeft !== null ? 'timer__display--pulse' : ''}`}>
        {timeDisplay}
      </div>

      <div className="timer__controls">
        <button
          className="timer__btn timer__btn--primary"
          onClick={handleStartPause}
          title={isRunning ? 'Pause' : 'Start'}
          disabled={displayTime === 0 && timeLeft !== null}
        >
          {isRunning ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          className="timer__btn timer__btn--secondary"
          onClick={handleReset}
          title="Reset"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
