import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SHORTCUTS } from '@/data/shortcuts';
import { Shell } from '@/components/Layout';
import { PageTitle, cx } from '@/components/ui';

const TONE: Record<string, string> = {
  good: 'border-good/50 text-good',
  bad: 'border-bad/60 text-bad',
  warn: 'border-warn/50 text-warn',
  info: 'border-info/50 text-info',
  violet: 'border-violet/50 text-violet',
};

export function ShortcutsPage() {
  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle title="Things I Cannot Forget" sub="Seventeen cards. Read them before the exam. Then read them again." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map((c) => (
          <div key={c.n} className={cx('card flex min-h-[132px] flex-col justify-between p-5', TONE[c.tone])}>
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-muted">
              <span>{c.title}</span>
              <span className="font-mono">{c.n}</span>
            </div>
            <div className="mt-2 font-mono text-2xl font-extrabold leading-tight">{c.big}</div>
            {c.sub && <div className="mt-1 text-sm text-muted">{c.sub}</div>}
          </div>
        ))}
      </div>
    </Shell>
  );
}
