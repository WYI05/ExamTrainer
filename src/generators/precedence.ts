import type { Difficulty, Graph, LayoutVerdict, Question } from '@/types';
import { GRAPHS, LAB2_LAYOUTS, PRACTICE_GRAPH_IDS } from '@/data/diagrams';
import { efficiency, idleTime, theoreticalMin, theoreticalMinRaw } from '@/utils/calc';
import {
  buildRandomValidLayout,
  checkLayout,
  checkStation,
  eligibleTasks,
  explainLayout,
  predecessorsOf,
  stationTime,
  totalTaskTime,
} from '@/utils/precedence';
import { defaultRng, pick, pickN, randInt, shuffle, type Rng } from '@/utils/random';
import { fmt2, fmtInt, mcCalc, mcText } from './common';
import type { GenOpts } from './eoq';

const VERDICT_LABEL: Record<LayoutVerdict, string> = {
  valid: 'Valid',
  'cycle-time': 'Invalid — cycle-time violation',
  precedence: 'Invalid — precedence violation',
  both: 'Invalid — both cycle-time and precedence violations',
};

const label = (station: string[]) => station.join('');

function randomGraph(rnd: Rng): Graph {
  return GRAPHS[pick(PRACTICE_GRAPH_IDS, rnd)];
}

function ctFor(graph: Graph, rnd: Rng): number {
  const maxTask = Math.max(...graph.tasks.map((t) => t.time));
  const options = [55, 60, 65, 70, 75, 77, 80, 85, 90, 95].filter((c) => c >= maxTask);
  return pick(options, rnd);
}

function subsetsUpTo(items: string[], maxSize: number): string[][] {
  const out: string[][] = [];
  const n = items.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const s: string[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) s.push(items[i]);
    if (s.length <= maxSize) out.push(s);
  }
  return out;
}

/** "Which of the following is a valid next workstation?" */
export function genNextStation(opts: GenOpts & { graph?: Graph; cycleTime?: number } = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'medium';
  for (let attempt = 0; attempt < 30; attempt++) {
    const graph = opts.graph ?? randomGraph(rnd);
    const ct = opts.cycleTime ?? ctFor(graph, rnd);
    const full = buildRandomValidLayout(graph, ct, rnd);
    const priorCount = Math.min(full.length - 2, randInt(1, 2, rnd));
    if (priorCount < 1) continue;
    const prior = full.slice(0, priorCount);
    const completed = new Set(prior.flat());
    const remaining = graph.tasks.map((t) => t.id).filter((id) => !completed.has(id));
    const eligible = eligibleTasks(graph, completed);
    const ineligible = remaining.filter((id) => !eligible.includes(id));
    if (!ineligible.length || eligible.length < 1) continue;

    const isValid = (cand: string[]) => checkLayout(graph, [...prior, cand], ct).verdict === 'valid';
    const validCands = subsetsUpTo(eligible, 3).filter(isValid);
    if (!validCands.length) continue;
    const correct = pick(validCands.filter((c) => c.length >= 2).length ? validCands.filter((c) => c.length >= 2) : validCands, rnd);

    // Build invalid candidates.
    const invalid: { station: string[]; reason: string; mistake: 'predecessor' | 'exceeded-ct' }[] = [];
    const seen = new Set<string>([label(correct)]);
    const pushInvalid = (station: string[]) => {
      const key = label(station);
      if (seen.has(key)) return;
      const chk = checkLayout(graph, [...prior, station], ct);
      if (chk.verdict === 'valid') return;
      seen.add(key);
      const err = chk.precedenceErrors[0];
      const reason =
        chk.verdict === 'cycle-time'
          ? `${key} = ${stationTime(graph, station)} sec > CT ${ct}.`
          : `${err.task} cannot be performed yet because ${err.missing} has not been completed.`;
      invalid.push({ station, reason, mistake: chk.verdict === 'cycle-time' ? 'exceeded-ct' : 'predecessor' });
    };

    // Precedence-invalid: mix one ineligible task with eligible tasks, keeping time ≤ CT where possible.
    for (const bad of shuffle(ineligible, rnd)) {
      const partners = subsetsUpTo(eligible, 2).filter((s) => stationTime(graph, [...s, bad]) <= ct);
      const partner = partners.length ? pick(partners, rnd) : [];
      pushInvalid(shuffle([...partner, bad], rnd).sort());
      if (invalid.length >= 2) break;
    }
    // Cycle-time-invalid: eligible subset that is too long.
    const tooLong = subsetsUpTo(eligible, 4).filter((s) => stationTime(graph, s) > ct);
    if (tooLong.length) pushInvalid(pick(tooLong, rnd));
    // Top up with more precedence-invalid combos.
    for (const bad of shuffle(ineligible, rnd)) {
      if (invalid.length >= 3) break;
      const partners = subsetsUpTo(eligible, 2);
      for (const p of shuffle(partners, rnd)) {
        if (invalid.length >= 3) break;
        pushInvalid([...p, bad].sort());
      }
    }
    if (invalid.length < 3) continue;

    const priorText = prior.map((s, i) => `WS${i + 1} = ${label(s)} (${stationTime(graph, s)} sec)`);
    const nextNum = prior.length + 1;
    const steps = [
      `${label(correct)} = ${stationTime(graph, correct)} sec ≤ ${ct}, and every predecessor is already done.`,
      ...invalid.slice(0, 3).map((i) => `${label(i.station)}: ${i.reason}`),
    ];
    return mcText({
      skill: 'precedence',
      world: 'w3',
      difficulty,
      prompt: `Cycle time is ${ct} seconds. Given the workstations already built, which of the following is a valid WS${nextNum}?`,
      given: priorText,
      diagram: { graphId: graph.id, completed: [...completed] },
      correct: label(correct),
      wrong: invalid.slice(0, 3).map((i) => ({ label: label(i.station), mistake: i.mistake })),
      visual: { kind: 'layout-check', graphId: graph.id, layout: [...prior, correct], ct },
    hints: ['Check two things: is every arrow into each task already finished, and is the total ≤ CT?', 'Eliminate any option containing a task whose predecessor is not done yet, then check the time.'],
      explanation: { steps, fastRule: 'Valid station = all predecessors done + total ≤ CT.' },
      defaultMistake: 'predecessor',
      isCalc: true,
      rnd,
    });
  }
  return fixedNextStationG1(rnd, difficulty);
}

