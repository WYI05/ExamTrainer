import { useMemo, useState } from 'react';
import { annualHoldingCost, annualOrderingCost, eoq } from '@/utils/calc';
import { money } from '@/utils/format';
import { cx } from './ui';

interface Props {
  D?: number;
  S?: number;
  H?: number;
  compact?: boolean;
}

/** Interactive EOQ curve: ordering cost falls, holding cost rises, EOQ is the balance. */
export function EOQVisual({ D: D0 = 7800, S: S0 = 475, H: H0 = 61.25, compact }: Props) {
  const [D, setD] = useState(D0);
  const [S, setS] = useState(S0);
  const [H, setH] = useState(H0);
  const e = eoq(D, S, H);
  const maxQ = Math.max(100, Math.ceil((e * 3) / 50) * 50);
  const [Q, setQ] = useState(() => Math.round(e * 2));

  const W = 520;
  const Hh = 220;
  const pad = { l: 44, r: 14, t: 14, b: 30 };
  const aoc = annualOrderingCost(D, Q, S);
  const ahc = annualHoldingCost(Q, H);
  const tc = aoc + ahc;

  const { paths, maxY } = useMemo(() => {
    const n = 120;
    const qs = Array.from({ length: n }, (_, i) => Math.max(5, (maxQ * (i + 1)) / n));
    const aocs = qs.map((q) => annualOrderingCost(D, q, S));
    const ahcs = qs.map((q) => annualHoldingCost(q, H));
    const tcs = qs.map((_, i) => aocs[i] + ahcs[i]);
    const cap = Math.max(...tcs.slice(Math.floor(n * 0.1)), ahcs[n - 1]) * 1.1;
    const xs = (q: number) => pad.l + (q / maxQ) * (W - pad.l - pad.r);
    const ys = (v: number) => pad.t + (1 - Math.min(v, cap) / cap) * (Hh - pad.t - pad.b);
    const path = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs(qs[i]).toFixed(1)} ${ys(v).toFixed(1)}`).join(' ');
    return { paths: { aoc: path(aocs), ahc: path(ahcs), tc: path(tcs) }, maxY: cap, xs, ys };
  }, [D, S, H, maxQ]); // eslint-disable-line react-hooks/exhaustive-deps

  const xs = (q: number) => pad.l + (q / maxQ) * (W - pad.l - pad.r);
  const ys = (v: number) => pad.t + (1 - Math.min(v, maxY) / maxY) * (Hh - pad.t - pad.b);

  return (
    <div className="card p-5">
      {!compact && (
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted">Visual EOQ trainer</div>
      )}
      <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full">
        <line x1={pad.l} y1={Hh - pad.b} x2={W - pad.r} y2={Hh - pad.b} className="stroke-line" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={Hh - pad.b} className="stroke-line" />
        <path d={paths.aoc} className="fill-none stroke-info" strokeWidth={2} />
        <path d={paths.ahc} className="fill-none stroke-warn" strokeWidth={2} />
        <path d={paths.tc} className="fill-none stroke-fg" strokeWidth={2.5} strokeDasharray="5 4" />
        <line x1={xs(e)} y1={pad.t} x2={xs(e)} y2={Hh - pad.b} className="stroke-good" strokeDasharray="3 3" />
        <text x={xs(e)} y={Hh - pad.b + 14} textAnchor="middle" className="fill-good text-[11px] font-bold">
          EOQ {Math.round(e)}
        </text>
        <line x1={xs(Q)} y1={pad.t} x2={xs(Q)} y2={Hh - pad.b} className="stroke-accent" strokeWidth={2} />
        <circle cx={xs(Q)} cy={ys(aoc)} r={4} className="fill-info" />
        <circle cx={xs(Q)} cy={ys(ahc)} r={4} className="fill-warn" />
        <circle cx={xs(Q)} cy={ys(tc)} r={4} className="fill-fg" />
        <text x={pad.l + 6} y={pad.t + 12} className="fill-info text-[11px]">Ordering cost (D/Q)S</text>
        <text x={pad.l + 6} y={pad.t + 26} className="fill-warn text-[11px]">Holding cost (Q/2)H</text>
        <text x={pad.l + 6} y={pad.t + 40} className="fill-fg text-[11px]">Total (AOC + AHC)</text>
        <text x={W - pad.r} y={Hh - 6} textAnchor="end" className="fill-muted text-[10px]">Q →</text>
      </svg>
      <div className="mt-2">
        <input type="range" min={10} max={maxQ} step={5} value={Q} onChange={(e2) => setQ(Number(e2.target.value))} className="w-full accent-[rgb(var(--c-accent))]" aria-label="Order quantity Q" />
        <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
          <Cell label="Q" value={Q.toString()} />
          <Cell label="AOC" value={money(aoc, 0)} tone="text-info" />
          <Cell label="AHC" value={money(ahc, 0)} tone="text-warn" />
          <Cell label="TC (excl. DC)" value={money(tc, 0)} />
        </div>
        <div className={cx('mt-2 rounded-lg px-3 py-2 text-center text-sm font-semibold', Math.abs(Q - e) < e * 0.05 ? 'bg-good/10 text-good' : ahc > aoc ? 'bg-warn/10 text-warn' : 'bg-info/10 text-info')}>
          {Math.abs(Q - e) < e * 0.05
            ? 'AOC ≈ AHC — you are at the EOQ.'
            : ahc > aoc
              ? 'AHC > AOC → Q is too BIG → EOQ is smaller. Slide left.'
              : 'AOC > AHC → Q is too SMALL → EOQ is larger. Slide right.'}
        </div>
      </div>
      {!compact && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <Num label="D" value={D} onChange={setD} step={100} min={500} max={30000} />
          <Num label="S" value={S} onChange={setS} step={5} min={10} max={1000} />
          <Num label="H" value={H} onChange={setH} step={0.25} min={1} max={200} />
        </div>
      )}
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-raised px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className={cx('font-mono text-sm font-bold', tone)}>{value}</div>
    </div>
  );
}

function Num({ label, value, onChange, step, min, max }: { label: string; value: number; onChange: (v: number) => void; step: number; min: number; max: number }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-line px-2 py-1.5">
      <span className="font-mono font-bold text-info">{label}</span>
      <input type="number" value={value} step={step} min={min} max={max} onChange={(e) => onChange(Number(e.target.value) || min)} className="w-full bg-transparent font-mono outline-none" />
    </label>
  );
}
