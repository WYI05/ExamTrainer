import { useMemo, useState } from 'react';
import type { Graph } from '@/types';
import { eligibleTasks, layoutPositions, predecessorsOf } from '@/utils/precedence';
import { cx } from './ui';

export type NodeState = 'locked' | 'available' | 'completed' | 'violation' | 'neutral';

interface Props {
  graph: Graph;
  completed?: string[];
  /** Tasks to draw red. */
  violations?: string[];
  /** Edges to draw red. */
  redEdges?: [string, string][];
  /** When true, nodes are colored by locked/available/completed. Otherwise neutral. */
  showStates?: boolean;
  onNodeClick?: (id: string) => void;
  selected?: string | null;
  /** Optional station membership: task → station index (adds a small badge). */
  stationOf?: Record<string, number>;
  className?: string;
  compact?: boolean;
}

export function PrecedenceDiagram({ graph, completed = [], violations = [], redEdges = [], showStates = true, onNodeClick, selected, stationOf, className, compact }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const positions = useMemo(() => layoutPositions(graph), [graph]);
  const preds = useMemo(() => predecessorsOf(graph), [graph]);
  const done = useMemo(() => new Set(completed), [completed]);
  const available = useMemo(() => new Set(eligibleTasks(graph, done)), [graph, done]);
  const bad = useMemo(() => new Set(violations), [violations]);
  const redSet = useMemo(() => new Set(redEdges.map(([a, b]) => `${a}-${b}`)), [redEdges]);

  const layers = Math.max(...Object.values(positions).map((p) => p.layer)) + 1;
  const rows = Math.max(...Object.values(positions).map((p) => p.y));
  const colW = compact ? 92 : 110;
  const rowH = compact ? 62 : 74;
  const r = compact ? 19 : 22;
  const width = layers * colW + 40;
  const height = Math.max(rows * rowH + 40, 120);
  const px = (l: number) => 20 + l * colW + colW / 2;
  const py = (y: number) => 20 + y * rowH;

  const stateOf = (id: string): NodeState => {
    if (bad.has(id)) return 'violation';
    if (!showStates) return 'neutral';
    if (done.has(id)) return 'completed';
    if (available.has(id)) return 'available';
    return 'locked';
  };

  const fill: Record<NodeState, string> = {
    locked: 'fill-raised stroke-line',
    available: 'fill-info/20 stroke-info',
    completed: 'fill-good/20 stroke-good',
    violation: 'fill-bad/20 stroke-bad',
    neutral: 'fill-raised stroke-muted',
  };
  const text: Record<NodeState, string> = {
    locked: 'fill-muted',
    available: 'fill-info',
    completed: 'fill-good',
    violation: 'fill-bad',
    neutral: 'fill-fg',
  };

  return (
    <div className={cx('overflow-x-auto', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width, minWidth: Math.min(width, 320) }} className="mx-auto block select-none">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted" />
          </marker>
          <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-bad" />
          </marker>
        </defs>
        {graph.edges.map(([a, b]) => {
          const pa = positions[a];
          const pb = positions[b];
          const x1 = px(pa.layer) + r;
          const y1 = py(pa.y);
          const x2 = px(pb.layer) - r - 2;
          const y2 = py(pb.y);
          const red = redSet.has(`${a}-${b}`);
          const hl = hover === a || hover === b || selected === a || selected === b;
          return (
            <line
              key={`${a}-${b}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={cx('transition-colors', red ? 'stroke-bad' : hl ? 'stroke-fg' : 'stroke-muted/70')}
              strokeWidth={red || hl ? 2.5 : 1.5}
              markerEnd={red ? 'url(#arrow-red)' : 'url(#arrow)'}
            />
          );
        })}
        {graph.tasks.map((t) => {
          const p = positions[t.id];
          const st = stateOf(t.id);
          const isSel = selected === t.id;
          const station = stationOf?.[t.id];
          return (
            <g
              key={t.id}
              transform={`translate(${px(p.layer)}, ${py(p.y)})`}
              className={cx(onNodeClick && 'cursor-pointer')}
              onClick={() => onNodeClick?.(t.id)}
              onMouseEnter={() => setHover(t.id)}
              onMouseLeave={() => setHover(null)}
            >
              <circle r={r} strokeWidth={isSel ? 3 : 2} className={cx(fill[st], 'transition-colors')} />
              <text textAnchor="middle" dy={-2} className={cx('text-[15px] font-bold', text[st])}>
                {t.id}
              </text>
              <text textAnchor="middle" dy={12} className="fill-muted text-[10px]">
                {t.time}s
              </text>
              {station !== undefined && (
                <g transform={`translate(${r - 6}, ${-r + 6})`}>
                  <circle r={8} className="fill-violet" />
                  <text textAnchor="middle" dy={3.5} className="fill-bg text-[9px] font-bold">
                    {station + 1}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {selected && (
        <div className="mt-2 rounded-lg border border-line bg-raised px-3 py-2 text-sm">
          <span className="font-bold">Task {selected}</span> · Time: {graph.tasks.find((t) => t.id === selected)?.time} sec · Prerequisites:{' '}
          {preds[selected].length ? preds[selected].join(', ') : 'none'}
        </div>
      )}
    </div>
  );
}

export function DiagramLegend() {
  const items: [string, string][] = [
    ['bg-raised border-line', 'locked'],
    ['bg-info/20 border-info', 'available'],
    ['bg-good/20 border-good', 'completed'],
    ['bg-bad/20 border-bad', 'violation'],
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted">
      {items.map(([c, l]) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <span className={cx('inline-block h-3 w-3 rounded-full border-2', c)} /> {l}
        </span>
      ))}
    </div>
  );
}
