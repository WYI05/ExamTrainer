import { useState } from 'react';
import type { FormulaDef } from '@/data/formulas';
import { cx } from './ui';

/** Renders a formula string with clickable variable tokens. */
export function FormulaText({ formula, variables, active, onPick, size = 'lg' }: { formula: string; variables: { symbol: string; meaning: string }[]; active?: string | null; onPick?: (s: string) => void; size?: 'md' | 'lg' | 'xl' }) {
  const symbols = variables.map((v) => v.symbol).sort((a, b) => b.length - a.length);
  const escaped = symbols.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = escaped.length ? new RegExp(`(${escaped.join('|')})`, 'g') : null;
  const parts = re ? formula.split(re) : [formula];
  return (
    <div className={cx('font-mono font-bold tracking-tight', size === 'xl' ? 'text-3xl' : size === 'lg' ? 'text-2xl' : 'text-lg')}>
      {parts.map((p, i) =>
        symbols.includes(p) ? (
          <button
            key={i}
            type="button"
            onClick={() => onPick?.(p)}
            className={cx(
              'rounded-md px-1 transition-colors hover:bg-accent/20',
              active === p ? 'bg-accent/25 text-accent' : 'text-info',
            )}
          >
            {p}
          </button>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </div>
  );
}

export function FormulaCard({ f, full }: { f: FormulaDef; full?: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const meaning = active ? f.variables.find((v) => v.symbol === active)?.meaning : null;
  return (
    <div className="card p-5">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">{f.name}</div>
      <FormulaText formula={f.formula} variables={f.variables} active={active} onPick={(s) => setActive(active === s ? null : s)} />
      <div className="mt-3 min-h-[40px] rounded-lg bg-raised px-3 py-2 text-sm">
        {meaning ? (
          <span>
            <span className="font-mono font-bold text-accent">{active}</span> — {meaning}
          </span>
        ) : (
          <span className="text-muted">Tap a letter to see what it means.</span>
        )}
      </div>
      {full && (
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <Block title="What each letter means">
            <ul className="space-y-1">
              {f.variables.map((v) => (
                <li key={v.symbol}>
                  <span className="font-mono font-bold text-info">{v.symbol}</span> · {v.meaning}
                </li>
              ))}
            </ul>
          </Block>
          <Block title="When to use it">{f.whenToUse}</Block>
          <Block title="Common trap" tone="warn">
            {f.trap}
          </Block>
          <Block title="Example">
            <span className="font-mono text-[13px]">{f.example}</span>
          </Block>
        </div>
      )}
    </div>
  );
}

function Block({ title, children, tone }: { title: string; children: React.ReactNode; tone?: 'warn' }) {
  return (
    <div className={cx('rounded-lg border px-3 py-2', tone === 'warn' ? 'border-warn/50 bg-warn/5' : 'border-line')}>
      <div className={cx('mb-1 text-[10px] font-bold uppercase tracking-wide', tone === 'warn' ? 'text-warn' : 'text-muted')}>{title}</div>
      <div>{children}</div>
    </div>
  );
}
