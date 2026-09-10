import { Flame, Heart, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { masteryTier, tierColor } from '@/utils/mastery';
import { cx, ProgressBar } from './ui';

export function MasteryBadge({ value, showBar = true, size = 'sm' }: { value: number; showBar?: boolean; size?: 'sm' | 'md' }) {
  const tier = masteryTier(value);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className={cx('font-semibold', tierColor(tier), size === 'md' ? 'text-sm' : 'text-xs')}>{tier}</span>
        <span className={cx('font-mono tabular-nums text-muted', size === 'md' ? 'text-sm' : 'text-xs')}>{value}%</span>
      </div>
      {showBar && <ProgressBar value={value} tone={value >= 90 ? 'accent' : value >= 75 ? 'info' : value >= 50 ? 'warn' : 'violet'} />}
    </div>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <span className={cx('chip transition-colors', streak >= 3 && 'border-warn/50 bg-warn/10 text-warn')} aria-live="polite">
      <Flame size={12} className={streak >= 3 ? 'text-warn' : 'text-muted'} /> {streak} correct
    </span>
  );
}

export function Hearts({ n, max = 3 }: { n: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} hearts`}>
      {Array.from({ length: max }).map((_, i) => (
        <Heart key={i} size={16} className={i < n ? 'fill-bad text-bad' : 'text-line'} />
      ))}
    </span>
  );
}

/** Floating "+15 XP" that fades out. */
export function XPToast({ amount, trigger }: { amount: number; trigger: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!trigger || amount <= 0) return;
    setShow(true);
    const id = window.setTimeout(() => setShow(false), 900);
    return () => window.clearTimeout(id);
  }, [trigger, amount]);
  if (!show) return null;
  return (
    <span className="pointer-events-none absolute -top-2 right-0 flex animate-floatUp items-center gap-1 text-sm font-bold text-accent">
      <Zap size={14} /> +{amount} XP
    </span>
  );
}