/** Known course scenario: diagram 1, CT 85, WS1 = AE → BC. */
export function fixedNextStationG1(rnd: Rng = defaultRng, difficulty: Difficulty = 'medium'): Question {
  return mcText({
    skill: 'precedence',
    world: 'w3',
    difficulty,
    prompt: 'Cycle time is 85 seconds. WS1 = AE. Which of the following is a valid WS2?',
    given: ['WS1 = AE (84 sec)'],
    diagram: { graphId: 'g1', completed: ['A', 'E'] },
    correct: 'BC',
    wrong: [
      { label: 'DF', mistake: 'predecessor' },
      { label: 'BCD', mistake: 'exceeded-ct' },
      { label: 'CF', mistake: 'predecessor' },
    ],
    visual: { kind: 'layout-check', graphId: 'g1', layout: [['A', 'E'], ['B', 'C']], ct: 85 },
    hints: ['Which tasks have every arrow into them finished after A and E?', 'B and C have no predecessors. D needs B. F needs E, C and D.'],
    explanation: {
      steps: [
        'BC: 35 + 35 = 70 ≤ 85 and both are eligible. Valid.',
        'DF: D requires B, which has not been completed.',
        'BCD: 35 + 35 + 25 = 95 exceeds CT 85.',
        'CF: F still requires D (and E and C) — D is not done.',
      ],
      fastRule: 'Predecessors first, then time.',
    },
    defaultMistake: 'predecessor',
    isCalc: true,
    rnd,
  });
}

/** Known course scenario: diagram 2, CT 80, WS1 = BC → AD. */
export function fixedNextStationG2(rnd: Rng = defaultRng, difficulty: Difficulty = 'medium'): Question {
  return mcText({
    skill: 'precedence',
    world: 'w3',
    difficulty,
    prompt: 'Cycle time is 80 seconds. WS1 = BC. Which of the following is a valid WS2?',
    given: ['WS1 = BC (70 sec)'],
    diagram: { graphId: 'g2', completed: ['B', 'C'] },
    correct: 'AD',
    wrong: [
      { label: 'DF', mistake: 'predecessor' },
      { label: 'EF', mistake: 'predecessor' },
      { label: 'DE', mistake: 'predecessor' },
    ],
    visual: { kind: 'layout-check', graphId: 'g2', layout: [['B', 'C'], ['A', 'D']], ct: 80 },
    hints: ['A has no predecessor. D requires B. E requires A. F requires C, D and E.', 'Only tasks whose predecessors are complete may be placed.'],
    explanation: {
      steps: [
        'AD: A = 30 has no predecessor; D = 25 requires B (done in WS1). 55 ≤ 80. Valid.',
        'DF: F still needs E.',
        'EF: E needs A, which is not done.',
        'DE: E needs A, which is not done.',
      ],
      fastRule: 'Predecessors first, then time.',
    },
    defaultMistake: 'predecessor',
    isCalc: true,
    rnd,
  });
}

