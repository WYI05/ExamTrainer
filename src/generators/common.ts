import type { Choice, Difficulty, Explanation, MistakeCategoryId, Question, SkillId, WorldOrAll } from '@/types';
import { shuffle, uid, type Rng, defaultRng } from '@/utils/random';

export interface DistractorSpec {
  value: number;
  mistake?: MistakeCategoryId;
}

export interface McCalcOptions {
  skill: SkillId;
  world: WorldOrAll;
  difficulty: Difficulty;
  prompt: string;
  given?: string[];
  correct: number;
  /** Candidate wrong values (mathematically verified to differ from correct after formatting). */
  distractors: DistractorSpec[];
  format: (v: number) => string;
  hints: [string, string];
  explanation: Explanation;
  templateId?: string;
  diagram?: Question['diagram'];
  visual?: Question['visual'];
  rnd?: Rng;
  /** Fallback wrong-answer category (used when a distractor has none). */
  defaultMistake?: MistakeCategoryId;
}

/**
 * Builds a 4-option multiple-choice calculation question.
 * Guarantees: the correct value is present, all option labels are distinct,
 * and options are shuffled.
 */
export function mcCalc(o: McCalcOptions): Question {
  const rnd = o.rnd ?? defaultRng;
  const correctLabel = o.format(o.correct);
  const labels = new Set<string>([correctLabel]);
  const wrong: Choice[] = [];

  for (const d of o.distractors) {
    if (!Number.isFinite(d.value)) continue;
    const label = o.format(d.value);
    if (labels.has(label)) continue;
    labels.add(label);
    wrong.push({ id: uid('c'), label, mistake: d.mistake ?? o.defaultMistake ?? 'arithmetic' });
    if (wrong.length === 3) break;
  }

  // Top up with perturbations if the supplied distractors collided.
  const multipliers = [1.15, 0.85, 1.3, 0.7, 1.5, 0.5, 2, 0.25, 1.08, 0.92];
  const offsets = [1, 2, 3, 5, 10, 25, 50, 100, 0.5, 0.25, 0.1, 0.05];
  const candidates: number[] = [
    ...multipliers.map((m) => o.correct * m),
    ...offsets.flatMap((d) => [o.correct + d, o.correct - d]),
  ];
  let i = 0;
  while (wrong.length < 3 && i < candidates.length) {
    const label = o.format(candidates[i]);
    i += 1;
    if (labels.has(label)) continue;
    labels.add(label);
    wrong.push({ id: uid('c'), label, mistake: o.defaultMistake ?? 'arithmetic' });
  }

  const correctChoice: Choice = { id: uid('c'), label: correctLabel };
  const choices = shuffle([correctChoice, ...wrong], rnd);

  return {
    id: uid('q'),
    templateId: o.templateId,
    skill: o.skill,
    world: o.world,
    difficulty: o.difficulty,
    kind: 'mc',
    prompt: o.prompt,
    given: o.given,
    diagram: o.diagram,
    visual: o.visual,
    choices,
    answer: correctChoice.id,
    correctText: correctLabel,
    hints: o.hints,
    explanation: o.explanation,
    mistakeCategory: o.defaultMistake,
    isCalc: true,
  };
}

export interface McTextOptions {
  skill: SkillId;
  world: WorldOrAll;
  difficulty: Difficulty;
  prompt: string;
  given?: string[];
  correct: string;
  wrong: { label: string; mistake?: MistakeCategoryId }[];
  hints: [string, string];
  explanation: Explanation;
  templateId?: string;
  diagram?: Question['diagram'];
  visual?: Question['visual'];
  isCalc?: boolean;
  defaultMistake?: MistakeCategoryId;
  rnd?: Rng;
}

