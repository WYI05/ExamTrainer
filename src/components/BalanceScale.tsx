import { useState } from 'react';
import { money } from '@/utils/format';
import { eoqDirection } from '@/utils/calc';
import { cx } from './ui';

/** Visual balance: AHC on the left pan, AOC on the right. */
export function BalanceScale({ AHC: a0 = 80000, AOC: o0 = 40000, Q = 500, interactive = true }: { AHC?: number; AOC?: number; Q?: number; interactive?: boolean }) {
  const [AHC, setAHC] = useState(a0);
  const [AOC, setAOC] = useState(o0);
  const dir = eoqDirection(AHC, AOC);
  const total = AHC + AOC || 1;
  const tilt = ((AHC - AOC) / total) * 14; // degrees
  const msg =
    dir === 'equal'
      ? `AHC = AOC → current Q (${Q}) is exactly at EOQ.`
      : dir === 'less'
        ? `AHC > AOC → holding is too heavy → Q is too BIG → EOQ is LESS than ${Q}.`
        : `AOC > AHC → ordering is too heavy → Q is too SMALL → EOQ is GREATER than ${Q}.`;
  return (
    <div className="card p-5">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Balance scale · at EOQ, AOC = AHC</div>
      <svg viewBox="0 0 320 170" className="mx-auto w-full max-w-md">
        <rect x={150} y={70} width={20} height={80} rx={4} className="fill-raised stroke-line" />
        <rect x={110} y={150} width={100} height={8} rx={3} className="fill-line" />
        <g transform={`rotate(${tilt} 160 72)`} className="transition-transform duration-500">
          <rect x={40} y={68} width={240} height={8} rx={4} className="fill-muted" />
          <line x1={60} y1={76} x2={60} y2={110} className="stroke-muted" />
          <line x1={260} y1={76} x2={260} y2={110} className="stroke-muted" />
          <rect x={20} y={110} width={80} height={10} rx={3} className="fill-warn/80" />
          <rect x={220} y={110} width={80} height={10} rx={3} className="fill-info/80" />
          <text x={60} y={135} textAnchor="middle" className="fill-warn text-[11px] font-bold">
            AHC
          </text>
          <text x={260} y={135} textAnchor="middle" className="fill-info text-[11px] font-bold">
            AOC
          </text>
        </g>
        <circle cx={160} cy={72} r={6} className="fill-fg" />
      </svg>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-warn/40 bg-warn/5 p-3">
          <div className="text-[10px] font-bold uppercase text-warn">Holding · AHC</div>
          <div className="font-mono text-lg font-bold">{money(AHC, 0)}</div>
          {interactive && <input type="range" min={0} max={120000} step={5000} value={AHC} onChange={(e) => setAHC(Number(e.target.value))} className="mt-1 w-full accent-[rgb(var(--c-warn))]" aria-label="AHC" />}
        </div>
        <div className="rounded-lg border border-info/40 bg-info/5 p-3">
          <div className="text-[10px] font-bold uppercase text-info">Ordering · AOC</div>
          <div className="font-mono text-lg font-bold">{money(AOC, 0)}</div>
          {interactive && <input type="range" min={0} max={120000} step={5000} value={AOC} onChange={(e) => setAOC(Number(e.target.value))} className="mt-1 w-full accent-[rgb(var(--c-info))]" aria-label="AOC" />}
        </div>
      </div>
      <div className={cx('mt-3 rounded-lg px-3 py-2 text-center text-sm font-semibold', dir === 'equal' ? 'bg-good/10 text-good' : dir === 'less' ? 'bg-warn/10 text-warn' : 'bg-info/10 text-info')}>{msg}</div>
    </div>
  );
}
