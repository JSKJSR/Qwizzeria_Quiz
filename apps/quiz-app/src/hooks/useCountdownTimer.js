import { useState, useRef, useEffect } from 'react';

/**
 * Hook for a countdown timer that computes remaining time from a start timestamp.
 * @param {number} durationMinutes - Total duration in minutes
 * @param {string|null} startedAt - ISO timestamp when timer started
 * @param {function} onExpired - Called once when timer reaches 0
 * @returns {{ timeLeft: number, timerDisplay: string, timerClass: string }}
 */
export default function useCountdownTimer(durationMinutes, startedAt, onExpired) {
  const intervalRef = useRef(null);
  const expiredRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState(() => {
    if (!startedAt) return durationMinutes * 60;
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, durationMinutes * 60 - elapsed);
  });

  useEffect(() => {
    if (!startedAt) return;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const remaining = Math.max(0, durationMinutes * 60 - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(intervalRef.current);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [startedAt, durationMinutes, onExpired]);

  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = timeLeft % 60;
  const timerDisplay = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

  let timerClass = '';
  if (timeLeft <= 0) timerClass = 'doubles-timer--expired';
  else if (timeLeft <= 60) timerClass = 'doubles-timer--critical';
  else if (timeLeft <= 300) timerClass = 'doubles-timer--warning';

  return { timeLeft, timerDisplay, timerClass };
}
