import type { Difficulty, Question } from '@/types';
import {
  cycleTimeCourse,
  cycleTimeRaw,
  effectiveCycleTime,
  efficiency,
  idleTime,
  secondsPerDay,
  theoreticalMin,
  theoreticalMinRaw,
} from '@/utils/calc';
import { defaultRng, pick, randInt, shuffle, type Rng } from '@/utils/random';
import { fmt2, fmtInt, fmtPct, mcCalc, mcText, numeric } from './common';
import type { GenOpts } from './eoq';

const T_POOL = [180, 200, 210, 224, 240, 260, 271, 300, 320, 360, 400, 450, 480, 537, 600];
const C_POOL = [40, 45, 50, 55, 60, 65, 70, 75, 77, 80, 85, 90, 95, 100];

// ---------------------------------------------------------------------------
// Cycle time (never round up)
// ---------------------------------------------------------------------------
export function genCycleTime(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const hours = pick([7, 7.5, 8, 8, 8, 10, 16], rnd);
  const OT = secondsPerDay(hours);
  let D = randInt(180, 900, rnd);
  // Avoid integer results so the rounding rule matters.
  let guard = 0;
  while (Number.isInteger(OT / D) && guard++ < 10) D = randInt(180, 900, rnd);
  const raw = cycleTimeRaw(OT, D);
  const answer = cycleTimeCourse(OT, D);
  const given: string[] = [];
  const steps: string[] = [];
  if (difficulty !== 'easy') {
    const days = pick([20, 21, 22], rnd);
    const monthly = D * days;
    given.push(`Monthly demand = ${fmtInt(monthly)} units`, `Working days per month = ${days}`);
    steps.push(`Daily demand = ${fmtInt(monthly)} / ${days} = ${D} units per day`);
  } else {
    given.push(`Required output = ${D} units per day`);
  }
  given.push(`Factory operates ${hours} hours per day`);
  steps.push(
    `Available time = ${hours} × 60 × 60 = ${fmtInt(OT)} seconds`,
    `c = OT / D = ${fmtInt(OT)} / ${D} = ${fmt2(raw)} sec`,
    `Course rule: never round cycle time up → ${answer} sec`,
  );
  const explanation = {
    steps,
    fastRule: 'CYCLE TIME → NEVER ROUND UP.',
    memoryTrick: 'Extra seconds per unit = fewer units. Round down.',
  };
  const visual: Question['visual'] = { kind: 'rounding', value: raw, mode: 'down' };
  const hints: [string, string] = ['Convert hours to seconds first.', 'c = OT / D, then round DOWN.'];
  if (opts.numeric) {
    return numeric({
      skill: 'cycle-time',
      world: 'w3',
      difficulty,
      prompt: 'What cycle time (seconds) should be used? Apply the course rounding rule.',
      given,
      answer,
      tolerance: 0.01,
      unit: 'sec',
      format: fmtInt,
      hints,
      explanation,
      visual,
      mistake: 'ct-round-up',
    });
  }
  return mcCalc({
    skill: 'cycle-time',
    world: 'w3',
    difficulty,
    prompt: 'What cycle time (in seconds) should be used for this line?',
    given,
    correct: answer,
    format: fmtInt,
    distractors: [
      { value: Math.ceil(raw), mistake: 'ct-round-up' },
      { value: Math.ceil(raw) + 1, mistake: 'ct-round-up' },
      { value: Math.floor((hours * 60) / D), mistake: 'arithmetic' },
      { value: answer + 5, mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'ct-round-up',
    rnd,
  });
}

// ---------------------------------------------------------------------------
// Theoretical minimum (always round up)
// ---------------------------------------------------------------------------
export function genTheoreticalMin(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const t = pick(T_POOL, rnd);
  let c = pick(C_POOL, rnd);
  let guard = 0;
  while (Number.isInteger(t / c) && guard++ < 10) c = pick(C_POOL, rnd);
  const raw = theoreticalMinRaw(t, c);
  const answer = theoreticalMin(t, c);
  const explanation = {
    steps: [`TM = t / c = ${t} / ${c} = ${fmt2(raw)}`, `You cannot have a fraction of a workstation → round UP to ${answer}.`],
    fastRule: 'WORKSTATIONS → ALWAYS ROUND UP.',
  };
  const visual: Question['visual'] = { kind: 'rounding', value: raw, mode: 'up' };
  const hints: [string, string] = ['Divide the total work by the time each station gets.', 'TM = t / c, then round UP.'];
  const given = [`Total task time t = ${t} sec`, `Cycle time c = ${c} sec`];
  if (opts.numeric) {
    return numeric({
      skill: 'theoretical-min',
      world: 'w3',
      difficulty,
      prompt: 'What is the theoretical minimum number of workstations?',
      given,
      answer,
      tolerance: 0.01,
      unit: 'stations',
      format: fmtInt,
      hints,
      explanation,
      visual,
      mistake: 'ws-round-down',
    });
  }
  return mcCalc({
    skill: 'theoretical-min',
    world: 'w3',
    difficulty,
    prompt: 'What is the theoretical minimum number of workstations?',
    given,
    correct: answer,
    format: fmtInt,
    distractors: [
      { value: Math.floor(raw), mistake: 'ws-round-down' },
      { value: answer + 1, mistake: 'arithmetic' },
      { value: Math.max(1, answer - 2), mistake: 'ws-round-down' },
      { value: answer + 2, mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'ws-round-down',
    rnd,
  });
}

// ---------------------------------------------------------------------------
// Efficiency
// ---------------------------------------------------------------------------
export function genEfficiency(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const t = pick(T_POOL, rnd);
  const c = pick(C_POOL, rnd);
  const tm = theoreticalMin(t, c);
  const n = tm + randInt(0, 3, rnd);
  const answer = efficiency(t, n, c);
  const asPercent = rnd() < 0.4;
  const format = asPercent ? fmtPct : fmt2;
  const explanation = {
    steps: [`Efficiency = t / (n × c)`, `= ${t} / (${n} × ${c}) = ${t} / ${n * c} = ${answer.toFixed(3)}`, `As requested: ${format(answer)}`],
    fastRule: 'Efficiency = work ÷ capacity = t / (nc).',
  };
  const visual: Question['visual'] = { kind: 'station-bars', t, n, c };
  const hints: [string, string] = ['Capacity is stations × cycle time.', 'Efficiency = t / (n × c).'];
  const given = [`Total task time t = ${t} sec`, `Number of workstations n = ${n}`, `Cycle time c = ${c} sec`];
  if (opts.numeric) {
    return numeric({
      skill: 'efficiency',
      world: 'w3',
      difficulty,
      prompt: 'What is the line efficiency? Enter as a decimal (e.g. 0.47).',
      given,
      answer: Math.round(answer * 100) / 100,
      tolerance: 0.006,
      format: fmt2,
      hints,
      explanation,
      visual,
      mistake: 'formula-choice',
    });
  }
  return mcCalc({
    skill: 'efficiency',
    world: 'w3',
    difficulty,
    prompt: asPercent ? 'What is the efficiency of the line, as a percentage?' : 'What is the efficiency of the line, as a decimal?',
    given,
    correct: answer,
    format,
    distractors: [
      { value: efficiency(t, n + 1, c), mistake: 'arithmetic' },
      { value: efficiency(t, Math.max(1, n - 1), c), mistake: 'arithmetic' },
      { value: 1 - answer, mistake: 'formula-choice' },
      { value: t / (n * c * 1.25), mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'formula-choice',
    rnd,
  });
}

// ---------------------------------------------------------------------------
// Idle time
// ---------------------------------------------------------------------------
export function genIdle(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const t = pick(T_POOL, rnd);
  const c = pick(C_POOL, rnd);
  let n = theoreticalMin(t, c) + randInt(0, 3, rnd);
  if (n * c === t) n += 1; // keep idle time strictly positive so distractors stay distinct
  const answer = idleTime(t, n, c);
  const explanation = {
    steps: [`Capacity = n × c = ${n} × ${c} = ${n * c} sec`, `Idle = ${n * c} − ${t} = ${answer} sec`],
    fastRule: 'Idle = nc − t (capacity minus work).',
  };
  const visual: Question['visual'] = { kind: 'station-bars', t, n, c };
  const hints: [string, string] = ['How much time does the whole line have, and how much is actual work?', 'Idle = (n × c) − t.'];
  const given = [`Total task time t = ${t} sec`, `Number of workstations n = ${n}`, `Cycle time c = ${c} sec`];
  if (opts.numeric) {
    return numeric({
      skill: 'idle-time',
      world: 'w3',
      difficulty,
      prompt: 'What is the total idle time per cycle (seconds)?',
      given,
      answer,
      tolerance: 0.01,
      unit: 'sec',
      format: fmtInt,
      hints,
      explanation,
      visual,
      mistake: 'formula-choice',
    });
  }
  return mcCalc({
    skill: 'idle-time',
    world: 'w3',
    difficulty,
    prompt: 'What is the total idle time (seconds) for this line?',
    given,
    correct: answer,
    format: fmtInt,
    distractors: [
      { value: idleTime(t, n + 1, c), mistake: 'arithmetic' },
      { value: Math.abs(idleTime(t, Math.max(1, n - 1), c)), mistake: 'arithmetic' },
      { value: n * c, mistake: 'formula-choice' },
      { value: answer + c, mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'formula-choice',
    rnd,
  });
}

// ---------------------------------------------------------------------------
// Effective cycle time
// ---------------------------------------------------------------------------
export function genEffectiveCT(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const n = randInt(4, 9, rnd);
  const times: number[] = [];
  for (let i = 0; i < n; i++) times.push(randInt(28, 79, rnd));
  // Ensure a single unique maximum so the answer is unambiguous.
  const sorted = [...times].sort((a, b) => b - a);
  if (sorted[0] === sorted[1]) times[times.indexOf(sorted[0])] += 3;
  const answer = effectiveCycleTime(times);
  const minVal = Math.min(...times);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const second = [...times].sort((a, b) => b - a)[1];
  const explanation = {
    steps: [`Workstation times: ${times.join(', ')}`, `The slowest station is ${answer} sec — everything waits for it.`],
    fastRule: 'Effective CT = longest workstation. No formula needed.',
    memoryTrick: 'The bottleneck sets the pace.',
  };
  const visual: Question['visual'] = { kind: 'station-bars', stationTimes: times, highlightMax: true };
  const hints: [string, string] = ['Which station is the bottleneck?', 'Effective cycle time = the LONGEST workstation time.'];
  const given = times.map((v, i) => `WS${i + 1} = ${v} sec`);
  if (opts.numeric) {
    return numeric({
      skill: 'effective-ct',
      world: 'w3',
      difficulty,
      prompt: 'What is the effective cycle time of this existing line?',
      given,
      answer,
      tolerance: 0.01,
      unit: 'sec',
      format: fmtInt,
      hints,
      explanation,
      visual,
      mistake: 'effective-ct-confusion',
    });
  }
  return mcCalc({
    skill: 'effective-ct',
    world: 'w3',
    difficulty,
    prompt: 'What is the effective cycle time of this line?',
    given,
    correct: answer,
    format: fmtInt,
    distractors: [
      { value: minVal, mistake: 'effective-ct-confusion' },
      { value: Math.round(avg), mistake: 'effective-ct-confusion' },
      { value: second, mistake: 'arithmetic' },
      { value: times.reduce((a, b) => a + b, 0), mistake: 'formula-choice' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'effective-ct-confusion',
    rnd,
  });
}

/** Effective CT from a fixed list (used by bosses). */
export function effectiveCTFromList(times: number[], difficulty: Difficulty = 'medium', rnd: Rng = defaultRng): Question {
  const answer = effectiveCycleTime(times);
  const sorted = [...times].sort((a, b) => b - a);
  return mcCalc({
    skill: 'effective-ct',
    world: 'w3',
    difficulty,
    prompt: 'A line has the workstation times shown. What is its effective cycle time?',
    given: times.map((v, i) => `WS${i + 1} = ${v} sec`),
    correct: answer,
    format: fmtInt,
    distractors: [
      { value: Math.min(...times), mistake: 'effective-ct-confusion' },
      { value: Math.round(times.reduce((a, b) => a + b, 0) / times.length), mistake: 'effective-ct-confusion' },
      { value: sorted.find((v) => v !== answer) ?? answer - 3, mistake: 'arithmetic' },
      { value: answer - 1, mistake: 'arithmetic' },
    ],
    visual: { kind: 'station-bars', stationTimes: times, highlightMax: true },
    hints: ['Which station is the bottleneck?', 'Effective CT = the LONGEST workstation.'],
    explanation: { steps: [`Longest workstation = ${answer} sec.`], fastRule: 'Effective CT = longest workstation.' },
    defaultMistake: 'effective-ct-confusion',
    rnd,
  });
}

// ---------------------------------------------------------------------------
// Rounding-rule memory game
// ---------------------------------------------------------------------------
export function genRoundingRule(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const which = pick(['ct', 'ws'] as const, rnd);
  if (which === 'ct') {
    const raw = randInt(4000, 9000, rnd) / 100; // e.g. 63.27
    const down = Math.floor(raw);
    return mcText({
      skill: 'rounding-rules',
      world: 'w3',
      difficulty,
      prompt: `Cycle time computes to ${raw.toFixed(2)} seconds. What cycle time should you use in this course?`,
      correct: `${down} seconds`,
      wrong: [
        { label: `${down + 1} seconds`, mistake: 'ct-round-up' },
        { label: `${raw.toFixed(2)} seconds (never round)`, mistake: 'ct-round-up' },
        { label: `${down + 2} seconds`, mistake: 'ct-round-up' },
      ],
      visual: { kind: 'rounding', value: raw, mode: 'down' },
    hints: ['Would MORE seconds per unit help you hit the output target?', 'Cycle time: never round up.'],
      explanation: {
        steps: ['Rounding up gives each unit more time, so the line would fall short of the required output.'],
        fastRule: 'CYCLE TIME → NEVER ROUND UP.',
      },
      defaultMistake: 'ct-round-up',
      rnd,
    });
  }
  const raw = randInt(210, 890, rnd) / 100; // 2.10 .. 8.90
  const up = Math.ceil(raw);
  return mcText({
    skill: 'rounding-rules',
    world: 'w3',
    difficulty,
    prompt: `Theoretical minimum workstations computes to ${raw.toFixed(2)}. How many workstations?`,
    correct: `${up}`,
    wrong: [
      { label: `${up - 1}`, mistake: 'ws-round-down' },
      { label: `${raw.toFixed(2)}`, mistake: 'ws-round-down' },
      { label: `${up + 1}`, mistake: 'arithmetic' },
    ],
    visual: { kind: 'rounding', value: raw, mode: 'up' },
    hints: ['Can you build a fraction of a workstation?', 'Workstations: always round up.'],
    explanation: {
      steps: ['A fraction of a workstation cannot exist, and rounding down would leave work unassigned.'],
      fastRule: 'WORKSTATIONS → ALWAYS ROUND UP.',
    },
    defaultMistake: 'ws-round-down',
    rnd,
  });
}

/** Two-step problem: compute CT from OT and D, then TM from t. */
export function genCtThenTm(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'hard';
  const hours = pick([8, 8, 10, 7.5], rnd);
  const OT = secondsPerDay(hours);
  let D = randInt(250, 700, rnd);
  let guard = 0;
  while (Number.isInteger(OT / D) && guard++ < 10) D = randInt(250, 700, rnd);
  const c = cycleTimeCourse(OT, D);
  const t = pick(T_POOL, rnd);
  const answer = theoreticalMin(t, c);
  const wrongC = Math.ceil(OT / D);
  return mcCalc({
    skill: 'theoretical-min',
    world: 'w3',
    difficulty,
    prompt: 'What is the theoretical minimum number of workstations for this line?',
    given: [`Factory operates ${hours} hours per day`, `Required output = ${D} units per day`, `Total task time t = ${t} sec`],
    correct: answer,
    format: fmtInt,
    distractors: [
      { value: Math.floor(t / c), mistake: 'ws-round-down' },
      { value: theoreticalMin(t, wrongC) === answer ? answer + 2 : theoreticalMin(t, wrongC), mistake: 'ct-round-up' },
      { value: answer + 1, mistake: 'arithmetic' },
      { value: Math.max(1, answer - 2), mistake: 'ws-round-down' },
    ],
    visual: { kind: 'rounding', value: t / c, mode: 'up', label: `c = ${c} (rounded down), then ${t} / ${c} = ${(t / c).toFixed(2)} stations → round up` },
    hints: ['Find cycle time first (never round up), then TM (always round up).', 'c = OT/D → round down. TM = t/c → round up.'],
    explanation: {
      steps: [
        `OT = ${hours} × 3600 = ${fmtInt(OT)} sec`,
        `c = ${fmtInt(OT)} / ${D} = ${(OT / D).toFixed(2)} → ${c} (never round CT up)`,
        `TM = ${t} / ${c} = ${(t / c).toFixed(2)} → ${answer} (always round stations up)`,
      ],
      fastRule: 'CT rounds down. Stations round up.',
    },
    defaultMistake: 'ws-round-down',
    rnd,
  });
}

/** Random mix of World 3 non-diagram calculations. */
export function genLineBalancingRandom(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const gens = [genCycleTime, genTheoreticalMin, genEfficiency, genIdle, genEffectiveCT, genRoundingRule, genCtThenTm];
  return pick(shuffle(gens, rnd), rnd)(opts);
}
