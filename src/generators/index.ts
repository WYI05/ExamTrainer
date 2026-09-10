import type { Difficulty, Question, SkillId, WorldId } from '@/types';
import { SKILL_MAP, WORLD_MAP } from '@/data/worlds';
import { defaultRng, pick, shuffle, type Rng } from '@/utils/random';
import { conceptById, conceptForSkill, conceptsForWorld } from './concept';
import {
  genAHC,
  genAOC,
  genEoq,
  genEoqIntuition,
  genHoldingCost,
  genInventoryRandom,
  genOrderingRestrictions,
  genOrdersPerYear,
  genPipeline,
  genPurchaseCost,
  genTimeBetweenOrders,
  genTotalCost,
  genWeeklyDemand,
  type GenOpts,
} from './eoq';
import { genFormulaRecognition } from './formulaRecognition';
import {
  genCtThenTm,
  genCycleTime,
  genEffectiveCT,
  genEfficiency,
  genIdle,
  genLineBalancingRandom,
  genRoundingRule,
  genTheoreticalMin,
} from './lineBalancing';
import {
  fixedLab2Layout,
  fixedLab2NotAcceptableADJ,
  fixedLab2NotAcceptableBF,
  fixedNextStationG1,
  fixedNextStationG2,
  genDiagramCalc,
  genEligibleTask,
  genLayoutVerdict,
  genNextStation,
  genPrecedenceRandom,
  genStationCheck,
} from './precedence';
import { genTeu, genTeuReverse } from './teu';

export type Generator = (opts?: GenOpts) => Question;

/** Skill → generators. Concept-only skills fall back to the concept bank. */
const SKILL_GENERATORS: Partial<Record<SkillId, Generator[]>> = {
  eoq: [genEoq],
  'holding-cost': [genHoldingCost],
  'purchase-cost': [genPurchaseCost],
  aoc: [genAOC],
  ahc: [genAHC],
  'total-cost': [genTotalCost],
  'orders-per-year': [genOrdersPerYear],
  'weekly-demand': [genWeeklyDemand],
  'time-between-orders': [genTimeBetweenOrders],
  pipeline: [genPipeline],
  'eoq-intuition': [genEoqIntuition],
  'ordering-restrictions': [genOrderingRestrictions],
  'cycle-time': [genCycleTime],
  'theoretical-min': [genTheoreticalMin, genCtThenTm],
  efficiency: [genEfficiency],
  'idle-time': [genIdle],
  'effective-ct': [genEffectiveCT],
  precedence: [genNextStation, genLayoutVerdict, genEligibleTask, genStationCheck],
  'rounding-rules': [genRoundingRule],
  teu: [genTeu, genTeuReverse],
  'formula-recognition': [genFormulaRecognition],
};

export interface SkillGenOpts extends GenOpts {
  /** Probability (0-1) of producing a numeric-entry question for calc skills. */
  numericChance?: number;
}

/** One question for a skill. Mixes generators with the concept bank where both exist. */
export function questionForSkill(skill: SkillId, opts: SkillGenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const gens = SKILL_GENERATORS[skill];
  const concept = conceptForSkill(skill, rnd);
  const useNumeric = opts.numeric ?? (opts.numericChance !== undefined ? rnd() < opts.numericChance : false);
  if (gens && gens.length) {
    // Blend in concept questions occasionally for skills that have both.
    if (concept && rnd() < 0.25 && opts.difficulty !== 'exam') return concept;
    return pick(gens, rnd)({ difficulty: opts.difficulty, rnd, numeric: useNumeric });
  }
  if (concept) return concept;
  // Should not happen; every skill has a source. Fallback to formula recognition.
  return genFormulaRecognition({ difficulty: opts.difficulty, rnd });
}

/** Re-ask a saved mistake: concept template if known, otherwise same skill. */
export function questionForMistake(skill: SkillId, templateId: string | undefined, rnd: Rng = defaultRng): Question {
  if (templateId) {
    const q = conceptById(templateId, rnd);
    if (q) return q;
  }
  return questionForSkill(skill, { rnd, difficulty: 'medium' });
}

/** A set of n questions across the skills of a world. */
export function worldSet(world: WorldId, n: number, difficulty: Difficulty, opts: SkillGenOpts = {}): Question[] {
  const rnd = opts.rnd ?? defaultRng;
  const skills = WORLD_MAP[world].skills;
  const out: Question[] = [];
  const order = shuffle(skills, rnd);
  for (let i = 0; i < n; i++) {
    const skill = order[i % order.length];
    out.push(questionForSkill(skill, { ...opts, difficulty, rnd }));
  }
  return shuffle(out, rnd);
}

/** Mixed set weighted by world importance. */
export function mixedSet(n: number, difficulty: Difficulty, opts: SkillGenOpts = {}): Question[] {
  const rnd = opts.rnd ?? defaultRng;
  const out: Question[] = [];
  const weights: [WorldId, number][] = [
    ['w1', 0.2],
    ['w2', 0.3],
    ['w3', 0.3],
    ['w4', 0.2],
  ];
  for (let i = 0; i < n; i++) {
    const r = rnd();
    let acc = 0;
    let world: WorldId = 'w2';
    for (const [w, p] of weights) {
      acc += p;
      if (r <= acc) {
        world = w;
        break;
      }
    }
    if (rnd() < 0.08) out.push(genFormulaRecognition({ difficulty, rnd }));
    else out.push(questionForSkill(pick(WORLD_MAP[world].skills, rnd), { ...opts, difficulty, rnd }));
  }
  return out;
}