/** Lab 2: WS1 = ID, WS2 = AC → BF is NOT acceptable. */
export function fixedLab2NotAcceptableBF(rnd: Rng = defaultRng, difficulty: Difficulty = 'hard'): Question {
  return mcText({
    skill: 'precedence',
    world: 'w3',
    difficulty,
    prompt: 'Cycle time is 77 seconds. WS1 = ID and WS2 = AC. Which of the following would NOT be acceptable as WS3?',
    given: ['WS1 = ID (60 sec)', 'WS2 = AC (68 sec)'],
    diagram: { graphId: 'lab2', completed: ['I', 'D', 'A', 'C'] },
    correct: 'BF',
    wrong: [
      { label: 'BJ', mistake: 'predecessor' },
      { label: 'G', mistake: 'predecessor' },
      { label: 'BG', mistake: 'predecessor' },
    ],
    visual: { kind: 'layout-check', graphId: 'lab2', layout: [['I', 'D'], ['A', 'C'], ['B', 'F']], ct: 77 },
    hints: ['F has a predecessor chain: B → E → F.', 'Is E complete? If not, F cannot be placed.'],
    explanation: {
      steps: [
        'BF: F requires E, and E has not been completed. Not acceptable.',
        'BJ: B has no predecessor; J requires C (done). 34 sec. Acceptable.',
        'G: requires A and D (both done). 61 sec. Acceptable.',
        'BG: 9 + 61 = 70 ≤ 77, all predecessors done. Acceptable.',
      ],
      fastRule: 'Trace every arrow into the task before placing it.',
    },
    defaultMistake: 'predecessor',
    isCalc: true,
    rnd,
  });
}

/** Lab 2: WS1 = IB → ADJ is NOT acceptable. */
export function fixedLab2NotAcceptableADJ(rnd: Rng = defaultRng, difficulty: Difficulty = 'hard'): Question {
  return mcText({
    skill: 'precedence',
    world: 'w3',
    difficulty,
    prompt: 'Cycle time is 77 seconds. WS1 = IB. Which of the following would NOT be acceptable as WS2?',
    given: ['WS1 = IB (59 sec)'],
    diagram: { graphId: 'lab2', completed: ['I', 'B'] },
    correct: 'ADJ',
    wrong: [
      { label: 'ADE', mistake: 'predecessor' },
      { label: 'CD', mistake: 'predecessor' },
      { label: 'AE', mistake: 'predecessor' },
    ],
    visual: { kind: 'layout-check', graphId: 'lab2', layout: [['I', 'B'], ['A', 'D', 'J']], ct: 77 },
    hints: ['J has a predecessor. Has it been completed?', 'J requires C. C is not in WS1.'],
    explanation: {
      steps: [
        'ADJ: J requires C, which has not been completed. Not acceptable.',
        'ADE: A (none), D (needs I ✓), E (needs B ✓) → 62 sec. Acceptable.',
        'CD: C (none), D (needs I ✓) → 61 sec. Acceptable.',
        'AE: 17 + 35 = 52 sec, predecessors done. Acceptable.',
      ],
      fastRule: 'One missing predecessor makes the whole station invalid.',
    },
    defaultMistake: 'predecessor',
    isCalc: true,
    rnd,
  });
}

