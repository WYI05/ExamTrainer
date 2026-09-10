import { useMemo } from 'react';
import type { VisualSpec } from '@/types';
import { annualHoldingCost, annualOrderingCost, efficiency, idleTime, ordersPerYear, weeksBetweenOrders } from '@/utils/calc';
import { GRAPHS } from '@/data/diagrams';
import { checkLayout } from '@/utils/precedence';
import { PrecedenceDiagram } from './PrecedenceDiagram';
import { BalanceScale } from './BalanceScale';
import { EOQVisual } from './EOQVisual';
import { cx } from './ui';

// ---------------------------------------------------------------------------
// Learning visuals. Every figure is plain SVG driven by theme tokens, so it
// renders in light and dark. `Visual` dispatches on a VisualSpec attached to a
// question or a lesson step.
// ---------------------------------------------------------------------------

const fmt = (v: number, d = 0) => v.toLocaleString('en-US', { maximumFractionDigits: d });

export function Visual({ spec, className }: { spec: VisualSpec; className?: string }) {
  const body = (() => {
    switch (spec.kind) {
      case 'sawtooth':
        return <SawtoothChart {...spec} />;
      case 'station-bars':
        return <StationBars {...spec} />;
      case 'cost-stack':
        return <CostStack {...spec} />;
      case 'teu':
        return <ContainerYard {...spec} />;
      case 'rounding':
        return <RoundingLine {...spec} />;
      case 'holding':
        return <HoldingCostBar {...spec} />;
      case 'pipeline':
        return <PipelineFlow {...spec} />;
      case 'weeks':
        return <WeeksStrip {...spec} />;
      case 'balance':
        return <BalanceScale AHC={spec.AHC} AOC={spec.AOC} Q={spec.Q} interactive={false} />;
      case 'eoq-curve':
        return <EOQVisual D={spec.D} S={spec.S} H={spec.H} Q={spec.Q} marks={spec.marks} compact locked />;
      case 'layout-check':
        return <LayoutCheckFigure {...spec} />;
      case 'tco':
        return <TcoTimeline />;
      case 'day-split':
        return <DaySplit {...spec} />;
      default:
        return null;
    }
  })();
  if (!body) return null;
  return <div className={cx('rounded-xl border border-line bg-surface p-3', className)}>{body}</div>;
}

