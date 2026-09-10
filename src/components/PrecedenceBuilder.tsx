import { useMemo, useState } from 'react';
import { HelpCircle, Plus, RotateCcw, Shuffle, Trash2 } from 'lucide-react';
import type { Graph } from '@/types';
import { GRAPHS, PRACTICE_GRAPH_IDS } from '@/data/diagrams';
import { checkLayout, predecessorsOf, stationTime, totalTaskTime } from '@/utils/precedence';
import { theoreticalMin } from '@/utils/calc';
import { pick } from '@/utils/random';
import { PrecedenceDiagram, DiagramLegend } from './PrecedenceDiagram';
import { useSound } from '@/hooks/useSound';
import { cx } from './ui';

/**
 * Drag (or tap) tasks into workstations. Each station shows its time vs CT
 * (green ≤ CT, red > CT). Precedence violations turn the offending arrow red.
 */
export function PrecedenceBuilder({ initialGraphId = 'g1', initialCT = 80 }: { initialGraphId?: string; initialCT?: number }) {
  const play = useSound();
  const [graphId, setGraphId] = useState(initialGraphId);
  const [ct, setCt] = useState(initialCT);
  const graph: Graph = GRAPHS[graphId];
  const [stations, setStations] = useState<string[][]>([[]]);
  const [picked, setPicked] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [why, setWhy] = useState(false);

  const placed = useMemo(() => new Set(stations.flat()), [stations]);
  const unplaced = graph.tasks.map((t) => t.id).filter((id) => !placed.has(id));
  const check = useMemo(() => checkLayout(graph, stations.filter((s) => s.length), ct), [graph, stations, ct]);
  const preds = useMemo(() => predecessorsOf(graph), [graph]);
  const done = unplaced.length === 0;
  const total = totalTaskTime(graph);
  const tm = theoreticalMin(total, ct);

  // Completed-before sets for coloring: tasks in earlier stations count as done.
  const violationTasks = check.precedenceErrors.map((e) => e.task);
  const redEdges: [string, string][] = check.precedenceErrors.map((e) => [e.missing, e.task]);
  const completedForColor = stations.flat();
  const stationOf: Record<string, number> = Object.fromEntries(stations.flatMap((s, i) => s.map((id) => [id, i])));

  const place = (task: string, stationIdx: number) => {
    setStations((prev) => {
      const next = prev.map((s) => s.filter((id) => id !== task));
      next[stationIdx] = [...next[stationIdx], task];
      return next;
    });
    setPicked(null);
    play('click');
  };
  const remove = (task: string) => {
    setStations((prev) => prev.map((s) => s.filter((id) => id !== task)));
  };
  const reset = () => {
    setStations([[]]);
    setPicked(null);
    setWhy(false);
  };
  const newPuzzle = () => {
    const id = pick(PRACTICE_GRAPH_IDS.filter((g) => g !== graphId));
    const g = GRAPHS[id];
    const maxTask = Math.max(...g.tasks.map((t) => t.time));
    setGraphId(id);
    setCt(pick([55, 60, 65, 70, 75, 80, 85, 90].filter((c) => c >= maxTask)));
    reset();
  };

  const onDrop = (e: React.DragEvent, stationIdx: number) => {
    e.preventDefault();
    const task = e.dataTransfer.getData('text/task');
    if (task) place(task, stationIdx);
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm">
            <span className="font-bold">{graph.name}</span> <span className="text-muted">· t = {total} sec · CT = </span>
            <input type="number" value={ct} min={20} max={200} onChange={(e) => setCt(Number(e.target.value) || ct)} className="w-16 rounded-md border border-line bg-raised px-1 font-mono" aria-label="Cycle time" />
            <span className="text-muted"> · TM = {tm}</span>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost text-xs" onClick={newPuzzle}>
              <Shuffle size={13} /> New puzzle
            </button>
            <button className="btn-ghost text-xs" onClick={reset}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>
        <PrecedenceDiagram graph={graph} completed={completedForColor} violations={violationTasks} redEdges={redEdges} onNodeClick={(id) => setSelected(selected === id ? null : id)} selected={selected} stationOf={stationOf} />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <DiagramLegend />
          <span className="text-[11px] text-muted">Click a node for its prerequisites.</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="card p-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">Unplaced tasks</div>
          <div className="flex flex-wrap gap-2">
            {unplaced.map((id) => {
              const ready = preds[id].every((p) => placed.has(p));
              return (
                <button
                  key={id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/task', id)}
                  onClick={() => setPicked(picked === id ? null : id)}
                  className={cx(
                    'flex h-12 w-12 cursor-grab flex-col items-center justify-center rounded-lg border font-bold transition-colors',
                    picked === id ? 'border-accent bg-accent/20' : ready ? 'border-info bg-info/10 text-info' : 'border-line bg-raised text-muted',
                  )}
                  title={ready ? 'Ready to place' : `Needs ${preds[id].filter((p) => !placed.has(p)).join(', ')}`}
                >
                  {id}
                  <span className="text-[10px] font-normal">{graph.tasks.find((t) => t.id === id)?.time}s</span>
                </button>
              );
            })}
            {!unplaced.length && <span className="text-sm text-muted">All placed.</span>}
          </div>
          <p className="mt-3 text-[11px] text-muted">Drag a task into a station, or tap a task then tap a station.</p>
        </div>

        <div className="space-y-2">
          {stations.map((s, i) => {
            const time = stationTime(graph, s);
            const over = time > ct;
            const hasPrec = check.precedenceErrors.some((e) => e.station === i);
            return (
              <div
                key={i}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, i)}
                onClick={() => picked && place(picked, i)}
                className={cx(
                  'flex min-h-[64px] items-center gap-3 rounded-xl border-2 border-dashed px-3 py-2 transition-colors',
                  over || hasPrec ? 'border-bad bg-bad/5' : s.length ? 'border-good/60 bg-good/5' : 'border-line',
                  picked && 'cursor-pointer hover:border-accent',
                )}
              >
                <div className="w-14 shrink-0 text-xs font-bold text-muted">WS {i + 1}</div>
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {s.map((id) => (
                    <span key={id} className={cx('inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-sm font-bold', violationTasks.includes(id) ? 'border-bad bg-bad/10 text-bad' : 'border-line bg-raised')}>
                      {id}
                      <button className="text-muted hover:text-bad" onClick={(e) => { e.stopPropagation(); remove(id); }} aria-label={`Remove ${id}`}>
                        <Trash2 size={11} />
                      </button>
                    </span>
                  ))}
                  {!s.length && <span className="text-xs text-muted">drop tasks here</span>}
                </div>
                <div className={cx('shrink-0 font-mono text-sm font-bold', over ? 'text-bad' : 'text-good')}>
                  {time} / {ct} sec
                </div>
              </div>
            );
          })}
          <button className="btn-ghost w-full text-xs" onClick={() => setStations((p) => [...p, []])}>
            <Plus size={13} /> Add workstation
          </button>
        </div>
      </div>

      <div className={cx('card p-4', check.verdict === 'valid' && done ? 'border-good/60' : check.verdict !== 'valid' ? 'border-bad/60' : '')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-bold">
            {done && check.verdict === 'valid' && <span className="text-good">Valid layout — {stations.filter((s) => s.length).length} stations{stations.filter((s) => s.length).length === tm ? ' (theoretical minimum!)' : ''}.</span>}
            {!done && check.verdict === 'valid' && <span className="text-muted">So far so good. {unplaced.length} tasks left.</span>}
            {check.verdict === 'cycle-time' && <span className="text-bad">Cycle-time violation.</span>}
            {check.verdict === 'precedence' && <span className="text-bad">Precedence violation.</span>}
            {check.verdict === 'both' && <span className="text-bad">Both cycle-time and precedence violations.</span>}
          </div>
          {check.verdict !== 'valid' && (
            <button className="btn-ghost text-xs" onClick={() => setWhy((w) => !w)}>
              <HelpCircle size={13} /> Why is this wrong?
            </button>
          )}
        </div>
        {why && check.verdict !== 'valid' && (
          <ul className="mt-2 space-y-1 text-sm">
            {check.overloaded.map((i) => (
              <li key={`o${i}`} className="text-bad">
                WS{i + 1} totals {check.stationTimes[i]} sec, which exceeds CT {ct}.
              </li>
            ))}
            {check.precedenceErrors.map((e, i) => (
              <li key={`p${i}`} className="text-bad">
                {e.task} cannot be performed yet because {e.missing} has not been completed.
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