// ---------------------------------------------------------------------------
// Layout verdict: valid / cycle-time / precedence / both
// ---------------------------------------------------------------------------
function injectPrecedenceViolation(graph: Graph, layout: string[][], rnd: Rng): string[][] | null {
  const preds = predecessorsOf(graph);
  const where: Record<string, number> = {};
  layout.forEach((s, i) => s.forEach((id) => (where[id] = i)));
  const candidates = graph.tasks
    .map((t) => t.id)
    .filter((id) => preds[id].some((p) => where[p] >= 1 && where[p] <= where[id]));
  if (!candidates.length) return null;
  const task = pick(candidates, rnd);
  const predStation = Math.max(...preds[task].map((p) => where[p]));
  const target = randInt(0, predStation - 1, rnd);
  const out = layout.map((s) => s.filter((id) => id !== task));
  out[target] = [...out[target], task];
  return out.filter((s) => s.length);
}

function injectCycleTimeViolation(graph: Graph, layout: string[][], ct: number, rnd: Rng): string[][] | null {
  const merges: number[] = [];
  for (let i = 0; i < layout.length - 1; i++) {
    if (stationTime(graph, [...layout[i], ...layout[i + 1]]) > ct) merges.push(i);
  }
  if (!merges.length) return null;
  const i = pick(merges, rnd);
  const out = [...layout];
  out.splice(i, 2, [...layout[i], ...layout[i + 1]]);
  return out;
}

export function genLayoutVerdict(opts: GenOpts & { graph?: Graph; cycleTime?: number } = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'medium';
  for (let attempt = 0; attempt < 20; attempt++) {
    const graph = opts.graph ?? randomGraph(rnd);
    const ct = opts.cycleTime ?? ctFor(graph, rnd);
    let layout = buildRandomValidLayout(graph, ct, rnd);
    const target = pick(['valid', 'cycle-time', 'precedence', 'both', 'precedence', 'cycle-time'] as LayoutVerdict[], rnd);
    if (target === 'precedence' || target === 'both') {
      const l = injectPrecedenceViolation(graph, layout, rnd);
      if (!l) continue;
      layout = l;
    }
    if (target === 'cycle-time' || target === 'both') {
      const l = injectCycleTimeViolation(graph, layout, ct, rnd);
      if (!l) continue;
      layout = l;
    }
    const check = checkLayout(graph, layout, ct);
    if (check.verdict !== target) continue;
    return verdictQuestion(graph, layout, ct, difficulty, rnd);
  }
  return verdictQuestion(GRAPHS.lab2, LAB2_LAYOUTS.B, 77, difficulty, rnd);
}

export function verdictQuestion(graph: Graph, layout: string[][], ct: number, difficulty: Difficulty, rnd: Rng = defaultRng): Question {
  const check = checkLayout(graph, layout, ct);
  const given = layout.map((s, i) => `WS${i + 1} = ${label(s)} (${check.stationTimes[i]} sec)`);
  const wrongVerdicts = (Object.keys(VERDICT_LABEL) as LayoutVerdict[]).filter((v) => v !== check.verdict);
  return mcText({
    skill: 'precedence',
    world: 'w3',
    difficulty,
    prompt: `Cycle time is ${ct} seconds. Is this workstation layout valid?`,
    given,
    diagram: { graphId: graph.id, layout },
    correct: VERDICT_LABEL[check.verdict],
    wrong: wrongVerdicts.map((v) => ({
      label: VERDICT_LABEL[v],
      mistake: check.verdict === 'cycle-time' || (check.verdict === 'both' && v === 'precedence') ? 'exceeded-ct' : 'predecessor',
    })),
    visual: { kind: 'layout-check', graphId: graph.id, layout, ct },
    hints: ['Check each station total against CT, then trace each arrow.', 'Two separate checks: time ≤ CT, and every predecessor finished in an earlier (or the same) station.'],
    explanation: { steps: explainLayout(graph, layout, ct), fastRule: 'Valid = under CT AND arrows respected.' },
    defaultMistake: 'predecessor',
    isCalc: true,
    rnd,
  });
}

/** The three known Lab 2 layouts. */
export function fixedLab2Layout(which: 'A' | 'B' | 'C', rnd: Rng = defaultRng): Question {
  return verdictQuestion(GRAPHS.lab2, LAB2_LAYOUTS[which], 77, 'hard', rnd);
}

