import type { Graph, LayoutCheck, LayoutVerdict } from '@/types';

/** Map of task → predecessors. */
export function predecessorsOf(graph: Graph): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const t of graph.tasks) map[t.id] = [];
  for (const [from, to] of graph.edges) map[to].push(from);
  return map;
}

/** Map of task → successors. */
export function successorsOf(graph: Graph): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const t of graph.tasks) map[t.id] = [];
  for (const [from, to] of graph.edges) map[from].push(to);
  return map;
}

export function taskTime(graph: Graph, id: string): number {
  const t = graph.tasks.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown task ${id} in graph ${graph.id}`);
  return t.time;
}

export function totalTaskTime(graph: Graph): number {
  return graph.tasks.reduce((s, t) => s + t.time, 0);
}

export function stationTime(graph: Graph, station: string[]): number {
  return station.reduce((s, id) => s + taskTime(graph, id), 0);
}

/** Tasks whose predecessors are all completed and that are not yet completed. */
export function eligibleTasks(graph: Graph, completed: Set<string>): string[] {
  const preds = predecessorsOf(graph);
  return graph.tasks
    .map((t) => t.id)
    .filter((id) => !completed.has(id) && preds[id].every((p) => completed.has(p)));
}

/**
 * Checks a single workstation given everything completed before it.
 * A predecessor inside the same workstation is fine (it can be done first),
 * as long as the whole chain resolves inside the station — which it always
 * does for a DAG once every predecessor is either done or in the station.
 */
export function checkStation(
  graph: Graph,
  completedBefore: Set<string>,
  station: string[],
): { missing: { task: string; missing: string }[] } {
  const preds = predecessorsOf(graph);
  const inStation = new Set(station);
  const missing: { task: string; missing: string }[] = [];
  for (const id of station) {
    for (const p of preds[id]) {
      if (!completedBefore.has(p) && !inStation.has(p)) missing.push({ task: id, missing: p });
    }
  }
  return { missing };
}

/** Full validity check of an ordered layout against a cycle time. */
export function checkLayout(graph: Graph, layout: string[][], cycleTime: number): LayoutCheck {
  const completed = new Set<string>();
  const stationTimes: number[] = [];
  const overloaded: number[] = [];
  const precedenceErrors: LayoutCheck['precedenceErrors'] = [];

  layout.forEach((station, idx) => {
    const time = stationTime(graph, station);
    stationTimes.push(time);
    if (time > cycleTime) overloaded.push(idx);
    const { missing } = checkStation(graph, completed, station);
    for (const m of missing) precedenceErrors.push({ station: idx, task: m.task, missing: m.missing });
    station.forEach((id) => completed.add(id));
  });

  let verdict: LayoutVerdict = 'valid';
  if (overloaded.length && precedenceErrors.length) verdict = 'both';
  else if (overloaded.length) verdict = 'cycle-time';
  else if (precedenceErrors.length) verdict = 'precedence';

  return { verdict, stationTimes, overloaded, precedenceErrors };
}

/** Human-readable reason for a layout failure. */
export function explainLayout(graph: Graph, layout: string[][], cycleTime: number): string[] {
  const check = checkLayout(graph, layout, cycleTime);
  const lines: string[] = [];
  for (const idx of check.overloaded) {
    lines.push(`WS${idx + 1} (${layout[idx].join('')}) = ${check.stationTimes[idx]} sec > CT ${cycleTime}. Cycle-time violation.`);
  }
  for (const e of check.precedenceErrors) {
    lines.push(`WS${e.station + 1}: ${e.task} cannot be performed yet because ${e.missing} has not been completed.`);
  }
  if (!lines.length) lines.push(`Every workstation ≤ ${cycleTime} sec and every predecessor is finished first. Valid.`);
  return lines;
}

/** Deterministic-ish random valid layout builder using a supplied RNG. */
export function buildRandomValidLayout(graph: Graph, cycleTime: number, rnd: () => number): string[][] {
  const completed = new Set<string>();
  const layout: string[][] = [];
  const n = graph.tasks.length;
  let guard = 0;
  while (completed.size < n && guard++ < 100) {
    const station: string[] = [];
    let time = 0;
    // Tasks completed before this station starts.
    const before = new Set(completed);
    let candidates = eligibleTasks(graph, before).filter((id) => !station.includes(id));
    while (candidates.length) {
      const fits = candidates.filter((id) => time + taskTime(graph, id) <= cycleTime);
      if (!fits.length) break;
      const pick = fits[Math.floor(rnd() * fits.length)];
      station.push(pick);
      time += taskTime(graph, pick);
      // Within-station completion unlocks successors for the same station.
      const done = new Set([...before, ...station]);
      candidates = eligibleTasks(graph, done).filter((id) => !station.includes(id));
    }
    if (!station.length) {
      // A single task exceeds cycle time — place it anyway so the loop ends.
      const next = eligibleTasks(graph, completed)[0];
      station.push(next);
    }
    station.forEach((id) => completed.add(id));
    layout.push(station);
  }
  return layout;
}

/** Simple layered positions for SVG rendering (longest-path layering). */
export function layoutPositions(graph: Graph): Record<string, { x: number; y: number; layer: number }> {
  const preds = predecessorsOf(graph);
  const layer: Record<string, number> = {};
  const order = topoOrder(graph);
  for (const id of order) {
    layer[id] = preds[id].length ? Math.max(...preds[id].map((p) => layer[p])) + 1 : 0;
  }
  const byLayer: Record<number, string[]> = {};
  for (const id of order) (byLayer[layer[id]] ||= []).push(id);
  const positions: Record<string, { x: number; y: number; layer: number }> = {};
  const layers = Object.keys(byLayer).map(Number).sort((a, b) => a - b);
  const maxRows = Math.max(...layers.map((l) => byLayer[l].length));
  for (const l of layers) {
    const col = byLayer[l];
    col.forEach((id, i) => {
      const y = ((i + 0.5) / col.length) * maxRows;
      positions[id] = { x: l, y, layer: l };
    });
  }
  return positions;
}

export function topoOrder(graph: Graph): string[] {
  const preds = predecessorsOf(graph);
  const done = new Set<string>();
  const out: string[] = [];
  const ids = graph.tasks.map((t) => t.id);
  let guard = 0;
  while (out.length < ids.length && guard++ < 1000) {
    for (const id of ids) {
      if (!done.has(id) && preds[id].every((p) => done.has(p))) {
        done.add(id);
        out.push(id);
      }
    }
  }
  return out;
}
