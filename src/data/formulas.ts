// ---------------------------------------------------------------------------
// Formula sheet data. Every variable is clickable in the UI.
// ---------------------------------------------------------------------------

export interface VariableDef {
  symbol: string;
  meaning: string;
}

export interface FormulaDef {
  id: string;
  name: string;
  formula: string;
  world: 'w2' | 'w3';
  variables: VariableDef[];
  whenToUse: string;
  trap: string;
  example: string;
}

export const VARIABLES: Record<string, string> = {
  D: 'Annual demand — how many units customers require in one year.',
  Q: 'Order quantity (lot size) — how many units arrive each time you place an order.',
  S: 'Ordering cost — the cost of placing ONE order (paperwork, delivery, receiving…).',
  H: 'Annual holding cost PER UNIT — what it costs to keep one unit in stock for a year.',
  C: 'Cost per unit — the wholesale/purchase price of one unit.',
  d: 'Demand rate — units needed per period (e.g. per week).',
  L: 'Lead time — how long an order takes to arrive, in the same period as d.',
  OT: 'Operating time — total production time available (convert to seconds!).',
  'D (output)': 'Required output — units that must be produced in the operating time.',
  c: 'Cycle time — the maximum time each workstation may spend on one unit.',
  t: 'Total task time — sum of every task time in the line.',
  n: 'Number of workstations.',
  TM: 'Theoretical minimum number of workstations (always round up).',
  '52': 'Weeks in a year.',
};

