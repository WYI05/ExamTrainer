import { useEffect, useRef, useState } from 'react';

/** Countdown in seconds. Calls onEnd once when it reaches zero. */
export function useCountdown(totalSeconds: number, running: boolean, onEnd?: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  const firedRef = useRef(false);

  useEffect(() => {
    setRemaining(totalSeconds);
    firedRef.current = false;
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const base = remaining;
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const next = Math.max(0, base - elapsed);
      setRemaining(next);
      if (next === 0 && !firedRef.current) {
        firedRef.current = true;
        endRef.current?.();
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return remaining;
}

/** Elapsed milliseconds since mount (or since `resetKey` changed). */
export function useStopwatch(resetKey: unknown) {
  const startRef = useRef(Date.now());
  useEffect(() => {
    startRef.current = Date.now();
  }, [resetKey]);
  return () => Date.now() - startRef.current;
}