// ---------------------------------------------------------------------------
// Diagram-based calculations (student must sum the task times)
// ---------------------------------------------------------------------------
export function genDiagramCalc(opts: GenOpts & { graph?: Graph } = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'medium';
  const graph = opts.graph ?? randomGraph(rnd);
  const t = totalTaskTime(graph);
  const ct = ctFor(graph, rnd);
  const kind = pick(['tm', 'eff', 'idle'] as const, rnd);
  const tm = theoreticalMin(t, ct);
  const n = tm + randInt(0, 2, rnd);
  const diagram = { graphId: graph.id };
  if (kind === 'tm') {
    return mcCalc({
      skill: 'theoretical-min',
      world: 'w3',
      difficulty,
      prompt: `Using the precedence diagram, what is the theoretical minimum number of workstations if cycle time is ${ct} seconds?`,
      given: [`Cycle time c = ${ct} sec`],
      diagram,
      correct: tm,
      format: fmtInt,
      distractors: [
        { value: Math.floor(theoreticalMinRaw(t, ct)), mistake: 'ws-round-down' },
        { value: tm + 1, mistake: 'arithmetic' },
        { value: tm + 2, mistake: 'arithmetic' },
        { value: Math.max(1, tm - 2), mistake: 'ws-round-down' },
      ],
      visual: { kind: 'rounding', value: t / ct, mode: 'up' },
    hints: ['Add up every task time first.', `t = ${t}. TM = t / c, round UP.`],
      explanation: {
        steps: [`t = ${graph.tasks.map((x) => x.time).join(' + ')} = ${t} sec`, `TM = ${t} / ${ct} = ${fmt2(t / ct)} → round up → ${tm}`],
        fastRule: 'Sum the diagram, divide by CT, round UP.',
      },
      defaultMistake: 'ws-round-down',
      rnd,
    });
  }
  if (kind === 'eff') {
    const answer = efficiency(t, n, ct);
    return mcCalc({
      skill: 'efficiency',
      world: 'w3',
      difficulty,
      prompt: `Using the precedence diagram, what is the efficiency of a ${n}-workstation line with a cycle time of ${ct} seconds? (decimal)`,
      given: [`Cycle time c = ${ct} sec`, `Workstations n = ${n}`],
      diagram,
      correct: answer,
      format: fmt2,
      distractors: [
        { value: efficiency(t, n + 1, ct), mistake: 'arithmetic' },
        { value: efficiency(t, Math.max(1, n - 1), ct), mistake: 'arithmetic' },
        { value: 1 - answer, mistake: 'formula-choice' },
        { value: answer * 0.8, mistake: 'arithmetic' },
      ],
      visual: { kind: 'station-bars', t, n, c: ct },
    hints: ['Total task time comes from the diagram.', `Efficiency = t / (n × c) with t = ${t}.`],
      explanation: {
        steps: [`t = ${t} sec (sum of the diagram)`, `Efficiency = ${t} / (${n} × ${ct}) = ${t} / ${n * ct} = ${answer.toFixed(3)} ≈ ${fmt2(answer)}`],
        fastRule: 'Efficiency = t / (nc).',
      },
      defaultMistake: 'formula-choice',
      rnd,
    });
  }
  const answer = idleTime(t, n, ct);
  return mcCalc({
    skill: 'idle-time',
    world: 'w3',
    difficulty,
    prompt: `Using the precedence diagram, what is the idle time of a ${n}-workstation line with a cycle time of ${ct} seconds?`,
    given: [`Cycle time c = ${ct} sec`, `Workstations n = ${n}`],
    diagram,
    correct: answer,
    format: fmtInt,
    distractors: [
      { value: idleTime(t, n + 1, ct), mistake: 'arithmetic' },
      { value: Math.abs(idleTime(t, Math.max(1, n - 1), ct)), mistake: 'arithmetic' },
      { value: n * ct, mistake: 'formula-choice' },
      { value: answer + ct, mistake: 'arithmetic' },
    ],
    visual: { kind: 'station-bars', t, n, c: ct },
    hints: ['Capacity = n × c. Work = sum of the diagram.', `Idle = ${n} × ${ct} − t, with t = ${t}.`],
    explanation: {
      steps: [`t = ${t} sec`, `Capacity = ${n} × ${ct} = ${n * ct} sec`, `Idle = ${n * ct} − ${t} = ${answer} sec`],
      fastRule: 'Idle = nc − t.',
    },
    defaultMistake: 'formula-choice',
    rnd,
  });
}

