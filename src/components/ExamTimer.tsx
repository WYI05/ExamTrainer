import { Clock } from 'lucide-react';
import { secondsToClock } from '@/utils/format';
import { cx } from './ui';

export function ExamTimer({ remaining, total }: { remaining: number; total: number }) {
  const pct = total ? remaining / total : 0;
  const danger = remaining <= 300;
  const warn = remaining <= 600 && !danger;
  return (
    <div className={cx('flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-lg font-bold tabular-nums', danger ? 'animate-pulseSoft border-bad text-bad' : warn ? 'border-warn text-warn' : 'border-line')}>
      <Clock size={16} />
      {secondsToClock(remaining)}
      <span className="ml-1 h-1.5 w-16 overflow-hidden rounded-full bg-raised">
        <span className={cx('block h-full', danger ? 'bg-bad' : warn ? 'bg-warn' : 'bg-accent')} style={{ width: `${pct * 100}%` }} />
      </span>
    </div>
  );
}
