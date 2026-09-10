import type { Question, WorldId } from '@/types';
import { defaultRng, type Rng } from '@/utils/random';
import { conceptById } from '@/generators/concept';
import {
  genAHC,
  genAOC,
  genEoq,
  genEoqIntuition,
  genHoldingCost,
  genOrderingRestrictions,
  genOrdersPerYear,
  genPipeline,
  genPurchaseCost,
  genTimeBetweenOrders,
  genTotalCost,
  genWeeklyDemand,
} from '@/generators/eoq';
import { genCycleTime, genEffectiveCT, genEfficiency, genIdle, genRoundingRule, genTheoreticalMin } from '@/generators/lineBalancing';
import { fixedNextStationG1, fixedNextStationG2, genEligibleTask, genLayoutVerdict } from '@/generators/precedence';
import { genTeu } from '@/generators/teu';
import { genFormulaRecognition } from '@/generators/formulaRecognition';

// ---------------------------------------------------------------------------
// LESSON CONTENT — Level 1 of every world.
// Keep each card to 3–5 short sentences. One concept at a time.
// ---------------------------------------------------------------------------

export type LessonStep =
  | { kind: 'teach'; title: string; whatIsIt: string; whyCare: string; fastRule: string; example: string; memory?: string }
  | { kind: 'formula'; formulaId: string }
  | { kind: 'warning'; title: string; lines: string[] }
  | { kind: 'flash'; front: string; back: string }
  | { kind: 'visual'; visual: 'eoq-slider' | 'balance' | 'precedence-intro' | 'pallet' | 'teu' | 'sequence' }
  | { kind: 'try'; make: (rnd: Rng) => Question };

const c = (id: string) => (rnd: Rng) => conceptById(id, rnd)!;

