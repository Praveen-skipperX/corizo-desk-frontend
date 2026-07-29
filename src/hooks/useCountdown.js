import { useState, useEffect, useCallback } from 'react';

export function useCountdown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);

  const start = useCallback((duration) => {
    setSeconds(Math.max(0, duration));
  }, []);

  const reset = useCallback(() => setSeconds(0), []);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  return { seconds, start, reset, isActive: seconds > 0 };
}

export function formatCountdown(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
