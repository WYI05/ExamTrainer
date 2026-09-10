// ---------------------------------------------------------------------------
// Core domain types for the SCM 300 trainer.
// ---------------------------------------------------------------------------

export type WorldId = 'w1' | 'w2' | 'w3' | 'w4';
export type WorldOrAll = WorldId | 'all';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'exam';
export type QuestionKind = 'mc' | 'numeric';

export type SkillId =
  // World 1 — Supply Chain Foundations
  | 'procurement'
  | 'business-model'
  | 'visibility'
  | 'po'
  | 'rfq'
  | 'tco'
  | 'acronyms'
  // World 2 — Inventory & EOQ
  | 'eoq'
  | 'holding-cost'
  | 'purchase-cost'
  | 'aoc'
  | 'ahc'
  | 'total-cost'
  | 'orders-per-year'
  | 'weekly-demand'
  | 'time-between-orders'
  | 'pipeline'
  | 'safety-stock'
  | 'eoq-intuition'
  | 'ordering-restrictions'
  // World 3 — Line Balancing
  | 'cycle-time'
  | 'theoretical-min'
  | 'efficiency'
  | 'idle-time'
  | 'effective-ct'
  | 'precedence'
  | 'rounding-rules'
  // World 4 — Logistics & Transportation
  | 'bulk'
  | 'pallets'
  | 'teu'
  | 'doublestack'
  | 'central-return'
  | 'line-flow'
  | 'ct-importance'
  // Cross-cutting
  | 'formula-recognition';

export type MistakeCategoryId =
  | 'ws-round-down'
  | 'ct-round-up'
  | 'dq-vs-qd'
  | 'teu-40'
  | 'predecessor'
  | 'exceeded-ct'
  | 'unit-cost-as-h'
  | 'rate-not-h'
  | 'eoq-direction'
  | 'effective-ct-confusion'
  | 'formula-choice'
  | 'vocab'
  | 'arithmetic';

export interface Choice {
  id: string;
  label: string;
  /** Mistake category recorded when this wrong choice is picked. */
  mistake?: MistakeCategoryId;
}

export interface Explanation {
  /** Short numbered steps (or WHY lines for concepts). */
  steps: string[];
  fastRule: string;
  memoryTrick?: string;
}

export interface DiagramRef {
  graphId: string;
  /** Optional workstation layout to render beneath the diagram. */
  layout?: string[][];
  /** Tasks already completed (drawn green). */
  completed?: string[];
}

/** A learning figure attached to a question (shown in the explanation) or a lesson step. */
export type VisualSpec =
  | { kind: 'sawtooth'; D: number; Q: number; S?: number; H?: number; emphasize?: 'orders' | 'gap' | 'average' }
  | { kind: 'station-bars'; t?: number; n?: number; c?: number; stationTimes?: number[]; highlightMax?: boolean }
  | { kind: 'cost-stack'; DC?: number; AOC?: number; AHC?: number; Q?: number }
  | { kind: 'teu'; twenty: number; forty: number }
  | { kind: 'rounding'; value: number; mode: 'down' | 'up'; label?: string }
  | { kind: 'holding'; C: number; rate: number }
  | { kind: 'pipeline'; d: number; L: number }
  | { kind: 'weeks'; D: number }
  | { kind: 'balance'; AHC: number; AOC: number; Q: number }
  | { kind: 'eoq-curve'; D: number; S: number; H: number; Q?: number; marks?: number[] }
  | { kind: 'layout-check'; graphId: string; layout: string[][]; ct: number }
  | { kind: 'tco' }
  | { kind: 'day-split'; OT: number; D: number };

export interface Question {
  id: string;
  /** Concept template id (for re-asking the same concept) or generator key. */
  templateId?: string;
  skill: SkillId;
  world: WorldOrAll;
  difficulty: Difficulty;
  kind: QuestionKind;
  prompt: string;
  /** Short "given" lines shown above the prompt. */
  given?: string[];
  diagram?: DiagramRef;
  /** Figure rendered with the explanation. */
  visual?: VisualSpec;
  choices?: Choice[];
  /** Choice id for MC; numeric value for numeric. */
  answer: string | number;
  tolerance?: number;
  unit?: string;
  correctText: string;
  hints: [string, string];
  explanation: Explanation;
  /** Default mistake category when a numeric answer is wrong. */
  mistakeCategory?: MistakeCategoryId;
  /** Whether this counts as a calculation question (for pace targets). */
  isCalc: boolean;
}

export interface AnswerRecord {
  question: Question;
  given: string | number | null;
  correct: boolean;
  timeMs: number;
  hintsUsed: number;
  xp: number;
  mistake?: MistakeCategoryId;
}

// ---------------------------------------------------------------------------
// Progress (persisted in localStorage)
// ---------------------------------------------------------------------------

export interface SkillStats {
  attempts: number;
  correct: number;
  /** 1 = correct, 0 = wrong; most recent last; capped at 12 entries. */
  recent: number[];
  /** Recent answer times in ms; capped at 12 entries. */
  recentTimes: number[];
  lastSeen: number;
}

export interface LevelStats {
  completed: boolean;
  stars: number; // 0-3
  bestAccuracy: number; // 0-1
  attempts: number;
}

export interface MistakeEntry {
  id: string;
  at: number;
  skill: SkillId;
  world: WorldOrAll;
  templateId?: string;
  prompt: string;
  given?: string[];
  myAnswer: string;
  correctAnswer: string;
  why: string[];
  rule: string;
  category: MistakeCategoryId;
  resolvedAt?: number;
}

export interface ExamAttempt {
  id: string;
  at: number;
  mode: 'sim' | 'final';
  score: number;
  total: number;
  percent: number;
  timeUsedSec: number;
  avgSecPerQuestion: number;
  byWorld: Record<WorldId, { correct: number; total: number }>;
}

export interface SprintResult {
  at: number;
  answered: number;
  correct: number;
  bestStreak: number;
  perMinute: number;
}

export interface WorldStats {
  bestStreak: number;
}

export interface Progress {
  version: number;
  onboarded: boolean;
  confidence?: string;
  diagnosticScore?: number;
  xp: number;
  bestStreak: number;
  skills: Partial<Record<SkillId, SkillStats>>;
  levels: Record<string, LevelStats>;
  worlds: Record<WorldId, WorldStats>;
  mistakes: MistakeEntry[];
  mistakeCategoryCounts: Partial<Record<MistakeCategoryId, number>>;
  examAttempts: ExamAttempt[];
  sprints: { sixty: SprintResult[]; fiveMin: SprintResult[] };
  bosses: Record<string, boolean>;
  totals: { attempts: number; correct: number; timeMs: number };
  lastActive: number;
}

export interface Settings {
  reducedMotion: boolean;
  sound: boolean;
  theme: 'dark' | 'light';
}

// ---------------------------------------------------------------------------
// Precedence graph data
// ---------------------------------------------------------------------------

export interface TaskNode {
  id: string;
  time: number;
}

export interface Graph {
  id: string;
  name: string;
  tasks: TaskNode[];
  /** [predecessor, successor] */
  edges: [string, string][];
}

export type LayoutVerdict = 'valid' | 'cycle-time' | 'precedence' | 'both';

export interface LayoutCheck {
  verdict: LayoutVerdict;
  /** Workstation index → total time. */
  stationTimes: number[];
  /** Workstations that exceed cycle time. */
  overloaded: number[];
  /** Tasks whose predecessor was not completed in time, with the missing predecessor. */
  precedenceErrors: { station: number; task: string; missing: string }[];
}
