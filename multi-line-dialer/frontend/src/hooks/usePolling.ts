import { useEffect, useRef } from 'react';

export function usePolling(fn: () => Promise<void>, intervalMs: number, active: boolean) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!active) return;
    fnRef.current(); // immediate first call — no blank window after session starts
    const id = setInterval(() => fnRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
}
