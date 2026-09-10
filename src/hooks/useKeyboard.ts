import { useEffect } from 'react';

/**
 * Global key handler. Ignores events from inputs so typing numbers into the
 * numeric answer box never triggers a choice.
 */
export function useKeyboard(handler: (key: string, e: KeyboardEvent) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      handler(e.key, e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler, enabled]);
}

/** Maps 1-4 / A-D to a choice index, Enter to continue. */
export function choiceIndexFromKey(key: string): number | null {
  const k = key.toLowerCase();
  if (['1', '2', '3', '4'].includes(k)) return Number(k) - 1;
  if (['a', 'b', 'c', 'd'].includes(k)) return k.charCodeAt(0) - 97;
  return null;
}
