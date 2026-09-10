import type { Question } from '@/types';
import {
  annualHoldingCost,
  annualOrderingCost,
  cycleTimeCourse,
  cycleTimeRaw,
  efficiency,
  eoq,
  holdingCostFromRate,
  idleTime,
  ordersPerYear,
  purchaseCost,
  theoreticalMin,
  totalCost,
  weeklyDemand,
  weeksBetweenOrders,
} from '@/utils/calc';
import { defaultRng, type Rng } from '@/utils/random';
import { fmt2, fmtInt, fmtMoney2, mcCalc, mcText } from '@/generators/common';
import { fixedLab2Layout, fixedLab2NotAcceptableADJ, fixedLab2NotAcceptableBF } from '@/generators/precedence';
import { effectiveCTFromList } from '@/generators/lineBalancing';

export interface BossStage {
  title: string;
  intro: string[];
  questions: Question[];
}

// ---------------------------------------------------------------------------
// BUCKSHOT ELECTRONICS — EOQ course lab boss
// ---------------------------------------------------------------------------
export const BUCKSHOT = {
  D: 7800,
  C: 175,
  rate: 0.35,
  H: holdingCostFromRate(175, 0.35), // 61.25
  S: 250 + 125 + 25 + 25 + 50, // 475
  Q: 900,
  increment: 100,
};

