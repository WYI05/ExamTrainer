import type { Question } from '@/types';
import { defaultRng, pick, pickN } from '@/utils/random';
import { mcText } from './common';
import type { GenOpts } from './eoq';

interface FormulaOption {
  id: string;
  text: string;
}

export const FORMULA_OPTIONS: FormulaOption[] = [
  { id: 'eoq', text: 'EOQ = √(2DS / H)' },
  { id: 'tc', text: 'TC = DC + (D/Q)S + (Q/2)H' },
  { id: 'aoc', text: 'AOC = (D/Q) × S' },
  { id: 'ahc', text: 'AHC = (Q/2) × H' },
  { id: 'orders', text: 'D / Q' },
  { id: 'tbo', text: '(Q / D) × 52' },
  { id: 'weekly', text: 'D / 52' },
  { id: 'pipeline', text: 'Pipeline = d × L' },
  { id: 'ct', text: 'c = OT / D' },
  { id: 'tm', text: 'TM = t / c' },
  { id: 'eff', text: 'Efficiency = t / (n × c)' },
  { id: 'idle', text: 'Idle = (n × c) − t' },
  { id: 'ect', text: 'Longest workstation time' },
  { id: 'h', text: 'H = rate × C' },
];

interface Scenario {
  prompt: string;
  formula: string;
  near: string[]; // most confusable formulas
  why: string;
}

export const SCENARIOS: Scenario[] = [
  { prompt: 'How many weeks occur between inventory orders?', formula: 'tbo', near: ['orders', 'weekly', 'pipeline'], why: 'Weeks between orders = (Q/D) × 52.' },
  { prompt: 'How many times per year does the company place an order?', formula: 'orders', near: ['tbo', 'weekly', 'aoc'], why: 'Orders per year = D/Q.' },
  { prompt: 'How many units are needed each week?', formula: 'weekly', near: ['orders', 'tbo', 'pipeline'], why: 'Weekly demand = D/52.' },
  { prompt: 'What order size minimizes total ordering + holding cost?', formula: 'eoq', near: ['tc', 'aoc', 'ahc'], why: 'EOQ = √(2DS/H).' },
  { prompt: 'What is the total yearly cost of buying, ordering, and holding inventory?', formula: 'tc', near: ['eoq', 'aoc', 'ahc'], why: 'TC = DC + (D/Q)S + (Q/2)H.' },
  { prompt: 'How much does the company spend per year placing orders?', formula: 'aoc', near: ['ahc', 'orders', 'tc'], why: 'AOC = (D/Q) × S.' },
  { prompt: 'How much does it cost per year to keep inventory on the shelf?', formula: 'ahc', near: ['aoc', 'tc', 'h'], why: 'AHC = (Q/2) × H.' },
  { prompt: 'How many units are currently in transit through the supply chain?', formula: 'pipeline', near: ['weekly', 'ahc', 'tbo'], why: 'Pipeline = d × L.' },
  { prompt: 'Holding cost is 30% of a $100 unit. What is the holding cost per unit?', formula: 'h', near: ['ahc', 'eoq', 'tc'], why: 'H = rate × C = 0.30 × 100 = $30.' },
  { prompt: 'The plant runs 8 hours per day and must make 370 units. What is the max time per unit at each station?', formula: 'ct', near: ['tm', 'ect', 'eff'], why: 'Cycle time c = OT/D.' },
  { prompt: 'Fewest workstations that could possibly complete all the work?', formula: 'tm', near: ['ct', 'eff', 'idle'], why: 'TM = t/c, rounded up.' },
  { prompt: 'What fraction of the line’s capacity is doing real work?', formula: 'eff', near: ['idle', 'tm', 'ct'], why: 'Efficiency = t/(nc).' },
  { prompt: 'How many seconds per cycle are wasted across the whole line?', formula: 'idle', near: ['eff', 'tm', 'ct'], why: 'Idle = nc − t.' },
  { prompt: 'A line already exists with stations of 45, 75, 45, 70, 55 sec. How fast can it actually run?', formula: 'ect', near: ['ct', 'tm', 'eff'], why: 'Effective CT = longest workstation (75).' },
  { prompt: 'An operations manager needs the target time per unit before balancing a new line.', formula: 'ct', near: ['ect', 'tm', 'idle'], why: 'c = OT/D comes first.' },
  { prompt: 'The company wants to know its average inventory cost given Q and H.', formula: 'ahc', near: ['aoc', 'tc', 'eoq'], why: 'Average inventory is Q/2; AHC = (Q/2)H.' },
];

export function genFormulaRecognition(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const s = pick(SCENARIOS, rnd);
  const correct = FORMULA_OPTIONS.find((f) => f.id === s.formula)!;
  const near = s.near.map((id) => FORMULA_OPTIONS.find((f) => f.id === id)!);
  const others = FORMULA_OPTIONS.filter((f) => f.id !== s.formula && !s.near.includes(f.id));
  const wrongPool = difficulty === 'easy' ? [...pickN(near, 2, rnd), pick(others, rnd)] : near;
  return mcText({
    skill: 'formula-recognition',
    world: 'all',
    difficulty,
    prompt: `Which formula should you use?\n"${s.prompt}"`,
    correct: correct.text,
    wrong: wrongPool.map((w) => ({ label: w.text, mistake: 'formula-choice' as const })),
    hints: ['What is the question actually asking for — a count, a time, a cost, or a quantity?', s.why.split('=')[0].trim() + ' is the one.'],
    explanation: { steps: [s.why], fastRule: 'Match the ASK to the formula before touching numbers.' },
    defaultMistake: 'formula-choice',
    rnd,
  });
}