export const FORMULAS: FormulaDef[] = [
  {
    id: 'eoq',
    name: 'Economic Order Quantity',
    formula: 'EOQ = √( 2DS / H )',
    world: 'w2',
    variables: [
      { symbol: 'D', meaning: VARIABLES.D },
      { symbol: 'S', meaning: VARIABLES.S },
      { symbol: 'H', meaning: VARIABLES.H },
    ],
    whenToUse: 'The question asks for the order size that minimizes total ordering + holding cost.',
    trap: 'The present lot size Q is NOT in the formula. And a holding RATE must be multiplied by unit cost first.',
    example: 'D = 3000, S = 400, H = 38 → √(2·3000·400 / 38) = √63,158 ≈ 251.',
  },
  {
    id: 'tc',
    name: 'Total Annual Inventory Cost',
    formula: 'TC = DC + (D/Q)S + (Q/2)H',
    world: 'w2',
    variables: [
      { symbol: 'D', meaning: VARIABLES.D },
      { symbol: 'C', meaning: VARIABLES.C },
      { symbol: 'Q', meaning: VARIABLES.Q },
      { symbol: 'S', meaning: VARIABLES.S },
      { symbol: 'H', meaning: VARIABLES.H },
    ],
    whenToUse: 'The question asks for total yearly cost of buying, ordering and holding.',
    trap: 'Three pieces: purchase cost DC + AOC + AHC. Do not forget DC.',
    example: 'D = 7800, C = 175, Q = 900, S = 475, H = 61.25 → 1,365,000 + 4,116.67 + 27,562.50 ≈ $1,396,679.',
  },
  {
    id: 'aoc',
    name: 'Annual Ordering Cost',
    formula: 'AOC = (D/Q) × S',
    world: 'w2',
    variables: [
      { symbol: 'D', meaning: VARIABLES.D },
      { symbol: 'Q', meaning: VARIABLES.Q },
      { symbol: 'S', meaning: VARIABLES.S },
    ],
    whenToUse: 'How much you spend per year placing orders.',
    trap: 'D/Q is the number of orders per year. Multiply by the cost of ONE order.',
    example: 'D = 7800, Q = 900, S = 475 → 8.667 × 475 ≈ $4,116.67.',
  },
  {
    id: 'ahc',
    name: 'Annual Holding Cost',
    formula: 'AHC = (Q/2) × H',
    world: 'w2',
    variables: [
      { symbol: 'Q', meaning: VARIABLES.Q },
      { symbol: 'H', meaning: VARIABLES.H },
    ],
    whenToUse: 'How much you spend per year keeping inventory on the shelf.',
    trap: 'Q/2 is the AVERAGE inventory. Bigger Q → bigger AHC.',
    example: 'Q = 900, H = 61.25 → 450 × 61.25 = $27,562.50.',
  },
  {
    id: 'orders',
    name: 'Orders per Year',
    formula: 'Orders per year = D / Q',
    world: 'w2',
    variables: [
      { symbol: 'D', meaning: VARIABLES.D },
      { symbol: 'Q', meaning: VARIABLES.Q },
    ],
    whenToUse: 'How many times per year you place an order.',
    trap: 'This is NOT the weeks between orders — that is (Q/D) × 52.',
    example: 'D = 3000, Q = 150 → 20 orders per year.',
  },
  {
    id: 'tbo',
    name: 'Time Between Orders',
    formula: 'TBO (weeks) = (Q / D) × 52',
    world: 'w2',
    variables: [
      { symbol: 'Q', meaning: VARIABLES.Q },
      { symbol: 'D', meaning: VARIABLES.D },
      { symbol: '52', meaning: VARIABLES['52'] },
    ],
    whenToUse: 'How many WEEKS pass between two orders.',
    trap: 'Q over D (fraction of a year per order), then × 52. Flipping it gives orders per year instead.',
    example: 'Q = 348, D = 7800 → (348/7800) × 52 ≈ 2.32 weeks.',
  },
  {
    id: 'weekly',
    name: 'Weekly Demand',
    formula: 'Weekly demand = D / 52',
    world: 'w2',
    variables: [
      { symbol: 'D', meaning: VARIABLES.D },
      { symbol: '52', meaning: VARIABLES['52'] },
    ],
    whenToUse: 'Convert annual demand into units per week.',
    trap: 'Use 52 weeks, not 50 or 12.',
    example: 'D = 7800 → 150 units per week.',
  },
  {
    id: 'pipeline',
    name: 'Pipeline Inventory',
    formula: 'Pipeline = d × L',
    world: 'w2',
    variables: [
      { symbol: 'd', meaning: VARIABLES.d },
      { symbol: 'L', meaning: VARIABLES.L },
    ],
    whenToUse: 'Inventory currently traveling through the supply chain (ordered, not yet received).',
    trap: 'd and L must use the same time unit (weeks with weeks, days with days).',
    example: 'd = 150 per week, L = 2 weeks → 300 units in the pipeline.',
  },
  {
    id: 'ct',
    name: 'Cycle Time',
    formula: 'c = OT / D',
    world: 'w3',
    variables: [
      { symbol: 'OT', meaning: VARIABLES.OT },
      { symbol: 'D', meaning: VARIABLES['D (output)'] },
    ],
    whenToUse: 'The max time each station may spend per unit to hit required output.',
    trap: 'NEVER round cycle time up in this course. 77.84 → 77.',
    example: '8 hours = 28,800 sec. Output 370 → 28,800 / 370 = 77.84 → CT = 77.',
  },
  {
    id: 'tm',
    name: 'Theoretical Minimum Workstations',
    formula: 'TM = t / c',
    world: 'w3',
    variables: [
      { symbol: 't', meaning: VARIABLES.t },
      { symbol: 'c', meaning: VARIABLES.c },
    ],
    whenToUse: 'Fewest workstations that could possibly do all the work.',
    trap: 'ALWAYS round the number of workstations UP. 4.07 → 5.',
    example: 't = 224, c = 55 → 4.07 → 5 stations.',
  },
  {
    id: 'eff',
    name: 'Efficiency',
    formula: 'Efficiency = t / (n × c)',
    world: 'w3',
    variables: [
      { symbol: 't', meaning: VARIABLES.t },
      { symbol: 'n', meaning: VARIABLES.n },
      { symbol: 'c', meaning: VARIABLES.c },
    ],
    whenToUse: 'How much of the line’s capacity is doing real work.',
    trap: 'Answer may be requested as 0.47 or 47% — match the question’s format.',
    example: 't = 224, n = 5, c = 95 → 224 / 475 ≈ 0.47.',
  },
  {
    id: 'idle',
    name: 'Idle Time',
    formula: 'Idle = (n × c) − t',
    world: 'w3',
    variables: [
      { symbol: 'n', meaning: VARIABLES.n },
      { symbol: 'c', meaning: VARIABLES.c },
      { symbol: 't', meaning: VARIABLES.t },
    ],
    whenToUse: 'Total wasted seconds per cycle across the whole line.',
    trap: 'Capacity first (n × c), then subtract the work (t).',
    example: 't = 537, n = 10, c = 77 → 770 − 537 = 233 sec.',
  },
  {
    id: 'ect',
    name: 'Effective Cycle Time',
    formula: 'Effective CT = longest workstation time',
    world: 'w3',
    variables: [{ symbol: 'n', meaning: 'Look at every workstation total and take the biggest one.' }],
    whenToUse: 'A line already exists and you are asked how fast it really runs.',
    trap: 'No formula needed. The slowest station is the bottleneck and sets the pace.',
    example: 'Stations 45, 75, 45, 70, 55 → effective CT = 75.',
  },
];

export const FORMULA_MAP: Record<string, FormulaDef> = Object.fromEntries(FORMULAS.map((f) => [f.id, f]));