export function buckshotBoss(rnd: Rng = defaultRng): BossStage[] {
  const { D, C, H, S, Q } = BUCKSHOT;
  const given = [
    'Annual demand = 7,800 cellphones',
    'Wholesale price = $175 each',
    'Holding cost = 35% of wholesale price per year',
    'Per order: placement $250, delivery $125, packaging $25, receiving $25, labor $50',
    'Present lot size = 900',
    'Supplier rule: order in increments of 100',
  ];
  const e = eoq(D, S, H);
  const tcQ = totalCost(D, C, Q, S, H);
  const tc300 = totalCost(D, C, 300, S, H);

  return [
    {
      title: 'Stage 1 · Gather the inputs',
      intro: ['Buckshot Electronics sells cellphones.', 'Before any formula, pin down D, C, H and S.'],
      questions: [
        mcCalc({
          skill: 'holding-cost', world: 'w2', difficulty: 'medium',
          prompt: 'What is the annual holding cost per unit, H?', given,
          correct: H, format: fmtMoney2,
          distractors: [{ value: C, mistake: 'unit-cost-as-h' }, { value: 35, mistake: 'rate-not-h' }, { value: 0.35, mistake: 'rate-not-h' }],
          visual: { kind: 'holding', C: 175, rate: 0.35 },
          hints: ['35% of what?', 'H = 0.35 × 175.'],
          explanation: { steps: ['H = 0.35 × $175 = $61.25 per unit per year'], fastRule: 'Holding rate × unit cost = H.' },
          defaultMistake: 'rate-not-h', rnd,
        }),
        mcCalc({
          skill: 'aoc', world: 'w2', difficulty: 'medium',
          prompt: 'What is the ordering cost per order, S?', given,
          correct: S, format: fmtMoney2,
          distractors: [{ value: 250, mistake: 'formula-choice' }, { value: 425, mistake: 'arithmetic' }, { value: 375, mistake: 'arithmetic' }],
          hints: ['Every cost that happens once per order is part of S.', 'Add: 250 + 125 + 25 + 25 + 50.'],
          explanation: { steps: ['S = 250 + 125 + 25 + 25 + 50 = $475'], fastRule: 'S = everything you pay each time you order.' },
          defaultMistake: 'arithmetic', rnd,
        }),
      ],
    },
    {
      title: 'Stage 2 · The rhythm',
      intro: ['How fast do phones sell, and how often does Buckshot order today?'],
      questions: [
        mcCalc({
          skill: 'weekly-demand', world: 'w2', difficulty: 'easy',
          prompt: 'What is the weekly demand?', given: ['D = 7,800 per year'],
          correct: weeklyDemand(D), format: fmtInt,
          distractors: [{ value: D / 12, mistake: 'formula-choice' }, { value: D / 50, mistake: 'arithmetic' }, { value: D / 365, mistake: 'formula-choice' }],
          visual: { kind: 'weeks', D: 7800 },
          hints: ['52 weeks in a year.', 'Weekly = D / 52.'],
          explanation: { steps: ['7,800 / 52 = 150 per week'], fastRule: 'Weekly demand = D / 52.' },
          defaultMistake: 'formula-choice', rnd,
        }),
        mcCalc({
          skill: 'orders-per-year', world: 'w2', difficulty: 'easy',
          prompt: 'At the present lot size of 900, how many orders per year does Buckshot place?', given: ['D = 7,800', 'Q = 900'],
          correct: ordersPerYear(D, Q), format: fmt2,
          distractors: [{ value: weeksBetweenOrders(Q, D), mistake: 'dq-vs-qd' }, { value: 12, mistake: 'formula-choice' }, { value: 150, mistake: 'formula-choice' }],
          visual: { kind: 'sawtooth', D: 7800, Q: 900, emphasize: 'orders' },
          hints: ['How many 900s fit in 7,800?', 'Orders per year = D / Q.'],
          explanation: { steps: ['7,800 / 900 = 8.67 orders per year'], fastRule: 'D/Q = orders per year.' },
          defaultMistake: 'dq-vs-qd', rnd,
        }),
      ],
    },
    {
      title: 'Stage 3 · Cost at Q = 900',
      intro: ['Break total cost into three pieces: DC, AOC, AHC.'],
      questions: [
        mcCalc({
          skill: 'purchase-cost', world: 'w2', difficulty: 'easy',
          prompt: 'What is the annual purchase cost (DC)?', given: ['D = 7,800', 'C = $175'],
          correct: purchaseCost(D, C), format: fmtMoney2,
          distractors: [{ value: Q * C, mistake: 'formula-choice' }, { value: D * H, mistake: 'unit-cost-as-h' }, { value: 1365000 / 12, mistake: 'arithmetic' }],
          visual: { kind: 'cost-stack', DC: 1365000 },
          hints: ['Units per year × price each.', 'DC = 7,800 × 175.'],
          explanation: { steps: ['DC = 7,800 × $175 = $1,365,000'], fastRule: 'Purchase cost = D × C.' },
          defaultMistake: 'formula-choice', rnd,
        }),
        mcCalc({
          skill: 'aoc', world: 'w2', difficulty: 'medium',
          prompt: 'What is the annual ordering cost (AOC) at Q = 900?', given: ['D = 7,800', 'Q = 900', 'S = $475'],
          correct: annualOrderingCost(D, Q, S), format: fmtMoney2,
          distractors: [{ value: annualHoldingCost(Q, H), mistake: 'formula-choice' }, { value: 475 * 12, mistake: 'arithmetic' }, { value: (Q / D) * S, mistake: 'dq-vs-qd' }],
          visual: { kind: 'sawtooth', D: 7800, Q: 900, S: 475, emphasize: 'orders' },
          hints: ['Orders per year × cost per order.', 'AOC = (7,800 / 900) × 475.'],
          explanation: { steps: ['AOC = (7,800 / 900) × 475 = 8.667 × 475 ≈ $4,116.67'], fastRule: 'AOC = (D/Q) × S.' },
          defaultMistake: 'formula-choice', rnd,
        }),
        mcCalc({
          skill: 'ahc', world: 'w2', difficulty: 'medium',
          prompt: 'What is the annual holding cost (AHC) at Q = 900?', given: ['Q = 900', 'H = $61.25'],
          correct: annualHoldingCost(Q, H), format: fmtMoney2,
          distractors: [{ value: Q * H, mistake: 'formula-choice' }, { value: (Q / 2) * C, mistake: 'unit-cost-as-h' }, { value: (Q / 2) * 0.35, mistake: 'rate-not-h' }],
          visual: { kind: 'sawtooth', D: 7800, Q: 900, H: 61.25, emphasize: 'average' },
          hints: ['Average inventory is half of Q.', 'AHC = (900 / 2) × 61.25.'],
          explanation: { steps: ['AHC = (900 / 2) × 61.25 = 450 × 61.25 = $27,562.50'], fastRule: 'AHC = (Q/2) × H.' },
          defaultMistake: 'formula-choice', rnd,
        }),
        mcCalc({
          skill: 'total-cost', world: 'w2', difficulty: 'hard',
          prompt: 'What is the total annual cost (TC) at Q = 900?', given: ['DC = $1,365,000', 'AOC ≈ $4,116.67', 'AHC = $27,562.50'],
          correct: tcQ, format: fmtMoney2,
          distractors: [{ value: tcQ - purchaseCost(D, C), mistake: 'formula-choice' }, { value: purchaseCost(D, C) + annualHoldingCost(Q, H), mistake: 'formula-choice' }, { value: purchaseCost(D, C) + annualOrderingCost(D, Q, S), mistake: 'formula-choice' }],
          visual: { kind: 'cost-stack', DC: 1365000, AOC: annualOrderingCost(D, Q, S), AHC: annualHoldingCost(Q, H), Q: 900 },
          hints: ['Three pieces.', 'TC = DC + AOC + AHC.'],
          explanation: { steps: ['TC = 1,365,000 + 4,116.67 + 27,562.50 ≈ $1,396,679.17'], fastRule: 'TC = DC + AOC + AHC.' },
          defaultMistake: 'formula-choice', rnd,
        }),
      ],
    },
    {
      title: 'Stage 4 · Find the EOQ',
      intro: ['Now compute the order size that balances ordering and holding.'],
      questions: [
        mcCalc({
          skill: 'eoq', world: 'w2', difficulty: 'hard',
          prompt: 'What is the EOQ (nearest whole unit)?', given: ['D = 7,800', 'S = $475', 'H = $61.25'],
          correct: Math.round(e), format: fmtInt,
          distractors: [{ value: Math.round(eoq(D, S, C)), mistake: 'unit-cost-as-h' }, { value: Math.round(eoq(D, S, 0.35)), mistake: 'rate-not-h' }, { value: Math.round(Math.sqrt((D * S) / H)), mistake: 'formula-choice' }],
          visual: { kind: 'eoq-curve', D: 7800, S: 475, H: 61.25, Q: 900 },
          hints: ['EOQ needs D, S and H — not Q.', 'EOQ = √(2 × 7,800 × 475 / 61.25).'],
          explanation: { steps: ['EOQ = √(2 × 7,800 × 475 / 61.25) = √(120,979.6) ≈ 347.82 → 348'], fastRule: 'EOQ = √(2DS/H).' },
          defaultMistake: 'arithmetic', rnd,
        }),
        mcCalc({
          skill: 'time-between-orders', world: 'w2', difficulty: 'medium',
          prompt: 'If Buckshot ordered EOQ-sized lots of 348, how many weeks would pass between orders?', given: ['Q = 348', 'D = 7,800'],
          correct: weeksBetweenOrders(348, D), format: fmt2,
          distractors: [{ value: ordersPerYear(D, 348), mistake: 'dq-vs-qd' }, { value: 348 / 52, mistake: 'formula-choice' }, { value: (348 / D) * 12, mistake: 'arithmetic' }],
          visual: { kind: 'sawtooth', D: 7800, Q: 348, emphasize: 'gap' },
          hints: ['Fraction of a year per order, then weeks.', '(Q/D) × 52.'],
          explanation: { steps: ['(348 / 7,800) × 52 ≈ 2.32 weeks'], fastRule: '(Q/D) × 52 = weeks between orders.' },
          defaultMistake: 'dq-vs-qd', rnd,
        }),
      ],
    },
    {
      title: 'Stage 5 · The supplier rule',
      intro: ['Phones must be ordered in increments of 100.', '348 is not allowed. Find the best practical Q*.'],
      questions: [
        mcCalc({
          skill: 'ordering-restrictions', world: 'w2', difficulty: 'medium',
          prompt: 'Weekly demand is 150. If Buckshot orders every 3 weeks, what is the minimum permitted order and how many extra units does that create?',
          given: ['3 weeks of demand = 150 × 3', 'Orders must be increments of 100'],
          correct: 50, format: (v) => `Order 500, extra ${fmtInt(v)}`,
          distractors: [{ value: 0, mistake: 'arithmetic' }, { value: 150, mistake: 'arithmetic' }, { value: 100, mistake: 'arithmetic' }],
          hints: ['3 weeks × 150 = 450. Round up to the next permitted quantity.', '500 − 450 = extra units.'],
          explanation: { steps: ['3 weeks demand = 450', 'Minimum permitted order = 500', 'Extra = 500 − 450 = 50'], fastRule: 'Round up to the supplier increment, then subtract demand.' },
          defaultMistake: 'arithmetic', rnd,
        }),
        mcText({
          skill: 'ordering-restrictions', world: 'w2', difficulty: 'hard',
          prompt: 'Which practical ordering plan is most attractive for Buckshot?',
          given: ['EOQ ≈ 348 (not permitted)', '2 weeks demand = 300 → permitted, extra 0', '3 weeks demand = 450 → must order 500, extra 50'],
          correct: '300 units every 2 weeks',
          wrong: [{ label: '500 units every 3 weeks', mistake: 'arithmetic' }, { label: '348 units every 2.32 weeks', mistake: 'formula-choice' }, { label: '900 units every 6 weeks', mistake: 'arithmetic' }],
          visual: { kind: 'eoq-curve', D: 7800, S: 475, H: 61.25, Q: 300, marks: [300, 400] },
          hints: ['Which option obeys the rule AND creates no extra inventory?', '300 is close to 348 and is a multiple of 100.'],
          explanation: { steps: ['300 obeys the increment rule, stays close to EOQ, exactly meets 2 weeks of demand, and adds no extra units.'], fastRule: 'Q* = permitted, near EOQ, no waste.' },
          defaultMistake: 'formula-choice', isCalc: true, rnd,
        }),
      ],
    },
    {
      title: 'Stage 6 · Prove the savings',
      intro: ['Recompute costs at Q* = 300 and compare to Q = 900.'],
      questions: [
        mcCalc({
          skill: 'ahc', world: 'w2', difficulty: 'medium',
          prompt: 'What is AHC at Q* = 300?', given: ['Q = 300', 'H = $61.25'],
          correct: annualHoldingCost(300, H), format: fmtMoney2,
          distractors: [{ value: 300 * H, mistake: 'formula-choice' }, { value: annualHoldingCost(Q, H), mistake: 'arithmetic' }, { value: 150 * C, mistake: 'unit-cost-as-h' }],
          visual: { kind: 'sawtooth', D: 7800, Q: 300, H: 61.25, emphasize: 'average' },
          hints: ['Half of 300 is 150.', '(300/2) × 61.25.'],
          explanation: { steps: ['(300 / 2) × 61.25 = $9,187.50'], fastRule: 'AHC = (Q/2) × H.' },
          defaultMistake: 'formula-choice', rnd,
        }),
        mcCalc({
          skill: 'aoc', world: 'w2', difficulty: 'medium',
          prompt: 'What is AOC at Q* = 300?', given: ['D = 7,800', 'Q = 300', 'S = $475'],
          correct: annualOrderingCost(D, 300, S), format: fmtMoney2,
          distractors: [{ value: annualOrderingCost(D, Q, S), mistake: 'arithmetic' }, { value: (300 / D) * S, mistake: 'dq-vs-qd' }, { value: 26 * 475 / 2, mistake: 'arithmetic' }],
          visual: { kind: 'sawtooth', D: 7800, Q: 300, S: 475, emphasize: 'orders' },
          hints: ['7,800 / 300 = 26 orders.', '26 × 475.'],
          explanation: { steps: ['(7,800 / 300) × 475 = 26 × 475 = $12,350'], fastRule: 'AOC = (D/Q) × S.' },
          defaultMistake: 'formula-choice', rnd,
        }),
        mcCalc({
          skill: 'total-cost', world: 'w2', difficulty: 'hard',
          prompt: 'What is the total annual cost at Q* = 300?', given: ['DC = $1,365,000', 'AHC = $9,187.50', 'AOC = $12,350'],
          correct: tc300, format: fmtMoney2,
          distractors: [{ value: tc300 - purchaseCost(D, C), mistake: 'formula-choice' }, { value: tcQ, mistake: 'arithmetic' }, { value: purchaseCost(D, C) + 12350, mistake: 'formula-choice' }],
          visual: { kind: 'cost-stack', DC: 1365000, AOC: 12350, AHC: 9187.5, Q: 300 },
          hints: ['Add the three pieces.', '1,365,000 + 9,187.50 + 12,350.'],
          explanation: { steps: ['TC = 1,365,000 + 9,187.50 + 12,350 = $1,386,537.50'], fastRule: 'TC = DC + AOC + AHC.' },
          defaultMistake: 'formula-choice', rnd,
        }),
        mcCalc({
          skill: 'total-cost', world: 'w2', difficulty: 'hard',
          prompt: 'How much does Buckshot save per year by switching from Q = 900 to Q* = 300?', given: ['TC at 900 ≈ $1,396,679.17', 'TC at 300 = $1,386,537.50'],
          correct: Math.round(tcQ - tc300), format: (v) => `≈ $${fmtInt(v)}`,
          distractors: [{ value: Math.round(annualHoldingCost(Q, H) - annualHoldingCost(300, H)), mistake: 'formula-choice' }, { value: Math.round(annualOrderingCost(D, 300, S) - annualOrderingCost(D, Q, S)), mistake: 'formula-choice' }, { value: 20000, mistake: 'arithmetic' }],
          hints: ['Subtract the two totals.', '1,396,679.17 − 1,386,537.50.'],
          explanation: { steps: ['1,396,679.17 − 1,386,537.50 ≈ $10,142 saved per year'], fastRule: 'Savings = TC(old) − TC(new).' },
          defaultMistake: 'arithmetic', rnd,
        }),
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// SCM LAB 2 — line balancing boss
// ---------------------------------------------------------------------------
export function lab2Boss(rnd: Rng = defaultRng): BossStage[] {
  const monthly = 8140;
  const days = 22;
  const D = monthly / days; // 370
  const OT = 28800;
  const raw = cycleTimeRaw(OT, D);
  const c = cycleTimeCourse(OT, D); // 77
  const t = 537;
  return [
    {
      title: 'Stage 1 · Cycle time',
      intro: ['Monthly demand 8,140. 22 working days. The factory runs 8 hours a day.'],
      questions: [
        mcCalc({
          skill: 'cycle-time', world: 'w3', difficulty: 'medium',
          prompt: 'What is the daily demand?', given: ['Monthly demand = 8,140', 'Working days per month = 22'],
          correct: D, format: fmtInt,
          distractors: [{ value: monthly / 30, mistake: 'arithmetic' }, { value: monthly / 20, mistake: 'arithmetic' }, { value: monthly / 12, mistake: 'formula-choice' }],
          hints: ['Divide by the number of working days.', '8,140 / 22.'],
          explanation: { steps: ['8,140 / 22 = 370 units per day'], fastRule: 'Daily demand = monthly ÷ working days.' },
          defaultMistake: 'arithmetic', rnd,
        }),
        mcCalc({
          skill: 'cycle-time', world: 'w3', difficulty: 'medium',
          prompt: 'What cycle time should be used (course rule)?', given: ['8 hours per day = 28,800 seconds', 'Daily demand = 370'],
          correct: c, format: fmtInt,
          distractors: [{ value: Math.ceil(raw), mistake: 'ct-round-up' }, { value: 80, mistake: 'ct-round-up' }, { value: 70, mistake: 'arithmetic' }],
          visual: { kind: 'day-split', OT: 28800, D: 370 },
          hints: ['28,800 / 370 = 77.84.', 'Never round cycle time up.'],
          explanation: { steps: ['28,800 / 370 = 77.84', 'Never round up → CT = 77'], fastRule: 'CYCLE TIME → NEVER ROUND UP.' },
          defaultMistake: 'ct-round-up', rnd,
        }),
      ],
    },
    {
      title: 'Stage 2 · Theoretical minimum',
      intro: ['Total task time is 537 seconds.'],
      questions: [
        mcCalc({
          skill: 'theoretical-min', world: 'w3', difficulty: 'medium',
          prompt: 'What is the theoretical minimum number of workstations?', given: ['t = 537 sec', 'c = 77 sec'],
          correct: theoreticalMin(t, c), format: fmtInt,
          distractors: [{ value: 6, mistake: 'ws-round-down' }, { value: 8, mistake: 'arithmetic' }, { value: 9, mistake: 'arithmetic' }],
          visual: { kind: 'rounding', value: 537 / 77, mode: 'up' },
          hints: ['537 / 77 = 6.97.', 'Always round workstations up.'],
          explanation: { steps: ['537 / 77 ≈ 6.974', 'Round up → 7 stations'], fastRule: 'WORKSTATIONS → ALWAYS ROUND UP.' },
          defaultMistake: 'ws-round-down', rnd,
        }),
        mcCalc({
          skill: 'efficiency', world: 'w3', difficulty: 'medium',
          prompt: 'What is the efficiency with 7 workstations? (decimal)', given: ['t = 537', 'n = 7', 'c = 77'],
          correct: efficiency(t, 7, c), format: (v) => v.toFixed(3),
          distractors: [{ value: efficiency(t, 8, c), mistake: 'arithmetic' }, { value: efficiency(t, 6, c) > 1 ? 0.9 : efficiency(t, 6, c), mistake: 'arithmetic' }, { value: 0.5, mistake: 'arithmetic' }],
          visual: { kind: 'station-bars', t: 537, n: 7, c: 77 },
          hints: ['Capacity = 7 × 77 = 539.', '537 / 539.'],
          explanation: { steps: ['537 / (7 × 77) = 537 / 539 ≈ 0.996'], fastRule: 'Efficiency = t / (nc).' },
          defaultMistake: 'formula-choice', rnd,
        }),
        mcCalc({
          skill: 'idle-time', world: 'w3', difficulty: 'medium',
          prompt: 'What is the idle time with 7 workstations?', given: ['t = 537', 'n = 7', 'c = 77'],
          correct: idleTime(t, 7, c), format: fmtInt,
          distractors: [{ value: 79, mistake: 'arithmetic' }, { value: 539, mistake: 'formula-choice' }, { value: 77, mistake: 'arithmetic' }],
          visual: { kind: 'station-bars', t: 537, n: 7, c: 77 },
          hints: ['Capacity minus work.', '539 − 537.'],
          explanation: { steps: ['7 × 77 = 539', '539 − 537 = 2 seconds idle'], fastRule: 'Idle = nc − t.' },
          defaultMistake: 'formula-choice', rnd,
        }),
      ],
    },
    {
      title: 'Stage 3 · Bigger lines',
      intro: ['The real line ended up with more stations than the theoretical minimum.'],
      questions: [
        mcCalc({
          skill: 'efficiency', world: 'w3', difficulty: 'medium',
          prompt: 'If the line has 10 workstations, what is its efficiency? (decimal)', given: ['t = 537', 'n = 10', 'c = 77'],
          correct: efficiency(t, 10, c), format: (v) => v.toFixed(3),
          distractors: [{ value: efficiency(t, 9, c), mistake: 'arithmetic' }, { value: efficiency(t, 7, c), mistake: 'arithmetic' }, { value: 0.303, mistake: 'formula-choice' }],
          visual: { kind: 'station-bars', t: 537, n: 10, c: 77 },
          hints: ['10 × 77 = 770.', '537 / 770.'],
          explanation: { steps: ['537 / (10 × 77) = 537 / 770 ≈ 0.697'], fastRule: 'Efficiency = t / (nc).' },
          defaultMistake: 'formula-choice', rnd,
        }),
        mcCalc({
          skill: 'idle-time', world: 'w3', difficulty: 'medium',
          prompt: 'What is the idle time with 10 workstations?', given: ['t = 537', 'n = 10', 'c = 77'],
          correct: idleTime(t, 10, c), format: fmtInt,
          distractors: [{ value: idleTime(t, 9, c), mistake: 'arithmetic' }, { value: 770, mistake: 'formula-choice' }, { value: 310, mistake: 'arithmetic' }],
          visual: { kind: 'station-bars', t: 537, n: 10, c: 77 },
          hints: ['Capacity = 770.', '770 − 537.'],
          explanation: { steps: ['10 × 77 = 770', '770 − 537 = 233 seconds'], fastRule: 'Idle = nc − t.' },
          defaultMistake: 'formula-choice', rnd,
        }),
        mcCalc({
          skill: 'idle-time', world: 'w3', difficulty: 'medium',
          prompt: 'With 9 workstations, what is the idle time?', given: ['t = 537', 'n = 9', 'c = 77'],
          correct: idleTime(t, 9, c), format: fmtInt,
          distractors: [{ value: idleTime(t, 10, c), mistake: 'arithmetic' }, { value: 693, mistake: 'formula-choice' }, { value: 79, mistake: 'arithmetic' }],
          visual: { kind: 'station-bars', t: 537, n: 9, c: 77 },
          hints: ['9 × 77 = 693.', '693 − 537.'],
          explanation: { steps: ['9 × 77 = 693', '693 − 537 = 156 seconds'], fastRule: 'Idle = nc − t.' },
          defaultMistake: 'formula-choice', rnd,
        }),
        mcCalc({
          skill: 'efficiency', world: 'w3', difficulty: 'medium',
          prompt: 'With 9 workstations, what is the efficiency? (decimal)', given: ['t = 537', 'n = 9', 'c = 77'],
          correct: efficiency(t, 9, c), format: (v) => v.toFixed(3),
          distractors: [{ value: efficiency(t, 10, c), mistake: 'arithmetic' }, { value: efficiency(t, 8, c), mistake: 'arithmetic' }, { value: 0.225, mistake: 'formula-choice' }],
          visual: { kind: 'station-bars', t: 537, n: 9, c: 77 },
          hints: ['537 / 693.', 'Efficiency = t / (nc).'],
          explanation: { steps: ['537 / 693 ≈ 0.775'], fastRule: 'Efficiency = t / (nc).' },
          defaultMistake: 'formula-choice', rnd,
        }),
      ],
    },
    {
      title: 'Stage 4 · Judge the layouts',
      intro: ['Three proposed layouts. Cycle time 77. Check time AND precedence.'],
      questions: [fixedLab2Layout('A', rnd), fixedLab2Layout('B', rnd), fixedLab2Layout('C', rnd)],
    },
    {
      title: 'Stage 5 · Effective cycle time',
      intro: ['Given a line that already exists, how fast does it really run?'],
      questions: [
        effectiveCTFromList([77, 70, 71, 51, 60, 60, 29, 59, 60], 'medium', rnd),
        effectiveCTFromList([60, 67, 71, 60, 32, 57, 59, 71, 60], 'medium', rnd),
      ],
    },
    {
      title: 'Stage 6 · Precedence traps',
      intro: ['Two stations look fine on time. Check the arrows.'],
      questions: [fixedLab2NotAcceptableBF(rnd), fixedLab2NotAcceptableADJ(rnd)],
    },
  ];
}
