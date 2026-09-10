import type { MistakeCategoryId } from '@/types';

export interface MistakeCategoryDef {
  id: MistakeCategoryId;
  label: string;
  rule: string;
}

export const MISTAKE_CATEGORIES: MistakeCategoryDef[] = [
  { id: 'ws-round-down', label: 'Forgot to round workstation count UP', rule: 'Workstations → ALWAYS round up. You cannot have 0.07 of a station.' },
  { id: 'ct-round-up', label: 'Rounded cycle time UP', rule: 'Cycle time → NEVER round up. More time per unit means you miss the output target.' },
  { id: 'dq-vs-qd', label: 'Used D/Q instead of (Q/D)×52', rule: 'D/Q = orders per YEAR. (Q/D)×52 = WEEKS between orders.' },
  { id: 'teu-40', label: 'Forgot 40-ft = 2 TEU', rule: 'A 40-foot container counts as 2 TEUs. TEU = 20-ft + 2 × 40-ft.' },
  { id: 'predecessor', label: 'Ignored a predecessor', rule: 'A task cannot start until every arrow pointing into it is finished.' },
  { id: 'exceeded-ct', label: 'Exceeded cycle time', rule: 'Every workstation total must be ≤ cycle time, even if precedence is fine.' },
  { id: 'unit-cost-as-h', label: 'Used unit cost as H', rule: 'Unit cost C is NOT holding cost H. H is the annual cost to hold ONE unit.' },
  { id: 'rate-not-h', label: 'Forgot to calculate H from the holding rate', rule: 'A holding-cost percentage is not H until you multiply it by unit cost: H = rate × C.' },
  { id: 'eoq-direction', label: 'Flipped the EOQ direction', rule: 'AHC > AOC → Q too BIG → EOQ smaller. AOC > AHC → Q too SMALL → EOQ larger.' },
  { id: 'effective-ct-confusion', label: 'Confused cycle time with effective cycle time', rule: 'Effective CT of an existing line = the LONGEST workstation. c = OT/D is the target.' },
  { id: 'formula-choice', label: 'Picked the wrong formula', rule: 'Read what the question asks for, then match it to the formula sheet.' },
  { id: 'vocab', label: 'Vocabulary mix-up', rule: 'Drill the flashcards: each term has one course definition.' },
  { id: 'arithmetic', label: 'Calculation slip', rule: 'Write the formula, plug numbers in order, then compute. Check units.' },
];

export const MISTAKE_MAP: Record<MistakeCategoryId, MistakeCategoryDef> = Object.fromEntries(
  MISTAKE_CATEGORIES.map((m) => [m.id, m]),
) as Record<MistakeCategoryId, MistakeCategoryDef>;