export function Caption({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 text-center text-xs text-muted">{children}</div>;
}

// ---------------------------------------------------------------------------
// Sawtooth inventory chart — the classic EOQ picture.
// ---------------------------------------------------------------------------
export function SawtoothChart({ D, Q, S, H, emphasize }: { D: number; Q: number; S?: number; H?: number; emphasize?: 'orders' | 'gap' | 'average' }) {
  const W = 520;
  const Hh = 200;
  const pad = { l: 60, r: 16, t: 22, b: 34 };
  const cycles = ordersPerYear(D, Q);
  const gapWeeks = weeksBetweenOrders(Q, D);
  // Show the whole year when there are few orders; otherwise zoom to ~8 cycles.
  const shownCycles = Math.min(cycles, 8);
  const weeksShown = shownCycles * gapWeeks;
  const xs = (w: number) => pad.l + (w / weeksShown) * (W - pad.l - pad.r);
  const ys = (v: number) => pad.t + (1 - v / Q) * (Hh - pad.t - pad.b);
  const path = useMemo(() => {
    const parts: string[] = [];
    const full = Math.floor(shownCycles + 1e-9);
    for (let i = 0; i < full; i++) {
      const a = i * gapWeeks;
      const b = (i + 1) * gapWeeks;
      parts.push(`${i === 0 ? 'M' : 'L'} ${xs(a).toFixed(1)} ${ys(Q).toFixed(1)} L ${xs(b).toFixed(1)} ${ys(0).toFixed(1)}`);
    }
    if (shownCycles - full > 0.01) {
      const a = full * gapWeeks;
      parts.push(`L ${xs(a).toFixed(1)} ${ys(Q).toFixed(1)} L ${xs(weeksShown).toFixed(1)} ${ys(Q * (1 - (shownCycles - full))).toFixed(1)}`);
    }
    return parts.join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [D, Q, shownCycles]);
  const ticks = Array.from({ length: Math.floor(shownCycles) + 1 }, (_, i) => i * gapWeeks);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full">
        <line x1={pad.l} y1={ys(0)} x2={W - pad.r} y2={ys(0)} className="stroke-line" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={ys(0)} className="stroke-line" />
        {/* average inventory */}
        <line x1={pad.l} y1={ys(Q / 2)} x2={W - pad.r} y2={ys(Q / 2)} className={cx(emphasize === 'average' ? 'stroke-warn' : 'stroke-muted')} strokeDasharray="4 4" />
        <text x={W - pad.r} y={ys(Q / 2) - 4} textAnchor="end" className={cx('text-[11px]', emphasize === 'average' ? 'fill-warn font-bold' : 'fill-muted')}>
          average = Q/2 = {fmt(Q / 2, 1)}
        </text>
        <path d={path} className="fill-none stroke-accent" strokeWidth={2.5} strokeLinejoin="round" />
        {/* order arrivals */}
        {ticks.map((w, i) => (
          <g key={i}>
            <line x1={xs(w)} y1={ys(0)} x2={xs(w)} y2={ys(0) + 6} className="stroke-muted" />
            <circle cx={xs(w)} cy={ys(Q)} r={4} className={cx(emphasize === 'orders' ? 'fill-info' : 'fill-accent')} />
          </g>
        ))}
        <text x={pad.l - 6} y={ys(Q) + 4} textAnchor="end" className="fill-fg text-[11px] font-bold">
          Q={fmt(Q)}
        </text>
        <text x={pad.l - 6} y={ys(0) + 4} textAnchor="end" className="fill-muted text-[11px]">
          0
        </text>
        {/* gap brace */}
        {ticks.length > 1 && (
          <g>
            <line x1={xs(0)} y1={Hh - 10} x2={xs(gapWeeks)} y2={Hh - 10} className={cx(emphasize === 'gap' ? 'stroke-warn' : 'stroke-muted')} strokeWidth={emphasize === 'gap' ? 2.5 : 1.5} />
            <text x={xs(gapWeeks / 2)} y={Hh - 14} textAnchor="middle" className={cx('text-[11px]', emphasize === 'gap' ? 'fill-warn font-bold' : 'fill-muted')}>
              {fmt(gapWeeks, 2)} weeks between orders
            </text>
          </g>
        )}
        <text x={W - pad.r} y={pad.t - 8} textAnchor="end" className={cx('text-[11px]', emphasize === 'orders' ? 'fill-info font-bold' : 'fill-muted')}>
          {fmt(cycles, 2)} orders / year{shownCycles < cycles ? ` (first ${Math.floor(shownCycles)} shown)` : ''}
        </text>
        <text x={pad.l} y={pad.t - 8} className="fill-muted text-[11px]">
          inventory ↑ · weeks →
        </text>
      </svg>
      {(S !== undefined || H !== undefined) && (
        <div className="mt-1 grid grid-cols-2 gap-2 text-center font-mono text-xs">
          {S !== undefined && (
            <div className="rounded-md bg-info/10 px-2 py-1 text-info">
              {fmt(cycles, 2)} orders × ${fmt(S)} = AOC ${fmt(annualOrderingCost(D, Q, S), 2)}
            </div>
          )}
          {H !== undefined && (
            <div className="rounded-md bg-warn/10 px-2 py-1 text-warn">
              {fmt(Q / 2, 1)} avg × ${fmt(H, 2)} = AHC ${fmt(annualHoldingCost(Q, H), 2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workstation bars — capacity vs work, idle time, bottleneck.
// ---------------------------------------------------------------------------
export function StationBars({ t, n, c, stationTimes, highlightMax }: { t?: number; n?: number; c?: number; stationTimes?: number[]; highlightMax?: boolean }) {
  const times = useMemo(() => {
    if (stationTimes) return stationTimes;
    const out: number[] = [];
    let left = t ?? 0;
    for (let i = 0; i < (n ?? 0); i++) {
      const v = Math.max(0, Math.min(c ?? 0, left));
      out.push(v);
      left -= v;
    }
    return out;
  }, [t, n, c, stationTimes]);
  const cap = c ?? Math.max(...times);
  const maxIdx = times.indexOf(Math.max(...times));
  const rowH = 22;
  const W = 520;
  const labelW = 46;
  const Hh = times.length * rowH + 30;
  const scale = (W - labelW - 70) / Math.max(cap, 1);
  const work = times.reduce((a, b) => a + b, 0);
  const capacity = cap * times.length;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full">
        {times.map((v, i) => {
          const y = 6 + i * rowH;
          const isMax = highlightMax && i === maxIdx;
          const over = c !== undefined && v > c;
          return (
            <g key={i}>
              <text x={labelW - 6} y={y + 14} textAnchor="end" className="fill-muted text-[11px] font-bold">
                WS{i + 1}
              </text>
              <rect x={labelW} y={y} width={cap * scale} height={rowH - 6} rx={3} className="fill-raised stroke-line" />
              <rect x={labelW} y={y} width={Math.min(v, cap) * scale} height={rowH - 6} rx={3} className={cx(over ? 'fill-bad' : isMax ? 'fill-warn' : 'fill-accent/70')} />
              {over && <rect x={labelW + cap * scale} y={y} width={(v - cap) * scale} height={rowH - 6} className="fill-bad/40" />}
              <text x={labelW + Math.min(v, cap) * scale + 6} y={y + 12} className={cx('text-[11px] font-bold', over ? 'fill-bad' : isMax ? 'fill-warn' : 'fill-fg')}>
                {v}s{isMax ? ' ← bottleneck' : over ? ' > CT' : ''}
              </text>
            </g>
          );
        })}
        {c !== undefined && (
          <>
            <line x1={labelW + cap * scale} y1={2} x2={labelW + cap * scale} y2={Hh - 22} className="stroke-muted" strokeDasharray="3 3" />
            <text x={labelW + cap * scale} y={Hh - 8} textAnchor="middle" className="fill-muted text-[11px]">
              CT = {cap}s
            </text>
          </>
        )}
      </svg>
      {c !== undefined && !stationTimes && (
        <div className="mt-1 grid grid-cols-3 gap-2 text-center font-mono text-xs">
          <div className="rounded-md bg-raised px-2 py-1">capacity {times.length}×{cap} = {capacity}</div>
          <div className="rounded-md bg-accent/10 px-2 py-1 text-accent">work t = {work}</div>
          <div className="rounded-md bg-warn/10 px-2 py-1 text-warn">idle {idleTime(work, times.length, cap)} · eff {Math.round(efficiency(work, times.length, cap) * 100)}%</div>
        </div>
      )}
      {highlightMax && <Caption>The slowest station sets the pace: effective cycle time = {Math.max(...times)} sec.</Caption>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cost stack — DC vs AOC vs AHC.
// ---------------------------------------------------------------------------
export function CostStack({ DC, AOC, AHC, Q }: { DC?: number; AOC?: number; AHC?: number; Q?: number }) {
  const pieces = [
    { key: 'DC', label: 'Purchase cost DC', value: DC, tone: 'bg-muted/50', text: 'text-fg', note: 'does not change with Q' },
    { key: 'AOC', label: 'Ordering cost AOC', value: AOC, tone: 'bg-info', text: 'text-info', note: 'falls as Q grows' },
    { key: 'AHC', label: 'Holding cost AHC', value: AHC, tone: 'bg-warn', text: 'text-warn', note: 'rises as Q grows' },
  ].filter((p) => p.value !== undefined) as { key: string; label: string; value: number; tone: string; text: string; note: string }[];
  const max = Math.max(...pieces.map((p) => p.value), 1);
  const total = pieces.reduce((a, p) => a + p.value, 0);
  return (
    <div className="space-y-1.5">
      {pieces.map((p) => (
        <div key={p.key} className="grid grid-cols-[120px_1fr_auto] items-center gap-2 text-xs">
          <span className={cx('font-bold', p.text)}>{p.label}</span>
          <div className="h-4 overflow-hidden rounded bg-raised">
            <div className={cx('h-full rounded', p.tone)} style={{ width: `${Math.max(2, (p.value / max) * 100)}%` }} />
          </div>
          <span className="font-mono">${fmt(p.value, 2)}</span>
        </div>
      ))}
      {pieces.length > 1 && (
        <div className="grid grid-cols-[120px_1fr_auto] items-center gap-2 border-t border-line pt-1.5 text-xs">
          <span className="font-bold">TC{Q ? ` at Q = ${fmt(Q)}` : ''}</span>
          <span className="text-muted">{pieces.map((p) => p.key).join(' + ')}</span>
          <span className="font-mono font-bold">${fmt(total, 2)}</span>
        </div>
      )}
      {DC !== undefined && AOC !== undefined && AHC !== undefined && (
        <Caption>DC dwarfs the other two, but only AOC and AHC move when Q changes. EOQ balances them.</Caption>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Container yard — 20-ft = 1 TEU, 40-ft = 2 TEU.
// ---------------------------------------------------------------------------
export function ContainerYard({ twenty, forty }: { twenty: number; forty: number }) {
  const show20 = Math.min(twenty, 12);
  const show40 = Math.min(forty, 8);
  const Row = ({ n, wide, count, tone }: { n: number; wide: boolean; count: number; tone: string }) => (
    <div className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={cx('relative h-6 rounded-sm border-2', wide ? 'w-12' : 'w-6', tone)}>
          {wide && <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-current opacity-60" />}
        </div>
      ))}
      {count > n && <span className="text-xs text-muted">… ×{fmt(count)}</span>}
    </div>
  );
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-3">
        <span className="w-28 shrink-0 text-xs font-bold text-info">20-ft × {fmt(twenty)}</span>
        <Row n={show20} wide={false} count={twenty} tone="border-info bg-info/20 text-info" />
        <span className="ml-auto shrink-0 font-mono text-xs">= {fmt(twenty)} TEU</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-28 shrink-0 text-xs font-bold text-violet">40-ft × {fmt(forty)}</span>
        <Row n={show40} wide count={forty} tone="border-violet bg-violet/20 text-violet" />
        <span className="ml-auto shrink-0 font-mono text-xs">= {fmt(forty)} × 2 = {fmt(forty * 2)} TEU</span>
      </div>
      <div className="border-t border-line pt-2 text-right font-mono text-sm font-bold">
        Total = {fmt(twenty)} + {fmt(forty * 2)} = {fmt(twenty + 2 * forty)} TEUs
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rounding number line — CT rounds down, stations round up.
// ---------------------------------------------------------------------------
export function RoundingLine({ value, mode, label }: { value: number; mode: 'down' | 'up'; label?: string }) {
  const lo = Math.floor(value);
  const hi = lo + 1;
  const W = 520;
  const xs = (v: number) => 60 + ((v - lo) / (hi - lo)) * (W - 120);
  const pick = mode === 'down' ? lo : hi;
  const reject = mode === 'down' ? hi : lo;
  return (
    <div>
      <svg viewBox={`0 0 ${W} 96`} className="w-full">
        <line x1={40} y1={50} x2={W - 40} y2={50} className="stroke-line" strokeWidth={2} />
        {[lo, hi].map((v) => (
          <g key={v}>
            <line x1={xs(v)} y1={42} x2={xs(v)} y2={58} className={cx(v === pick ? 'stroke-good' : 'stroke-bad')} strokeWidth={3} />
            <text x={xs(v)} y={78} textAnchor="middle" className={cx('text-[14px] font-bold', v === pick ? 'fill-good' : 'fill-bad')}>
              {v}
            </text>
            <text x={xs(v)} y={92} textAnchor="middle" className={cx('text-[10px]', v === pick ? 'fill-good' : 'fill-bad')}>
              {v === pick ? 'use this' : v === reject ? 'never' : ''}
            </text>
          </g>
        ))}
        <circle cx={xs(value)} cy={50} r={6} className="fill-warn" />
        <text x={xs(value)} y={30} textAnchor="middle" className="fill-warn text-[13px] font-bold">
          {value.toFixed(2)}
        </text>
        <path
          d={mode === 'down' ? `M ${xs(value) - 10} 50 L ${xs(lo) + 14} 50` : `M ${xs(value) + 10} 50 L ${xs(hi) - 14} 50`}
          className="stroke-good"
          strokeWidth={3}
          markerEnd="url(#vis-arrow)"
        />
        <defs>
          <marker id="vis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-good" />
          </marker>
        </defs>
      </svg>
      <Caption>{label ?? (mode === 'down' ? 'Cycle time: round DOWN. Extra seconds per unit would cost you output.' : 'Workstations: round UP. A fraction of a station cannot exist.')}</Caption>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Holding cost bar — H is a slice of unit cost.
// ---------------------------------------------------------------------------
export function HoldingCostBar({ C, rate }: { C: number; rate: number }) {
  const H = C * rate;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-bold">Unit cost C = ${fmt(C, 2)}</span>
        <span className="font-bold text-warn">{Math.round(rate * 100)}% of it = H</span>
      </div>
      <div className="relative h-8 overflow-hidden rounded-md border border-line bg-raised">
        <div className="h-full bg-warn/70" style={{ width: `${rate * 100}%` }} />
        <span className="absolute inset-y-0 left-2 flex items-center font-mono text-xs font-bold">H = ${fmt(H, 2)}</span>
      </div>
      <Caption>
        H = {rate} × {fmt(C, 2)} = ${fmt(H, 2)} per unit per year. Neither {Math.round(rate * 100)} nor ${fmt(C)} is H on its own.
      </Caption>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline — units in transit = d × L.
// ---------------------------------------------------------------------------
export function PipelineFlow({ d, L }: { d: number; L: number }) {
  return (
    <div>
      <div className="flex items-stretch gap-1">
        <div className="flex w-16 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-[10px] text-muted">supplier</div>
        {Array.from({ length: L }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-center rounded-md border border-accent/50 bg-accent/10 py-2">
            <span className="text-[10px] text-muted">week {i + 1}</span>
            <span className="font-mono text-sm font-bold text-accent">{fmt(d)}</span>
          </div>
        ))}
        <div className="flex w-16 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-[10px] text-muted">you</div>
      </div>
      <Caption>
        {L} weeks of lead time × {fmt(d)} per week = {fmt(d * L)} units traveling right now.
      </Caption>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 52-week strip — weekly demand.
// ---------------------------------------------------------------------------
export function WeeksStrip({ D }: { D: number }) {
  const weekly = D / 52;
  return (
    <div>
      <div className="grid grid-cols-[repeat(26,minmax(0,1fr))] gap-0.5">
        {Array.from({ length: 52 }).map((_, i) => (
          <div key={i} className={cx('h-3 rounded-sm', i % 13 === 0 ? 'bg-accent' : 'bg-accent/40')} title={`week ${i + 1}`} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>week 1</span>
        <span>week 52</span>
      </div>
      <Caption>
        {fmt(D)} units a year ÷ 52 weeks = {fmt(weekly, 2)} units each week.
      </Caption>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout check — diagram with violations + station bars.
// ---------------------------------------------------------------------------
export function LayoutCheckFigure({ graphId, layout, ct }: { graphId: string; layout: string[][]; ct: number }) {
  const graph = GRAPHS[graphId];
  const check = checkLayout(graph, layout, ct);
  const stationOf = Object.fromEntries(layout.flatMap((s, i) => s.map((id) => [id, i])));
  return (
    <div className="space-y-2">
      <PrecedenceDiagram
        graph={graph}
        completed={layout.flat()}
        showStates={false}
        violations={check.precedenceErrors.map((e) => e.task)}
        redEdges={check.precedenceErrors.map((e) => [e.missing, e.task])}
        stationOf={stationOf}
        compact
      />
      <StationBars c={ct} stationTimes={check.stationTimes} />
      <div className="text-center text-xs">
        {check.verdict === 'valid' && <span className="font-bold text-good">Every bar fits under CT and every arrow points forward. Valid.</span>}
        {check.verdict !== 'valid' && (
          <span className="font-bold text-bad">
            {check.overloaded.length > 0 && `Red bar = over cycle time. `}
            {check.precedenceErrors.length > 0 && `Red arrow = a task placed before its predecessor.`}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TCO timeline — lifetime cost of one truck.
// ---------------------------------------------------------------------------
export function TcoTimeline() {
  const years = [
    { y: 'Buy', items: ['Purchase price'], tone: 'bg-info' },
    { y: 'Yr 1', items: ['Fuel', 'Insurance'], tone: 'bg-warn' },
    { y: 'Yr 2', items: ['Fuel', 'Maintenance'], tone: 'bg-warn' },
    { y: 'Yr 3', items: ['Fuel', 'Repairs'], tone: 'bg-warn' },
    { y: 'End', items: ['Disposal'], tone: 'bg-violet' },
  ];
  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        {years.map((c) => (
          <div key={c.y} className="rounded-md border border-line bg-raised p-2 text-center">
            <div className={cx('mx-auto mb-1 h-1.5 w-full rounded', c.tone)} />
            <div className="text-[11px] font-bold">{c.y}</div>
            {c.items.map((i) => (
              <div key={i} className="text-[10px] text-muted">{i}</div>
            ))}
          </div>
        ))}
      </div>
      <Caption>TCO adds every column together. The sticker price is only the first one.</Caption>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day split — operating time divided into required units.
// ---------------------------------------------------------------------------
export function DaySplit({ OT, D }: { OT: number; D: number }) {
  const raw = OT / D;
  const slots = Math.min(D, 24);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-bold">{fmt(OT)} seconds available</span>
        <span className="text-muted">{fmt(D)} units required</span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: slots }).map((_, i) => (
          <div key={i} className="h-6 flex-1 rounded-sm bg-violet/50" />
        ))}
        {D > slots && <div className="flex items-center px-1 text-xs text-muted">…</div>}
      </div>
      <Caption>
        Each unit may take at most {fmt(OT)} / {fmt(D)} = {raw.toFixed(2)} sec. Course rule → {Math.floor(raw)} sec.
      </Caption>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Radar chart — world mastery at a glance.
// ---------------------------------------------------------------------------
export function RadarChart({ axes, size = 160 }: { axes: { label: string; value: number }[]; size?: number }) {
  const padX = 44;
  const W = size + padX * 2;
  const cx0 = W / 2;
  const cy0 = size / 2;
  const r = size / 2 - 22;
  const n = axes.length;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx0 + Math.cos(a) * r * v, cy0 + Math.sin(a) * r * v] as const;
  };
  const poly = axes.map((a, i) => pt(i, Math.max(0.03, a.value / 100)).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${size}`} width={W} height={size} className="shrink-0">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={axes.map((_, i) => pt(i, k).join(',')).join(' ')} className="fill-none stroke-line" />
      ))}
      {axes.map((_, i) => (
        <line key={i} x1={cx0} y1={cy0} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} className="stroke-line" />
      ))}
      <polygon points={poly} className="fill-accent/25 stroke-accent" strokeWidth={2} />
      {axes.map((a, i) => {
        const [x, y] = pt(i, 1);
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const anchor = Math.abs(dx) < 0.3 ? 'middle' : dx > 0 ? 'start' : 'end';
        return (
          <text key={a.label} x={x + dx * 8} y={y + dy * 12 + 4} textAnchor={anchor} className="fill-muted text-[10px] font-semibold">
            {a.label} {Math.round(a.value)}%
          </text>
        );
      })}
    </svg>
  );
}