export const LESSONS: Record<WorldId, LessonStep[]> = {
  w1: [
    {
      kind: 'teach',
      title: 'Procurement',
      whatIsIt: 'The part of the supply chain team that finds suppliers and purchases goods from the company’s supplier network.',
      whyCare: 'Nothing gets made or sold until someone buys the inputs.',
      fastRule: 'Procurement = procure / buy things.',
      example: 'A phone maker needs screens. Procurement finds a screen supplier and buys 10,000 of them.',
      memory: 'PROCURE-ment → procure (buy).',
    },
    { kind: 'try', make: c('c-procurement-1') },
    {
      kind: 'teach',
      title: 'Business Model',
      whatIsIt: 'A company’s plan for buying materials, making end products, selling goods, and transporting goods to customers.',
      whyCare: 'It describes how the overall business operates, end to end.',
      fastRule: 'Buy + make + sell + transport = Business Model.',
      example: 'A furniture company buys wood, builds tables, sells them online, and ships them to homes. That whole plan is its business model.',
    },
    { kind: 'try', make: c('c-business-model-1') },
    {
      kind: 'flash',
      front: 'Supply Chain Visibility',
      back: 'Also referred to as Inventory Visibility.',
    },
    { kind: 'try', make: c('c-visibility-1') },
    {
      kind: 'teach',
      title: 'RFQ — Request for Quotation',
      whatIsIt: 'A document a buyer sends to suppliers asking what they would charge.',
      whyCare: 'It comes BEFORE any order is placed — you cannot order until you know the price.',
      fastRule: 'RFQ = asking for price.',
      example: 'Need 500 chairs? Send an RFQ to three suppliers and compare the quotes.',
    },
    { kind: 'try', make: c('c-rfq-1') },
    {
      kind: 'teach',
      title: 'Purchase Order — PO',
      whatIsIt: 'The formal document used to place an order with a supplier.',
      whyCare: 'The BUYER issues the PO to the supplier. This is the moment the order actually happens.',
      fastRule: 'RFQ asks for price. PO actually orders.',
      example: 'After accepting a quote, the buyer issues a PO for 500 chairs. Goods are delivered next.',
    },
    { kind: 'visual', visual: 'sequence' },
    { kind: 'try', make: c('c-po-1') },
    { kind: 'try', make: c('c-po-2') },
    {
      kind: 'teach',
      title: 'Total Cost of Ownership — TCO',
      whatIsIt: 'The total cost of owning an item across its entire lifetime.',
      whyCare: 'The sticker price is only the beginning — fuel, maintenance and disposal all count.',
      fastRule: 'TCO = ALL costs over the item’s life.',
      example: 'A company owns a fleet of trucks. The lifetime cost of one truck is its TCO.',
    },
    { kind: 'try', make: c('c-tco-1') },
    {
      kind: 'warning',
      title: 'Four acronyms, four meanings',
      lines: ['PO → formal order', 'RFQ → asking for price', 'TCO → lifetime ownership cost', 'EOQ → best order quantity'],
    },
    { kind: 'try', make: c('c-acronyms-po') },
    { kind: 'try', make: c('c-acronyms-tco') },
    { kind: 'try', make: c('c-acronyms-eoq') },
  ],

  w2: [
    {
      kind: 'teach',
      title: 'The three inventory costs',
      whatIsIt: 'Buying inventory costs money three ways: purchase cost (DC), ordering cost (AOC), and holding cost (AHC).',
      whyCare: 'Total cost = DC + AOC + AHC. Every EOQ question is about these three pieces.',
      fastRule: 'TC = Purchase + Ordering + Holding.',
      example: 'Buy 7,800 phones at $175 → DC = $1,365,000. Then add what ordering and holding cost.',
    },
    { kind: 'formula', formulaId: 'tc' },
    { kind: 'try', make: (rnd) => genPurchaseCost({ difficulty: 'easy', rnd }) },
    {
      kind: 'teach',
      title: 'Holding cost H',
      whatIsIt: 'H is what it costs to keep ONE unit in stock for a whole year.',
      whyCare: 'Sometimes H is given directly ($38 per unit). Sometimes it is a percentage of unit cost — then you must compute it.',
      fastRule: 'H = holding rate × unit cost.',
      example: 'Unit cost $100, holding rate 30% → H = 0.30 × 100 = $30 per unit per year.',
    },
    {
      kind: 'warning',
      title: 'TRAP',
      lines: ['Unit cost C is NOT holding cost H.', 'A holding RATE is not H until you multiply by unit cost.'],
    },
    { kind: 'try', make: (rnd) => genHoldingCost({ difficulty: 'easy', rnd }) },
    { kind: 'formula', formulaId: 'aoc' },
    { kind: 'try', make: (rnd) => genAOC({ difficulty: 'easy', rnd }) },
    { kind: 'formula', formulaId: 'ahc' },
    { kind: 'try', make: (rnd) => genAHC({ difficulty: 'easy', rnd }) },
    { kind: 'try', make: (rnd) => genTotalCost({ difficulty: 'medium', rnd }) },
    {
      kind: 'teach',
      title: 'EOQ — Economic Order Quantity',
      whatIsIt: 'The order size where annual ordering cost equals annual holding cost.',
      whyCare: 'It is the cheapest way to order over a year — the exam loves it.',
      fastRule: 'EOQ = √(2DS / H). Your current Q is NOT in the formula.',
      example: 'D = 3000, S = 400, H = 38 → √(2·3000·400/38) ≈ 251.',
    },
    { kind: 'formula', formulaId: 'eoq' },
    { kind: 'visual', visual: 'eoq-slider' },
    { kind: 'try', make: (rnd) => genEoq({ difficulty: 'easy', rnd }) },
    { kind: 'try', make: (rnd) => genEoq({ difficulty: 'medium', rnd }) },
    {
      kind: 'teach',
      title: 'Orders per year vs. weeks between orders',
      whatIsIt: 'D/Q tells you how many orders you place per year. (Q/D) × 52 tells you how many weeks pass between orders.',
      whyCare: 'These two get confused constantly. They are flips of each other.',
      fastRule: 'D/Q = orders per YEAR. (Q/D) × 52 = WEEKS between orders.',
      example: 'D = 3000, Q = 150 → 20 orders per year, and (150/3000) × 52 = 2.6 weeks apart.',
    },
    { kind: 'formula', formulaId: 'orders' },
    { kind: 'formula', formulaId: 'tbo' },
    { kind: 'try', make: (rnd) => genOrdersPerYear({ difficulty: 'easy', rnd }) },
    { kind: 'try', make: (rnd) => genTimeBetweenOrders({ difficulty: 'easy', rnd }) },
    { kind: 'formula', formulaId: 'weekly' },
    { kind: 'try', make: (rnd) => genWeeklyDemand({ difficulty: 'easy', rnd }) },
    {
      kind: 'teach',
      title: 'Pipeline inventory',
      whatIsIt: 'Inventory that is currently traveling through the supply chain — ordered but not yet received.',
      whyCare: 'It is real inventory you have paid for, even though it is not on the shelf.',
      fastRule: 'Pipeline = d × L (demand rate × lead time).',
      example: 'd = 150 per week, L = 2 weeks → 300 units in the pipeline.',
    },
    { kind: 'try', make: (rnd) => genPipeline({ difficulty: 'easy', rnd }) },
    { kind: 'flash', front: 'Safety Stock', back: 'Inventory used to account for variation / uncertainty. Safety stock = cushion.' },
    { kind: 'try', make: c('c-safety-stock-1') },
    {
      kind: 'teach',
      title: 'EOQ intuition — the balance',
      whatIsIt: 'At EOQ, AOC = AHC. If one cost is heavier than the other, your Q is on the wrong side.',
      whyCare: 'The exam asks whether EOQ is above or below your current Q without giving you every number.',
      fastRule: 'AHC > AOC → Q too BIG → EOQ smaller. AOC > AHC → Q too SMALL → EOQ larger.',
      example: 'AHC = $80,000, AOC = $40,000, Q = 500. Holding is heavy → EOQ < 500.',
    },
    { kind: 'visual', visual: 'balance' },
    { kind: 'try', make: (rnd) => genEoqIntuition({ difficulty: 'easy', rnd }) },
    { kind: 'try', make: c('c-eoq-bigger-q') },
    {
      kind: 'teach',
      title: 'Ordering restrictions — Q*',
      whatIsIt: 'Suppliers often only accept certain quantities (e.g. increments of 100). The theoretical EOQ may not be allowed.',
      whyCare: 'You must pick a practical quantity Q* that obeys the rule and stays close to EOQ.',
      fastRule: 'Q* = permitted, near EOQ, meets demand, lowest cost.',
      example: 'EOQ = 348, increments of 100 → compare 300 and 400. Pick the cheaper one.',
    },
    { kind: 'try', make: (rnd) => genOrderingRestrictions({ difficulty: 'medium', rnd }) },
    { kind: 'try', make: (rnd) => genFormulaRecognition({ difficulty: 'easy', rnd }) },
  ],

  w3: [
    {
      kind: 'teach',
      title: 'What is line balancing?',
      whatIsIt: 'An assembly line is split into workstations. Each station does some tasks on every unit. Balancing means splitting the work so no station is overloaded.',
      whyCare: 'Cycle time, workstations, efficiency and idle time all come from this one idea.',
      fastRule: 'Every station must finish within the cycle time.',
      example: 'A line has 224 seconds of work per unit. If each station gets 80 seconds, you need at least 3 stations.',
    },
    {
      kind: 'teach',
      title: 'Cycle time',
      whatIsIt: 'The maximum time each workstation may spend on one unit so the line still hits its required output.',
      whyCare: 'It is the most important number in line balancing — everything else uses it.',
      fastRule: 'c = OT / D. Convert hours to seconds first.',
      example: '8 hours = 28,800 sec. Output 370 → 28,800 / 370 = 77.84 → use 77.',
    },
    { kind: 'formula', formulaId: 'ct' },
    {
      kind: 'warning',
      title: 'CYCLE TIME — NEVER ROUND UP',
      lines: ['77.84 → 77', 'Rounding up gives every unit MORE time, so the line misses its output target.'],
    },
    { kind: 'try', make: (rnd) => genCycleTime({ difficulty: 'easy', rnd }) },
    {
      kind: 'teach',
      title: 'Theoretical minimum workstations',
      whatIsIt: 'The fewest stations that could possibly do all the work: total task time divided by cycle time.',
      whyCare: 'You cannot have 0.07 of a workstation, so the answer always rounds UP.',
      fastRule: 'TM = t / c → ALWAYS round up.',
      example: 't = 224, c = 55 → 4.07 → 5 stations.',
    },
    { kind: 'formula', formulaId: 'tm' },
    {
      kind: 'warning',
      title: 'Two opposite rounding rules',
      lines: ['CYCLE TIME → do NOT round up', 'WORKSTATIONS → ALWAYS round up'],
    },
    { kind: 'try', make: (rnd) => genTheoreticalMin({ difficulty: 'easy', rnd }) },
    { kind: 'try', make: (rnd) => genRoundingRule({ difficulty: 'easy', rnd }) },
    {
      kind: 'teach',
      title: 'Efficiency',
      whatIsIt: 'The share of the line’s total capacity that is real work.',
      whyCare: 'It shows how much time is wasted across all stations.',
      fastRule: 'Efficiency = t / (n × c).',
      example: 't = 224, n = 5, c = 95 → 224 / 475 ≈ 0.47 = 47%.',
    },
    { kind: 'formula', formulaId: 'eff' },
    { kind: 'try', make: (rnd) => genEfficiency({ difficulty: 'easy', rnd }) },
    {
      kind: 'teach',
      title: 'Idle time',
      whatIsIt: 'Capacity minus work: the total seconds per cycle that stations sit waiting.',
      whyCare: 'It is the flip side of efficiency.',
      fastRule: 'Idle = (n × c) − t.',
      example: 't = 537, n = 10, c = 77 → 770 − 537 = 233 sec.',
    },
    { kind: 'formula', formulaId: 'idle' },
    { kind: 'try', make: (rnd) => genIdle({ difficulty: 'easy', rnd }) },
    {
      kind: 'teach',
      title: 'Effective cycle time',
      whatIsIt: 'For a line that already exists, the real cycle time is simply the time of the slowest (longest) workstation.',
      whyCare: 'No formula needed. The slowest station is the bottleneck and everyone waits for it.',
      fastRule: 'Effective CT = longest workstation.',
      example: 'Stations 45, 75, 45, 70, 55 → effective CT = 75.',
    },
    { kind: 'try', make: (rnd) => genEffectiveCT({ difficulty: 'easy', rnd }) },
    {
      kind: 'teach',
      title: 'Precedence diagrams',
      whatIsIt: 'Circles are tasks. An arrow A → B means A must happen before B.',
      whyCare: 'A layout is valid only when every station is ≤ CT AND every arrow is respected.',
      fastRule: 'Arrow = "first this, then that".',
      example: 'A → B → C: you cannot put C in a station before B is finished.',
    },
    { kind: 'visual', visual: 'precedence-intro' },
    { kind: 'try', make: c('c-precedence-arrow') },
    { kind: 'try', make: (rnd) => genEligibleTask({ difficulty: 'easy', rnd }) },
    {
      kind: 'teach',
      title: 'Is this station valid?',
      whatIsIt: 'Two checks. 1: total time ≤ cycle time. 2: every predecessor of every task is finished (or inside the same station, done first).',
      whyCare: 'The exam gives four options: valid, cycle-time violation, precedence violation, or both.',
      fastRule: 'Time check + arrow check.',
      example: 'CT 85, WS1 = AE. WS2 = BC works (70 sec, no predecessors). WS2 = DF fails because D needs B.',
    },
    { kind: 'try', make: (rnd) => fixedNextStationG1(rnd, 'easy') },
    { kind: 'try', make: (rnd) => fixedNextStationG2(rnd, 'easy') },
    { kind: 'try', make: (rnd) => genLayoutVerdict({ difficulty: 'easy', rnd }) },
  ],

  w4: [
    {
      kind: 'teach',
      title: 'Bulk cargo',
      whatIsIt: 'Loose commodity cargo that is not in bags or boxes — coal, rock salt, grain.',
      whyCare: 'It moves by the ton, poured rather than packed.',
      fastRule: 'Bulk = loose massive commodity.',
      example: 'A railcar full of loose coal is bulk cargo.',
      memory: 'Loose coal → Bulk.',
    },
    { kind: 'try', make: c('c-bulk-1') },
    {
      kind: 'teach',
      title: 'Pallets',
      whatIsIt: 'A platform that boxes are stacked on so a forklift or reach truck can move many boxes at once.',
      whyCare: 'It is the standard way boxes move in a warehouse.',
      fastRule: 'Forklift → pallet.',
      example: '48 boxes of cereal stacked on one pallet move in a single forklift trip.',
    },
    { kind: 'visual', visual: 'pallet' },
    { kind: 'try', make: c('c-pallets-1') },
    {
      kind: 'teach',
      title: 'TEU — Twenty-foot Equivalent Unit',
      whatIsIt: 'The standard unit for counting shipping containers. A 20-foot container is 1 TEU. A 40-foot container is 2 TEUs.',
      whyCare: 'Ships and ports are measured in TEUs, and the exam makes you add them up.',
      fastRule: 'TEU = 20-ft count + 2 × 40-ft count.',
      example: '100 twenty-foot + 250 forty-foot = 100 + 500 = 600 TEUs.',
    },
    { kind: 'visual', visual: 'teu' },
    { kind: 'try', make: c('c-teu-40') },
    { kind: 'try', make: (rnd) => genTeu({ difficulty: 'easy', rnd }) },
    { kind: 'try', make: (rnd) => genTeu({ difficulty: 'medium', rnd }) },
    { kind: 'flash', front: 'Doublestack', back: 'A railcar carrying two standardized containers stacked vertically.' },
    { kind: 'try', make: c('c-doublestack-1') },
    {
      kind: 'teach',
      title: 'Central Return Center',
      whatIsIt: 'Where opened, broken, or returned retail goods are sent after a customer returns them.',
      whyCare: 'Product returns are a supply chain flow too — in reverse.',
      fastRule: 'Returns → Central Return Center.',
      example: 'A customer returns an opened blender to Walmart. It is sent to a Central Return Center.',
    },
    { kind: 'try', make: c('c-crc-1') },
    {
      kind: 'teach',
      title: 'Line-flow layout',
      whatIsIt: 'A production layout used when a company makes the exact same product over and over.',
      whyCare: 'Products follow the same repeated sequence through production — an assembly line.',
      fastRule: 'Same product repeatedly → line-flow.',
      example: 'A bottling plant filling identical bottles all day uses a line-flow layout.',
    },
    { kind: 'try', make: c('c-line-flow-1') },
    { kind: 'flash', front: 'Most important number when balancing a line', back: 'Cycle time.' },
    { kind: 'try', make: c('c-ct-importance-1') },
  ],
};

/** Materialize a lesson (resolve the "try" steps into questions). */
export function buildLesson(world: WorldId, rnd: Rng = defaultRng): (LessonStep | { kind: 'question'; question: Question })[] {
  return LESSONS[world].map((s) => (s.kind === 'try' ? { kind: 'question' as const, question: s.make(rnd) } : s));
}
