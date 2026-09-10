import type { SkillId, WorldId, WorldOrAll } from '@/types';

export interface SkillDef {
  id: SkillId;
  label: string;
  world: WorldOrAll;
  kind: 'concept' | 'calc';
  /** Target answer time in seconds used for speed scoring. */
  targetSec: number;
}

export const SKILLS: SkillDef[] = [
  // World 1
  { id: 'procurement', label: 'Procurement', world: 'w1', kind: 'concept', targetSec: 25 },
  { id: 'business-model', label: 'Business Model', world: 'w1', kind: 'concept', targetSec: 25 },
  { id: 'visibility', label: 'Supply Chain Visibility', world: 'w1', kind: 'concept', targetSec: 25 },
  { id: 'po', label: 'Purchase Order (PO)', world: 'w1', kind: 'concept', targetSec: 25 },
  { id: 'rfq', label: 'RFQ', world: 'w1', kind: 'concept', targetSec: 25 },
  { id: 'tco', label: 'Total Cost of Ownership', world: 'w1', kind: 'concept', targetSec: 25 },
  { id: 'acronyms', label: 'PO / RFQ / TCO / EOQ', world: 'w1', kind: 'concept', targetSec: 20 },
  // World 2
  { id: 'eoq', label: 'EOQ Formula', world: 'w2', kind: 'calc', targetSec: 90 },
  { id: 'holding-cost', label: 'Holding Cost (H)', world: 'w2', kind: 'calc', targetSec: 60 },
  { id: 'purchase-cost', label: 'Purchase Cost (DC)', world: 'w2', kind: 'calc', targetSec: 60 },
  { id: 'aoc', label: 'Annual Ordering Cost', world: 'w2', kind: 'calc', targetSec: 75 },
  { id: 'ahc', label: 'Annual Holding Cost', world: 'w2', kind: 'calc', targetSec: 75 },
  { id: 'total-cost', label: 'Total Annual Cost', world: 'w2', kind: 'calc', targetSec: 90 },
  { id: 'orders-per-year', label: 'Orders per Year', world: 'w2', kind: 'calc', targetSec: 45 },
  { id: 'weekly-demand', label: 'Weekly Demand', world: 'w2', kind: 'calc', targetSec: 45 },
  { id: 'time-between-orders', label: 'Time Between Orders', world: 'w2', kind: 'calc', targetSec: 60 },
  { id: 'pipeline', label: 'Pipeline Inventory', world: 'w2', kind: 'calc', targetSec: 45 },
  { id: 'safety-stock', label: 'Safety Stock', world: 'w2', kind: 'concept', targetSec: 25 },
  { id: 'eoq-intuition', label: 'EOQ Intuition', world: 'w2', kind: 'concept', targetSec: 45 },
  { id: 'ordering-restrictions', label: 'Ordering Restrictions (Q*)', world: 'w2', kind: 'calc', targetSec: 90 },
  // World 3
  { id: 'cycle-time', label: 'Cycle Time', world: 'w3', kind: 'calc', targetSec: 75 },
  { id: 'theoretical-min', label: 'Theoretical Min Stations', world: 'w3', kind: 'calc', targetSec: 60 },
  { id: 'efficiency', label: 'Efficiency', world: 'w3', kind: 'calc', targetSec: 75 },
  { id: 'idle-time', label: 'Idle Time', world: 'w3', kind: 'calc', targetSec: 60 },
  { id: 'effective-ct', label: 'Effective Cycle Time', world: 'w3', kind: 'calc', targetSec: 40 },
  { id: 'precedence', label: 'Precedence', world: 'w3', kind: 'calc', targetSec: 90 },
  { id: 'rounding-rules', label: 'Rounding Rules', world: 'w3', kind: 'concept', targetSec: 25 },
  // World 4
  { id: 'bulk', label: 'Bulk Cargo', world: 'w4', kind: 'concept', targetSec: 25 },
  { id: 'pallets', label: 'Pallets', world: 'w4', kind: 'concept', targetSec: 25 },
  { id: 'teu', label: 'TEU', world: 'w4', kind: 'calc', targetSec: 40 },
  { id: 'doublestack', label: 'Doublestack', world: 'w4', kind: 'concept', targetSec: 25 },
  { id: 'central-return', label: 'Central Return Center', world: 'w4', kind: 'concept', targetSec: 25 },
  { id: 'line-flow', label: 'Line-Flow Layout', world: 'w4', kind: 'concept', targetSec: 25 },
  { id: 'ct-importance', label: 'Cycle Time Importance', world: 'w4', kind: 'concept', targetSec: 25 },
  // Cross-cutting
  { id: 'formula-recognition', label: 'Formula Recognition', world: 'all', kind: 'concept', targetSec: 30 },
];

export const SKILL_MAP: Record<SkillId, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<
  SkillId,
  SkillDef
>;

export interface WorldDef {
  id: WorldId;
  num: number;
  title: string;
  subtitle: string;
  weight: number;
  color: string; // tailwind color token name
  skills: SkillId[];
}

export const WORLDS: WorldDef[] = [
  {
    id: 'w1',
    num: 1,
    title: 'Supply Chain Foundations',
    subtitle: 'Procurement, PO vs RFQ, TCO, visibility',
    weight: 0.2,
    color: 'info',
    skills: SKILLS.filter((s) => s.world === 'w1').map((s) => s.id),
  },
  {
    id: 'w2',
    num: 2,
    title: 'Inventory & EOQ',
    subtitle: 'EOQ, holding cost, total cost, ordering rhythm',
    weight: 0.3,
    color: 'good',
    skills: SKILLS.filter((s) => s.world === 'w2').map((s) => s.id),
  },
  {
    id: 'w3',
    num: 3,
    title: 'Line Balancing',
    subtitle: 'Cycle time, workstations, precedence',
    weight: 0.3,
    color: 'violet',
    skills: SKILLS.filter((s) => s.world === 'w3').map((s) => s.id),
  },
  {
    id: 'w4',
    num: 4,
    title: 'Logistics & Transportation',
    subtitle: 'TEU, pallets, bulk, returns, layouts',
    weight: 0.2,
    color: 'warn',
    skills: SKILLS.filter((s) => s.world === 'w4').map((s) => s.id),
  },
];

export const WORLD_MAP: Record<WorldId, WorldDef> = Object.fromEntries(WORLDS.map((w) => [w.id, w])) as Record<
  WorldId,
  WorldDef
>;

export const LEVELS = [
  { num: 1, title: 'Learn', blurb: 'One concept at a time', kind: 'learn' },
  { num: 2, title: 'Easy Practice', blurb: 'Clean numbers, obvious formula', kind: 'practice-easy' },
  { num: 3, title: 'Mixed Practice', blurb: 'Identify variables, extra steps', kind: 'practice-mixed' },
  { num: 4, title: 'Speed Round', blurb: '60 seconds. Go.', kind: 'speed' },
  { num: 5, title: 'Boss Battle', blurb: 'Everything in this world', kind: 'boss' },
] as const;

export type LevelKind = (typeof LEVELS)[number]['kind'];

export function levelKey(world: WorldId, level: number): string {
  return `${world}-L${level}`;
}
