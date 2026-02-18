import { useState, useEffect, useRef, useCallback } from 'react';
import '../../styles/TimerControl.css';

export default function TimerControl({ initialMinutes = 0, initialSeconds = 30, onExpire, autoStart = false }) {
  const totalInitialMs = (initialMinutes * 60 + initialSeconds) * 1000;
  const [remainingMs, setRemainingMs] = useState(totalInitialMs);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const remainingAtStartRef = useRef(totalInitialMs);
  const expiredRef = useRef(false);

  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const displayMin = Math.floor(totalSeconds / 60);
  const displaySec = totalSeconds % 60;

  // Determine visual state
  let timerClass = 'timer';
  if (totalSeconds <= 0) {
    timerClass += ' timer--expired';
  } else if (totalSeconds <= 10) {
    timerClass += ' timer--critical';
  } else if (totalSeconds <= 30) {
    timerClass += ' timer--warning';
  }

  const playBeeps = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const beep = (delay) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.3;
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.15);
      };
      beep(0);
      beep(0.25);
      beep(0.5);
    } catch {
      // Audio not supported
    }
  }, []);

  useEffect(() => {
    if (!running || remainingMs <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();
    remainingAtStartRef.current = remainingMs;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newRemaining = Math.max(0, remainingAtStartRef.current - elapsed);
      setRemainingMs(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRunning(false);
        if (!expiredRef.current) {
          expiredRef.current = true;
          playBeeps();
          onExpire?.();
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, remainingMs, onExpire, playBeeps]);

  const handleToggle = useCallback(() => {
    if (remainingMs <= 0) return;
    setRunning(prev => !prev);
  }, [remainingMs]);

  const handleReset = useCallback(() => {
    setRunning(false);
    setRemainingMs(totalInitialMs);
    expiredRef.current = false;
  }, [totalInitialMs]);

  return (
    <div className={timerClass}>
      <div className="timer__display">
        {String(displayMin).padStart(2, '0')}:{String(displaySec).padStart(2, '0')}
      </div>
      <div className="timer__controls">
        <button
          className="timer__btn timer__btn--toggle"
          onClick={handleToggle}
          disabled={remainingMs <= 0}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button className="timer__btn timer__btn--reset" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