/** Full 40-question exam, distributed ~20/30/30/20 with course-style mix. */
export function examSet(opts: { rnd?: Rng; difficulty?: Difficulty } = {}): Question[] {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'exam';
  const w1 = conceptsForWorld('w1', 7, rnd);
  while (w1.length < 8) w1.push(questionForSkill(pick(WORLD_MAP.w1.skills, rnd), { difficulty, rnd }));

  const w2: Question[] = [
    genEoq({ difficulty: 'medium', rnd }),
    genEoq({ difficulty: 'hard', rnd }),
    genHoldingCost({ difficulty: 'medium', rnd }),
    genOrdersPerYear({ difficulty: 'medium', rnd }),
    genTimeBetweenOrders({ difficulty: 'medium', rnd }),
    genWeeklyDemand({ difficulty: 'easy', rnd }),
    genAOC({ difficulty: 'medium', rnd }),
    genAHC({ difficulty: 'medium', rnd }),
    genTotalCost({ difficulty: 'hard', rnd }),
    genEoqIntuition({ difficulty: 'medium', rnd }),
    genOrderingRestrictions({ difficulty: 'hard', rnd }),
    ...conceptsForWorld('w2', 1, rnd),
  ];

  const w3: Question[] = [
    genCycleTime({ difficulty: 'medium', rnd }),
    genTheoreticalMin({ difficulty: 'medium', rnd }),
    genCtThenTm({ difficulty: 'hard', rnd }),
    genEfficiency({ difficulty: 'medium', rnd }),
    genIdle({ difficulty: 'medium', rnd }),
    genEffectiveCT({ difficulty: 'medium', rnd }),
    genRoundingRule({ difficulty: 'easy', rnd }),
    genNextStation({ difficulty: 'hard', rnd }),
    genLayoutVerdict({ difficulty: 'hard', rnd }),
    genDiagramCalc({ difficulty: 'hard', rnd }),
    pick([fixedLab2Layout('A', rnd), fixedLab2Layout('B', rnd), fixedLab2Layout('C', rnd)], rnd),
    pick([fixedNextStationG1(rnd, 'hard'), fixedNextStationG2(rnd, 'hard'), fixedLab2NotAcceptableBF(rnd), fixedLab2NotAcceptableADJ(rnd)], rnd),
  ];

  const w4 = conceptsForWorld('w4', 6, rnd);
  w4.push(genTeu({ difficulty: 'medium', rnd }), genTeuReverse({ difficulty: 'medium', rnd }));

  const all = [...w1.slice(0, 8), ...w2.slice(0, 12), ...w3.slice(0, 12), ...w4.slice(0, 8)];
  while (all.length < 40) all.push(mixedSet(1, difficulty, { rnd })[0]);
  return shuffle(all.slice(0, 40), rnd);
}

/** 8-question diagnostic — one per key area. */
export function diagnosticSet(rnd: Rng = defaultRng): Question[] {
  return [
    conceptById('c-procurement-1', rnd)!,
    genEoq({ difficulty: 'easy', rnd }),
    genEoqIntuition({ difficulty: 'easy', rnd }),
    genCycleTime({ difficulty: 'easy', rnd }),
    genTheoreticalMin({ difficulty: 'easy', rnd }),
    fixedNextStationG1(rnd, 'easy'),
    genTeu({ difficulty: 'easy', rnd }),
    conceptById(pick(['c-bulk-1', 'c-pallets-1', 'c-doublestack-1'], rnd), rnd)!,
  ];
}

/** Sprint question source. */
export function sprintQuestion(kind: 'sixty' | 'fiveMin', rnd: Rng = defaultRng): Question {
  if (kind === 'sixty') {
    const r = rnd();
    if (r < 0.45) {
      const world = pick(['w1', 'w4', 'w1', 'w4', 'w2', 'w3'] as WorldId[], rnd);
      return conceptsForWorld(world, 1, rnd)[0] ?? genFormulaRecognition({ difficulty: 'easy', rnd });
    }
    if (r < 0.7) return genFormulaRecognition({ difficulty: 'easy', rnd });
    return pick([genTeu, genOrdersPerYear, genWeeklyDemand, genEffectiveCT, genRoundingRule, genHoldingCost, genPipeline], rnd)({
      difficulty: 'easy',
      rnd,
    });
  }
  return pick(
    [genEoq, genEoq, genAOC, genAHC, genTotalCost, genTimeBetweenOrders, genOrdersPerYear, genCycleTime, genTheoreticalMin, genEfficiency, genIdle, genTeu, genCtThenTm],
    rnd,
  )({ difficulty: pick(['easy', 'medium', 'medium'] as Difficulty[], rnd), rnd });
}

/** World boss question sets (excluding the special multi-stage bosses, which live in data/bosses.ts). */
export function bossSet(world: WorldId, rnd: Rng = defaultRng): Question[] {
  if (world === 'w1') {
    const qs = conceptsForWorld('w1', 10, rnd);
    return shuffle(qs, rnd);
  }
  if (world === 'w4') {
    const qs = conceptsForWorld('w4', 7, rnd);
    qs.push(genTeu({ difficulty: 'medium', rnd }), genTeu({ difficulty: 'hard', rnd }), genTeuReverse({ difficulty: 'medium', rnd }));
    return shuffle(qs, rnd);
  }
  return [];
}

export function randomFor(world: WorldId, difficulty: Difficulty, rnd: Rng = defaultRng): Question {
  if (world === 'w2') return genInventoryRandom({ difficulty, rnd });
  if (world === 'w3') return rnd() < 0.5 ? genLineBalancingRandom({ difficulty, rnd }) : genPrecedenceRandom({ difficulty, rnd });
  return questionForSkill(pick(WORLD_MAP[world].skills, rnd), { difficulty, rnd });
}

export const skillLabel = (s: SkillId) => SKILL_MAP[s].label;
