import type { Difficulty, Question } from '@/types';
import {
  annualHoldingCost,
  annualOrderingCost,
  eoq,
  eoqDirection,
  holdingCostFromRate,
  ordersPerYear,
  pipelineInventory,
  practicalQuantities,
  purchaseCost,
  totalCost,
  weeklyDemand,
  weeksBetweenOrders,
} from '@/utils/calc';
import { defaultRng, pick, randInt, randStep, type Rng } from '@/utils/random';
import { fmt2, fmtInt, fmtMoney0, fmtMoney2, mcCalc, mcText, numeric } from './common';

export interface GenOpts {
  difficulty?: Difficulty;
  rnd?: Rng;
  /** Produce a free-entry numeric question instead of multiple choice. */
  numeric?: boolean;
}

const D_POOL = [1200, 1500, 2000, 2400, 2600, 3000, 3600, 4000, 4800, 5200, 6000, 6400, 7800, 8000, 9000, 10400, 12000, 15600];
const S_POOL = [50, 60, 75, 80, 100, 120, 125, 150, 200, 250, 300, 400, 475, 500, 600, 800];
const H_POOL = [5, 8, 10, 12, 15, 18, 20, 24, 25, 30, 36, 38, 40, 45, 50, 60];
const C_POOL = [20, 25, 40, 50, 60, 80, 100, 120, 150, 175, 200, 250];
const RATE_POOL = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4];

interface EoqScenario {
  D: number;
  S: number;
  H: number;
  C: number;
  rate?: number;
  sComponents?: { name: string; value: number }[];
  Q: number;
}

function scenario(difficulty: Difficulty, rnd: Rng): EoqScenario {
  const D = pick(D_POOL, rnd);
  const C = pick(C_POOL, rnd);
  let S = pick(S_POOL, rnd);
  let H: number;
  let rate: number | undefined;
  let sComponents: EoqScenario['sComponents'];

  if (difficulty === 'easy') {
    H = pick(H_POOL, rnd);
  } else {
    rate = pick(RATE_POOL, rnd);
    H = holdingCostFromRate(C, rate);
  }
  if (difficulty === 'hard' || difficulty === 'exam') {
    const placement = randStep(100, 300, 25, rnd);
    const delivery = randStep(50, 150, 25, rnd);
    const receiving = randStep(10, 50, 5, rnd);
    const labor = randStep(20, 60, 10, rnd);
    sComponents = [
      { name: 'Order placement', value: placement },
      { name: 'Delivery', value: delivery },
      { name: 'Receiving', value: receiving },
      { name: 'Labor', value: labor },
    ];
    S = placement + delivery + receiving + labor;
  }
  const Q = randStep(Math.max(100, D / 40), D / 4, 50, rnd);
  return { D, S, H, C, rate, sComponents, Q };
}

function givenLines(s: EoqScenario, include: ('D' | 'S' | 'H' | 'C' | 'Q')[]): string[] {
  const lines: string[] = [];
  if (include.includes('D')) lines.push(`Annual demand D = ${fmtInt(s.D)} units`);
  if (include.includes('C')) lines.push(`Unit cost C = ${fmtMoney0(s.C)}`);
  if (include.includes('S')) {
    if (s.sComponents) {
      lines.push('Costs per order: ' + s.sComponents.map((c) => `${c.name} $${c.value}`).join(', '));
    } else lines.push(`Ordering cost S = ${fmtMoney0(s.S)} per order`);
  }
  if (include.includes('H')) {
    if (s.rate !== undefined) lines.push(`Holding cost = ${Math.round(s.rate * 100)}% of unit cost per year`);
    else lines.push(`Holding cost H = ${fmtMoney0(s.H)} per unit per year`);
  }
  if (include.includes('Q')) lines.push(`Current order quantity Q = ${fmtInt(s.Q)} units`);
  return lines;
}

function hSteps(s: EoqScenario): string[] {
  const out: string[] = [];
  if (s.sComponents) out.push(`S = ${s.sComponents.map((c) => c.value).join(' + ')} = $${s.S}`);
  if (s.rate !== undefined) out.push(`H = ${s.rate} × ${s.C} = $${fmt2(s.H)} per unit per year`);
  return out;
}

