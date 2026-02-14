import { useState, useEffect, useRef } from 'react';
import '../styles/TimerControl.css';

export default function TimerControl() {
  const [minutes, setMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(300); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const audioContextRef = useRef(null);

  // Update timeLeft when minutes input changes (only when not running)
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(minutes * 60);
    }
  }, [minutes, isRunning]);

  // Countdown logic
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsRunning(false);
          playAlarmSound();
        }
        return Math.max(0, newTime);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  function playAlarmSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create three beeps for alarm
      for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // 800Hz beep
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.4);

        oscillator.start(audioContext.currentTime + i * 0.4);
        oscillator.stop(audioContext.currentTime + i * 0.4 + 0.2);
      }
    } catch (error) {
      console.warn('Failed to play alarm sound:', error);
    }
  }

  function handleStartPause() {
    setIsRunning(prev => !prev);
  }

  function handleReset() {
    setIsRunning(false);
    setTimeLeft(minutes * 60);
  }

  function handleMinutesChange(e) {
    const value = parseInt(e.target.value) || 0;
    setMinutes(Math.max(0, Math.min(99, value))); // Limit 0-99 minutes
  }

  // Format time as MM:SS
  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = timeLeft % 60;
  const timeDisplay = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

  // Determine color state
  const getColorClass = () => {
    if (timeLeft === 0) return 'timer--expired';
    if (timeLeft <= 10) return 'timer--critical';
    if (timeLeft <= 30) return 'timer--warning';
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
          disabled={isRunning}
          min="0"
          max="99"
        />
        <span className="timer__label">min</span>
      </div>

      <div className={`timer__display ${timeLeft === 0 ? 'timer__display--pulse' : ''}`}>
        {timeDisplay}
      </div>

      <div className="timer__controls">
        <button
          className="timer__btn timer__btn--primary"
          onClick={handleStartPause}
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? (
            // Pause icon
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            // Play icon
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
          {/* Reset icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