/** Which tasks can be started right now? (single correct task) */
export function genEligibleTask(opts: GenOpts & { graph?: Graph } = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  for (let attempt = 0; attempt < 20; attempt++) {
    const graph = opts.graph ?? randomGraph(rnd);
    const ct = 1000;
    const full = buildRandomValidLayout(graph, ct, rnd);
    // Random completed prefix by tasks (not stations) for variety.
    const order = full.flat();
    const k = randInt(1, Math.max(1, order.length - 3), rnd);
    const completed = new Set(order.slice(0, k));
    const eligible = eligibleTasks(graph, completed);
    const blocked = graph.tasks.map((t) => t.id).filter((id) => !completed.has(id) && !eligible.includes(id));
    if (eligible.length < 1 || blocked.length < 3) continue;
    const correct = pick(eligible, rnd);
    const wrong = pickN(blocked, 3, rnd);
    const preds = predecessorsOf(graph);
    const doneList = [...completed].sort().join(', ');
    return mcText({
      skill: 'precedence',
      world: 'w3',
      difficulty,
      prompt: `Tasks ${doneList} are complete. Which of these tasks can be started next?`,
      diagram: { graphId: graph.id, completed: [...completed] },
      correct,
      wrong: wrong.map((w) => ({ label: w, mistake: 'predecessor' as const })),
      hints: ['A task is available only when every arrow pointing into it is done.', `Look at what points into each option.`],
      explanation: {
        steps: [
          `${correct}: predecessors ${preds[correct].length ? preds[correct].join(', ') : 'none'} — all complete.`,
          ...wrong.map((w) => `${w}: still waiting on ${preds[w].filter((p) => !completed.has(p)).join(', ')}.`),
        ],
        fastRule: 'Available = all incoming arrows finished.',
      },
      defaultMistake: 'predecessor',
      rnd,
    });
  }
  return fixedNextStationG1(rnd, difficulty);
}

/** Single-station check: given prior stations, is a proposed station OK? */
export function genStationCheck(opts: GenOpts & { graph?: Graph } = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'medium';
  const graph = opts.graph ?? randomGraph(rnd);
  const ct = ctFor(graph, rnd);
  const full = buildRandomValidLayout(graph, ct, rnd);
  const prior = full.slice(0, Math.max(1, Math.min(2, full.length - 1)));
  const completed = new Set(prior.flat());
  const remaining = graph.tasks.map((t) => t.id).filter((id) => !completed.has(id));
  const proposal = pickN(remaining, Math.min(remaining.length, randInt(1, 3, rnd)), rnd).sort();
  const chk = checkStation(graph, completed, proposal);
  const time = stationTime(graph, proposal);
  const verdict: LayoutVerdict =
    time > ct && chk.missing.length ? 'both' : time > ct ? 'cycle-time' : chk.missing.length ? 'precedence' : 'valid';
  const steps = [
    `${label(proposal)} = ${time} sec vs CT ${ct} → ${time > ct ? 'over CT' : 'OK'}.`,
    ...(chk.missing.length
      ? chk.missing.map((m) => `${m.task} cannot be performed yet because ${m.missing} has not been completed.`)
      : ['Every predecessor is already complete.']),
  ];
  return mcText({
    skill: 'precedence',
    world: 'w3',
    difficulty,
    prompt: `Cycle time is ${ct} seconds. Is ${label(proposal)} acceptable as WS${prior.length + 1}?`,
    given: prior.map((s, i) => `WS${i + 1} = ${label(s)} (${stationTime(graph, s)} sec)`),
    diagram: { graphId: graph.id, completed: [...completed] },
    correct: VERDICT_LABEL[verdict],
    wrong: (Object.keys(VERDICT_LABEL) as LayoutVerdict[])
      .filter((v) => v !== verdict)
      .map((v) => ({ label: VERDICT_LABEL[v], mistake: v === 'valid' ? ('predecessor' as const) : ('exceeded-ct' as const) })),
    visual: { kind: 'layout-check', graphId: graph.id, layout: [...prior, proposal], ct },
    hints: ['Two checks: total time, and incoming arrows.', 'Add the times, then trace each arrow into the proposed tasks.'],
    explanation: { steps, fastRule: 'Under CT AND predecessors done = acceptable.' },
    defaultMistake: 'predecessor',
    isCalc: true,
    rnd,
  });
}

export function genPrecedenceRandom(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const gens = [genNextStation, genNextStation, genLayoutVerdict, genLayoutVerdict, genEligibleTask, genStationCheck, genDiagramCalc];
  return pick(gens, rnd)(opts);
}