// ---------------------------------------------------------------------------
// EOQ
// ---------------------------------------------------------------------------
export function genEoq(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const s = scenario(difficulty, rnd);
  const answer = eoq(s.D, s.S, s.H);
  const given = givenLines(s, difficulty === 'easy' ? ['D', 'S', 'H'] : ['D', 'C', 'S', 'H']);
  const steps = [
    ...hSteps(s),
    `EOQ = √(2 × ${fmtInt(s.D)} × ${s.S} / ${fmt2(s.H)})`,
    `= √(${fmt2((2 * s.D * s.S) / s.H)}) ≈ ${fmt2(answer)}`,
  ];
  const explanation = { steps, fastRule: 'EOQ = √(2DS / H). Get H right first.' };
  const visual: Question['visual'] = { kind: 'eoq-curve', D: s.D, S: s.S, H: s.H };
  const hints: [string, string] = [
    s.rate !== undefined ? 'Is the holding cost given as a dollar amount or a percentage?' : 'Which three letters does EOQ need?',
    'EOQ = √(2DS / H)' + (s.rate !== undefined ? '. H = rate × C.' : ''),
  ];
  if (opts.numeric) {
    return numeric({
      skill: 'eoq',
      world: 'w2',
      difficulty,
      prompt: 'Calculate the Economic Order Quantity (EOQ). Round to 2 decimals.',
      given,
      answer,
      tolerance: Math.max(0.6, answer * 0.004),
      unit: 'units',
      format: fmt2,
      hints,
      explanation,
      visual,
      mistake: s.rate !== undefined ? 'rate-not-h' : 'arithmetic',
    });
  }
  return mcCalc({
    skill: 'eoq',
    world: 'w2',
    difficulty,
    prompt: 'What is the Economic Order Quantity (EOQ)?',
    given,
    correct: answer,
    format: fmtInt,
    distractors: [
      { value: eoq(s.D, s.S, s.C), mistake: 'unit-cost-as-h' },
      { value: s.rate !== undefined ? eoq(s.D, s.S, s.rate) : eoq(s.D, s.S, s.H) * 1.2, mistake: 'rate-not-h' },
      { value: Math.sqrt((s.D * s.S) / s.H), mistake: 'formula-choice' },
      { value: eoq(s.D, s.H, s.S), mistake: 'formula-choice' },
      { value: answer * 1.35, mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'arithmetic',
    rnd,
  });
}

// ---------------------------------------------------------------------------
// Holding cost from rate
// ---------------------------------------------------------------------------
export function genHoldingCost(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const C = pick(C_POOL, rnd);
  const rate = pick(RATE_POOL, rnd);
  const H = holdingCostFromRate(C, rate);
  const explanation = {
    steps: [`H = holding rate × unit cost`, `H = ${rate} × ${C} = $${fmt2(H)} per unit per year`],
    fastRule: 'A holding RATE is not H until you multiply by unit cost.',
  };
  const visual: Question['visual'] = { kind: 'holding', C, rate };
  const hints: [string, string] = ['The percentage is "of" something.', 'H = rate × C.'];
  const given = [`Unit cost C = ${fmtMoney0(C)}`, `Annual holding cost = ${Math.round(rate * 100)}% of unit cost`];
  if (opts.numeric) {
    return numeric({
      skill: 'holding-cost',
      world: 'w2',
      difficulty,
      prompt: 'What is the annual holding cost per unit, H?',
      given,
      answer: H,
      tolerance: 0.01,
      unit: '$ per unit',
      format: fmt2,
      hints,
      explanation,
      visual,
      mistake: 'rate-not-h',
    });
  }
  return mcCalc({
    skill: 'holding-cost',
    world: 'w2',
    difficulty,
    prompt: 'What value of H should be used in the EOQ formula?',
    given,
    correct: H,
    format: fmtMoney2,
    distractors: [
      { value: C, mistake: 'unit-cost-as-h' },
      { value: rate * 100, mistake: 'rate-not-h' },
      { value: C / rate / 10, mistake: 'arithmetic' },
      { value: C + rate * 100, mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'rate-not-h',
    rnd,
  });
}

// ---------------------------------------------------------------------------
// Orders per year, weekly demand, time between orders
// ---------------------------------------------------------------------------
export function genOrdersPerYear(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const D = pick(D_POOL, rnd);
  const divisors = [50, 100, 120, 150, 200, 240, 250, 300, 400, 500, 600].filter((q) => q < D / 2);
  const Q = pick(divisors, rnd);
  const answer = ordersPerYear(D, Q);
  const explanation = {
    steps: [`Orders per year = D / Q`, `= ${fmtInt(D)} / ${Q} = ${fmt2(answer)}`],
    fastRule: 'D/Q = orders per YEAR. (Q/D)×52 = WEEKS between orders.',
  };
  const visual: Question['visual'] = { kind: 'sawtooth', D, Q, emphasize: 'orders' };
  const hints: [string, string] = ['How many lots of Q fit inside D?', 'Orders per year = D / Q.'];
  const given = [`Annual demand D = ${fmtInt(D)}`, `Order quantity Q = ${Q}`];
  if (opts.numeric) {
    return numeric({
      skill: 'orders-per-year',
      world: 'w2',
      difficulty,
      prompt: 'How many orders are placed per year? (2 decimals)',
      given,
      answer,
      tolerance: 0.02,
      unit: 'orders/year',
      format: fmt2,
      hints,
      explanation,
      visual,
      mistake: 'dq-vs-qd',
    });
  }
  return mcCalc({
    skill: 'orders-per-year',
    world: 'w2',
    difficulty,
    prompt: 'How many orders will the company place per year?',
    given,
    correct: answer,
    format: (v) => (Number.isInteger(v) ? fmtInt(v) : fmt2(v)),
    distractors: [
      { value: weeksBetweenOrders(Q, D), mistake: 'dq-vs-qd' },
      { value: weeklyDemand(D), mistake: 'formula-choice' },
      { value: answer * 2, mistake: 'arithmetic' },
      { value: Q / 52, mistake: 'formula-choice' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'dq-vs-qd',
    rnd,
  });
}

export function genWeeklyDemand(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const weekly = pick([25, 40, 50, 60, 75, 100, 120, 150, 200, 250, 300], rnd);
  const D = weekly * 52;
  const explanation = {
    steps: [`Weekly demand = D / 52`, `= ${fmtInt(D)} / 52 = ${weekly}`],
    fastRule: 'Weekly demand = D / 52.',
  };
  const visual: Question['visual'] = { kind: 'weeks', D };
  const hints: [string, string] = ['How many weeks are in a year?', 'Weekly demand = D / 52.'];
  const given = [`Annual demand D = ${fmtInt(D)} units`];
  if (opts.numeric) {
    return numeric({
      skill: 'weekly-demand',
      world: 'w2',
      difficulty,
      prompt: 'What is the weekly demand?',
      given,
      answer: weekly,
      tolerance: 0.5,
      unit: 'units/week',
      format: fmtInt,
      hints,
      explanation,
      visual,
      mistake: 'formula-choice',
    });
  }
  return mcCalc({
    skill: 'weekly-demand',
    world: 'w2',
    difficulty,
    prompt: 'What is the weekly demand?',
    given,
    correct: weekly,
    format: fmtInt,
    distractors: [
      { value: D / 12, mistake: 'formula-choice' },
      { value: D / 50, mistake: 'arithmetic' },
      { value: D / 365, mistake: 'formula-choice' },
      { value: weekly * 2, mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'formula-choice',
    rnd,
  });
}

export function genTimeBetweenOrders(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const D = pick(D_POOL, rnd);
  const Q = randStep(Math.max(100, D / 30), D / 4, 50, rnd);
  const answer = weeksBetweenOrders(Q, D);
  const explanation = {
    steps: [`Time between orders (weeks) = (Q / D) × 52`, `= (${Q} / ${fmtInt(D)}) × 52 = ${fmt2(answer)} weeks`],
    fastRule: '(Q/D) × 52 = WEEKS between orders. D/Q = orders per year.',
  };
  const visual: Question['visual'] = { kind: 'sawtooth', D, Q, emphasize: 'gap' };
  const hints: [string, string] = ['Q/D is the fraction of a year one order lasts.', 'Weeks between orders = (Q/D) × 52.'];
  const given = [`Annual demand D = ${fmtInt(D)}`, `Order quantity Q = ${Q}`];
  if (opts.numeric) {
    return numeric({
      skill: 'time-between-orders',
      world: 'w2',
      difficulty,
      prompt: 'How many weeks pass between orders? (2 decimals)',
      given,
      answer,
      tolerance: 0.02,
      unit: 'weeks',
      format: fmt2,
      hints,
      explanation,
      visual,
      mistake: 'dq-vs-qd',
    });
  }
  return mcCalc({
    skill: 'time-between-orders',
    world: 'w2',
    difficulty,
    prompt: 'How many weeks occur between inventory orders?',
    given,
    correct: answer,
    format: fmt2,
    distractors: [
      { value: ordersPerYear(D, Q), mistake: 'dq-vs-qd' },
      { value: (Q / D) * 12, mistake: 'arithmetic' },
      { value: Q / 52, mistake: 'formula-choice' },
      { value: answer * 2, mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'dq-vs-qd',
    rnd,
  });
}

// ---------------------------------------------------------------------------
// Cost pieces
// ---------------------------------------------------------------------------
export function genPurchaseCost(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const s = scenario('easy', rnd);
  const answer = purchaseCost(s.D, s.C);
  const explanation = {
    steps: ['Purchase cost = D × C', `= ${fmtInt(s.D)} × ${s.C} = ${fmtMoney0(answer)}`],
    fastRule: 'DC = annual demand × unit cost. Q does not appear.',
  };
  const visual: Question['visual'] = { kind: 'cost-stack', DC: answer };
  const hints: [string, string] = ['How many units bought per year, and at what price each?', 'Purchase cost = D × C.'];
  return mcCalc({
    skill: 'purchase-cost',
    world: 'w2',
    difficulty,
    prompt: 'What is the annual purchase cost (DC)?',
    given: givenLines(s, ['D', 'C', 'Q']),
    correct: answer,
    format: fmtMoney0,
    distractors: [
      { value: s.Q * s.C, mistake: 'formula-choice' },
      { value: s.D * s.H, mistake: 'unit-cost-as-h' },
      { value: (s.D / s.Q) * s.C, mistake: 'formula-choice' },
      { value: answer / 12, mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'formula-choice',
    rnd,
  });
}

export function genAOC(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const s = scenario(difficulty === 'hard' ? 'hard' : 'easy', rnd);
  const answer = annualOrderingCost(s.D, s.Q, s.S);
  const explanation = {
    steps: [
      ...hSteps(s).filter((l) => l.startsWith('S')),
      'AOC = (D / Q) × S',
      `= (${fmtInt(s.D)} / ${s.Q}) × ${s.S} = ${fmt2(s.D / s.Q)} × ${s.S} = ${fmtMoney2(answer)}`,
    ],
    fastRule: 'AOC = orders per year × cost per order.',
  };
  const visual: Question['visual'] = { kind: 'sawtooth', D: s.D, Q: s.Q, S: s.S, emphasize: 'orders' };
  const hints: [string, string] = ['How many orders per year, and what does each cost?', 'AOC = (D/Q) × S.'];
  const given = givenLines(s, ['D', 'S', 'Q']);
  if (opts.numeric) {
    return numeric({
      skill: 'aoc',
      world: 'w2',
      difficulty,
      prompt: 'What is the annual ordering cost (AOC)? (2 decimals)',
      given,
      answer,
      tolerance: Math.max(0.05, answer * 0.002),
      unit: '$',
      format: fmt2,
      hints,
      explanation,
      visual,
    });
  }
  return mcCalc({
    skill: 'aoc',
    world: 'w2',
    difficulty,
    prompt: 'What is the annual ordering cost (AOC)?',
    given,
    correct: answer,
    format: fmtMoney2,
    distractors: [
      { value: annualHoldingCost(s.Q, s.H), mistake: 'formula-choice' },
      { value: (s.Q / s.D) * s.S, mistake: 'dq-vs-qd' },
      { value: s.D * s.S, mistake: 'formula-choice' },
      { value: answer * 2, mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'formula-choice',
    rnd,
  });
}

export function genAHC(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const s = scenario(difficulty, rnd);
  const answer = annualHoldingCost(s.Q, s.H);
  const explanation = {
    steps: [...hSteps(s).filter((l) => l.startsWith('H')), 'AHC = (Q / 2) × H', `= (${s.Q} / 2) × ${fmt2(s.H)} = ${fmtMoney2(answer)}`],
    fastRule: 'AHC = average inventory (Q/2) × H.',
  };
  const visual: Question['visual'] = { kind: 'sawtooth', D: s.D, Q: s.Q, H: s.H, emphasize: 'average' };
  const hints: [string, string] = ['Average inventory is half the order size.', 'AHC = (Q/2) × H' + (s.rate !== undefined ? ', with H = rate × C.' : '.')];
  const given = givenLines(s, difficulty === 'easy' ? ['Q', 'H'] : ['C', 'Q', 'H']);
  if (opts.numeric) {
    return numeric({
      skill: 'ahc',
      world: 'w2',
      difficulty,
      prompt: 'What is the annual holding cost (AHC)? (2 decimals)',
      given,
      answer,
      tolerance: Math.max(0.05, answer * 0.002),
      unit: '$',
      format: fmt2,
      hints,
      explanation,
      visual,
      mistake: s.rate !== undefined ? 'rate-not-h' : 'arithmetic',
    });
  }
  return mcCalc({
    skill: 'ahc',
    world: 'w2',
    difficulty,
    prompt: 'What is the annual holding cost (AHC)?',
    given,
    correct: answer,
    format: fmtMoney2,
    distractors: [
      { value: s.Q * s.H, mistake: 'formula-choice' },
      { value: (s.Q / 2) * s.C, mistake: 'unit-cost-as-h' },
      { value: s.rate !== undefined ? (s.Q / 2) * s.rate : answer / 2, mistake: 'rate-not-h' },
      { value: answer * 1.5, mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'formula-choice',
    rnd,
  });
}

export function genTotalCost(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'medium';
  const s = scenario(difficulty, rnd);
  const dc = purchaseCost(s.D, s.C);
  const aoc = annualOrderingCost(s.D, s.Q, s.S);
  const ahc = annualHoldingCost(s.Q, s.H);
  const answer = totalCost(s.D, s.C, s.Q, s.S, s.H);
  const explanation = {
    steps: [
      ...hSteps(s),
      `Purchase cost DC = ${fmtInt(s.D)} × ${s.C} = ${fmtMoney2(dc)}`,
      `AOC = (${fmtInt(s.D)}/${s.Q}) × ${s.S} = ${fmtMoney2(aoc)}`,
      `AHC = (${s.Q}/2) × ${fmt2(s.H)} = ${fmtMoney2(ahc)}`,
      `TC = ${fmtMoney2(dc)} + ${fmtMoney2(aoc)} + ${fmtMoney2(ahc)} = ${fmtMoney2(answer)}`,
    ],
    fastRule: 'TC = DC + AOC + AHC. Three pieces, do not drop DC.',
  };
  const visual: Question['visual'] = { kind: 'cost-stack', DC: dc, AOC: aoc, AHC: ahc, Q: s.Q };
  const hints: [string, string] = ['Total cost has THREE pieces.', 'TC = DC + (D/Q)S + (Q/2)H.'];
  const given = givenLines(s, ['D', 'C', 'S', 'H', 'Q']);
  if (opts.numeric) {
    return numeric({
      skill: 'total-cost',
      world: 'w2',
      difficulty,
      prompt: 'What is the total annual inventory cost (TC)? (2 decimals)',
      given,
      answer,
      tolerance: Math.max(0.5, answer * 0.001),
      unit: '$',
      format: fmt2,
      hints,
      explanation,
      visual,
    });
  }
  return mcCalc({
    skill: 'total-cost',
    world: 'w2',
    difficulty,
    prompt: 'What is the total annual inventory cost (TC) at the current order quantity?',
    given,
    correct: answer,
    format: fmtMoney2,
    distractors: [
      { value: aoc + ahc, mistake: 'formula-choice' },
      { value: dc + aoc, mistake: 'formula-choice' },
      { value: dc + ahc, mistake: 'formula-choice' },
      { value: dc + aoc + (s.Q / 2) * s.C, mistake: 'unit-cost-as-h' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'formula-choice',
    rnd,
  });
}

// ---------------------------------------------------------------------------
// Pipeline inventory
// ---------------------------------------------------------------------------
export function genPipeline(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const d = pick([40, 50, 75, 100, 120, 150, 200, 250, 300], rnd);
  const L = pick([1, 2, 3, 4, 5, 6], rnd);
  const answer = pipelineInventory(d, L);
  const explanation = {
    steps: ['Pipeline = d × L', `= ${d} × ${L} = ${answer} units`],
    fastRule: 'Pipeline = demand rate × lead time (same time units).',
  };
  const visual: Question['visual'] = { kind: 'pipeline', d, L };
  const hints: [string, string] = ['How much is ordered during the time an order is traveling?', 'Pipeline = d × L.'];
  const given = [`Demand rate d = ${d} units per week`, `Lead time L = ${L} weeks`];
  if (opts.numeric) {
    return numeric({
      skill: 'pipeline',
      world: 'w2',
      difficulty,
      prompt: 'How many units are in the pipeline?',
      given,
      answer,
      tolerance: 0.5,
      unit: 'units',
      format: fmtInt,
      hints,
      explanation,
      visual,
      mistake: 'formula-choice',
    });
  }
  return mcCalc({
    skill: 'pipeline',
    world: 'w2',
    difficulty,
    prompt: 'What is the pipeline inventory?',
    given,
    correct: answer,
    format: fmtInt,
    distractors: [
      { value: d / L, mistake: 'formula-choice' },
      { value: d + L, mistake: 'formula-choice' },
      { value: d * 52, mistake: 'formula-choice' },
      { value: answer * 2, mistake: 'arithmetic' },
    ],
    hints,
    explanation,
    visual,
    defaultMistake: 'formula-choice',
    rnd,
  });
}

// ---------------------------------------------------------------------------
// EOQ intuition (balance scale)
// ---------------------------------------------------------------------------
export function genEoqIntuition(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const Q = pick([200, 250, 300, 400, 500, 600, 800, 1000, 1200], rnd);
  const base = pick([10000, 20000, 25000, 30000, 40000, 50000, 60000], rnd);
  const mode = pick(['less', 'greater', 'equal', 'less', 'greater'] as const, rnd);
  let AHC = base;
  let AOC = base;
  if (mode === 'less') AHC = base * pick([1.5, 2, 2.5, 3], rnd);
  if (mode === 'greater') AOC = base * pick([1.5, 2, 2.5, 3], rnd);
  const dir = eoqDirection(AHC, AOC);
  const statements = {
    less: `The company’s EOQ is less than ${Q}`,
    greater: `The company’s EOQ is greater than ${Q}`,
    equal: `The company’s EOQ equals ${Q}`,
  };
  const why =
    dir === 'equal'
      ? ['AHC = AOC, so the current Q is exactly at EOQ.']
      : dir === 'less'
        ? [`AHC (${fmtMoney0(AHC)}) > AOC (${fmtMoney0(AOC)}): holding cost is too high.`, 'Too much holding means Q is too LARGE, so EOQ is smaller than the current Q.']
        : [`AOC (${fmtMoney0(AOC)}) > AHC (${fmtMoney0(AHC)}): ordering cost is too high.`, 'Too much ordering means Q is too SMALL, so EOQ is larger than the current Q.'];
  return mcText({
    skill: 'eoq-intuition',
    world: 'w2',
    difficulty,
    prompt: 'Based on the current costs, which statement is correct?',
    given: [`Annual holding cost AHC = ${fmtMoney0(AHC)}`, `Annual ordering cost AOC = ${fmtMoney0(AOC)}`, `Current order quantity Q = ${Q}`],
    correct: statements[dir],
    wrong: [
      { label: statements[dir === 'less' ? 'greater' : 'less'], mistake: 'eoq-direction' },
      { label: statements[dir === 'equal' ? 'greater' : 'equal'], mistake: 'eoq-direction' },
      { label: 'Not enough information to compare EOQ with the current Q', mistake: 'eoq-direction' },
    ],
    visual: { kind: 'balance', AHC, AOC, Q },
    hints: ['At EOQ the two costs are equal. Which one is heavier right now?', 'AHC > AOC → Q too big → EOQ smaller. AOC > AHC → Q too small → EOQ larger.'],
    explanation: { steps: why, fastRule: 'Heavy holding → shrink Q. Heavy ordering → grow Q.', memoryTrick: 'Big pile costs more to hold.' },
    defaultMistake: 'eoq-direction',
    isCalc: false,
    rnd,
  });
}

// ---------------------------------------------------------------------------
// Ordering restrictions (practical Q*)
// ---------------------------------------------------------------------------
export function genOrderingRestrictions(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'medium';
  const s = scenario('easy', rnd);
  const increment = pick([50, 100, 100, 200, 250], rnd);
  let e = eoq(s.D, s.S, s.H);
  // Ensure EOQ is not itself a permitted quantity (otherwise the question is trivial).
  let guard = 0;
  while (Math.abs(e / increment - Math.round(e / increment)) < 0.05 && guard++ < 5) {
    s.S = pick(S_POOL, rnd);
    e = eoq(s.D, s.S, s.H);
  }
  const { below, above } = practicalQuantities(e, increment);
  const tcBelow = totalCost(s.D, s.C, below, s.S, s.H);
  const tcAbove = totalCost(s.D, s.C, above, s.S, s.H);
  const best = tcBelow <= tcAbove ? below : above;
  const other = best === below ? above : below;
  const explanation = {
    steps: [
      `EOQ = √(2 × ${fmtInt(s.D)} × ${s.S} / ${s.H}) ≈ ${fmt2(e)} — not a multiple of ${increment}.`,
      `Nearest permitted quantities: ${below} and ${above}.`,
      `AOC + AHC at ${below}: ${fmtMoney2(annualOrderingCost(s.D, below, s.S) + annualHoldingCost(below, s.H))}`,
      `AOC + AHC at ${above}: ${fmtMoney2(annualOrderingCost(s.D, above, s.S) + annualHoldingCost(above, s.H))}`,
      `Lower cost → Q* = ${best}.`,
    ],
    fastRule: 'Q* obeys the supplier rule, stays near EOQ, and has the lower total cost.',
  };
  return mcCalc({
    skill: 'ordering-restrictions',
    world: 'w2',
    difficulty,
    prompt: `The supplier only accepts orders in increments of ${increment}. Which practical order quantity Q* should the company use?`,
    given: givenLines(s, ['D', 'C', 'S', 'H']),
    correct: best,
    format: fmtInt,
    distractors: [
      { value: other, mistake: 'arithmetic' },
      { value: Math.round(e), mistake: 'formula-choice' },
      { value: best + increment * 2, mistake: 'arithmetic' },
      { value: Math.max(increment, best - increment * 2), mistake: 'arithmetic' },
    ],
    visual: { kind: 'eoq-curve', D: s.D, S: s.S, H: s.H, Q: best, marks: [below, above] },
    hints: ['First find EOQ, then look at the permitted quantities on each side.', 'Compare AOC + AHC at the two nearest permitted quantities.'],
    explanation,
    defaultMistake: 'formula-choice',
    rnd,
  });
}

/** Random mix of World 2 calculation questions. */
export function genInventoryRandom(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const gens = [
    genEoq,
    genEoq,
    genHoldingCost,
    genOrdersPerYear,
    genWeeklyDemand,
    genTimeBetweenOrders,
    genPurchaseCost,
    genAOC,
    genAHC,
    genTotalCost,
    genPipeline,
    genEoqIntuition,
    genEoqIntuition,
    genOrderingRestrictions,
  ];
  const g = gens[randInt(0, gens.length - 1, rnd)];
  return g(opts);
}
