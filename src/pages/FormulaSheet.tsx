import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gauge } from 'lucide-react';
import { FORMULAS } from '@/data/formulas';
import { FormulaCard } from '@/components/FormulaCard';
import { Shell } from '@/components/Layout';
import { PageTitle, cx } from '@/components/ui';

export function FormulaSheet() {
  const [tab, setTab] = useState<'w2' | 'w3'>('w2');
  const [expanded, setExpanded] = useState<string | null>(null);
  const list = FORMULAS.filter((f) => f.world === tab);
  return (
    <Shell>
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Home
      </Link>
      <PageTitle
        title="Formula Sheet"
        sub="Tap any letter to see what it means. Tap a card to expand traps and examples."
        right={
          <Link to="/formula-game" className="btn-primary">
            <Gauge size={15} /> Which formula? game
          </Link>
        }
      />
      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('w2')} className={cx('rounded-full border px-4 py-1.5 text-sm font-semibold', tab === 'w2' ? 'border-accent bg-accent/15 text-accent' : 'border-line')}>
          Inventory & EOQ
        </button>
        <button onClick={() => setTab('w3')} className={cx('rounded-full border px-4 py-1.5 text-sm font-semibold', tab === 'w3' ? 'border-violet bg-violet/15 text-violet' : 'border-line')}>
          Line Balancing
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((f) => (
          <div key={f.id} onClick={() => setExpanded(expanded === f.id ? null : f.id)} className={cx('cursor-pointer', expanded === f.id && 'md:col-span-2')}>
            <FormulaCard f={f} full={expanded === f.id} />
          </div>
        ))}
      </div>
    </Shell>
  );
}