/** Builds a text multiple-choice question with shuffled, de-duplicated options. */
export function mcText(o: McTextOptions): Question {
  const rnd = o.rnd ?? defaultRng;
  const seen = new Set<string>([o.correct.trim().toLowerCase()]);
  const wrong: Choice[] = [];
  for (const w of o.wrong) {
    const key = w.label.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    wrong.push({ id: uid('c'), label: w.label, mistake: w.mistake ?? o.defaultMistake ?? 'vocab' });
    if (wrong.length === 3) break;
  }
  const correctChoice: Choice = { id: uid('c'), label: o.correct };
  const choices = shuffle([correctChoice, ...wrong], rnd);
  return {
    id: uid('q'),
    templateId: o.templateId,
    skill: o.skill,
    world: o.world,
    difficulty: o.difficulty,
    kind: 'mc',
    prompt: o.prompt,
    given: o.given,
    diagram: o.diagram,
    visual: o.visual,
    choices,
    answer: correctChoice.id,
    correctText: o.correct,
    hints: o.hints,
    explanation: o.explanation,
    mistakeCategory: o.defaultMistake,
    isCalc: o.isCalc ?? false,
  };
}

export interface NumericOptions {
  skill: SkillId;
  world: WorldOrAll;
  difficulty: Difficulty;
  prompt: string;
  given?: string[];
  answer: number;
  tolerance: number;
  unit?: string;
  format: (v: number) => string;
  hints: [string, string];
  explanation: Explanation;
  mistake?: MistakeCategoryId;
  templateId?: string;
  diagram?: Question['diagram'];
  visual?: Question['visual'];
}

/** Builds a free-entry numeric question. */
export function numeric(o: NumericOptions): Question {
  return {
    id: uid('q'),
    templateId: o.templateId,
    skill: o.skill,
    world: o.world,
    difficulty: o.difficulty,
    kind: 'numeric',
    prompt: o.prompt,
    given: o.given,
    diagram: o.diagram,
    visual: o.visual,
    answer: o.answer,
    tolerance: o.tolerance,
    unit: o.unit,
    correctText: o.format(o.answer) + (o.unit ? ` ${o.unit}` : ''),
    hints: o.hints,
    explanation: o.explanation,
    mistakeCategory: o.mistake ?? 'arithmetic',
    isCalc: true,
  };
}

/** Checks a user's answer against a question. */
export function isCorrect(q: Question, given: string | number | null): boolean {
  if (given === null || given === undefined) return false;
  if (q.kind === 'mc') return given === q.answer;
  const v = typeof given === 'number' ? given : parseFloat(String(given).replace(/[$,%\s]/g, ''));
  if (!Number.isFinite(v)) return false;
  const target = q.answer as number;
  const tol = q.tolerance ?? Math.max(0.01, Math.abs(target) * 0.005);
  return Math.abs(v - target) <= tol;
}

/** Text of the choice the user picked (for the mistake notebook). */
export function givenText(q: Question, given: string | number | null): string {
  if (given === null || given === undefined || given === '') return '(no answer)';
  if (q.kind === 'mc') return q.choices?.find((c) => c.id === given)?.label ?? String(given);
  return String(given) + (q.unit ? ` ${q.unit}` : '');
}

/** Mistake category for a wrong answer. */
export function mistakeFor(q: Question, given: string | number | null): MistakeCategoryId {
  if (q.kind === 'mc') {
    const c = q.choices?.find((x) => x.id === given);
    return c?.mistake ?? q.mistakeCategory ?? (q.isCalc ? 'arithmetic' : 'vocab');
  }
  return q.mistakeCategory ?? 'arithmetic';
}

/** XP for an answer. */
export function xpFor(q: Question, correct: boolean, hintsUsed: number): number {
  if (!correct) return 0;
  const hard = q.difficulty === 'hard' || q.difficulty === 'exam';
  if (hard) return Math.max(10, 20 - hintsUsed * 4);
  if (hintsUsed === 0) return 15;
  return Math.max(6, 10 - (hintsUsed - 1) * 3);
}

export const fmtInt = (v: number) => Math.round(v).toLocaleString('en-US');
export const fmt2 = (v: number) => v.toFixed(2);
export const fmtMoney0 = (v: number) => '$' + Math.round(v).toLocaleString('en-US');
export const fmtMoney2 = (v: number) =>
  '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtPct = (v: number) => `${Math.round(v * 100)}%`;
export const fmtDec2 = (v: number) => v.toFixed(2);
