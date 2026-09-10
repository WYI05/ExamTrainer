import type { Difficulty, Question, SkillId } from '@/types';
import { CONCEPTS, CONCEPT_MAP, type ConceptTemplate } from '@/data/concepts';
import { pick, pickN, type Rng, defaultRng } from '@/utils/random';
import { mcText } from './common';

export function conceptFromTemplate(t: ConceptTemplate, rnd: Rng = defaultRng, difficulty?: Difficulty): Question {
  const prompt = pick(t.prompts, rnd);
  const wrong = pickN(t.distractors, Math.min(3, t.distractors.length), rnd).map((label) => ({ label }));
  return mcText({
    templateId: t.id,
    skill: t.skill,
    world: t.world,
    difficulty: difficulty ?? t.difficulty,
    prompt,
    correct: t.correct,
    wrong,
    hints: t.hints,
    explanation: { steps: t.why, fastRule: t.fastRule, memoryTrick: t.memoryTrick },
    defaultMistake: t.mistake ?? 'vocab',
    rnd,
  });
}

export function conceptById(id: string, rnd: Rng = defaultRng): Question | null {
  const t = CONCEPT_MAP[id];
  return t ? conceptFromTemplate(t, rnd) : null;
}

export function conceptForSkill(skill: SkillId, rnd: Rng = defaultRng): Question | null {
  const pool = CONCEPTS.filter((c) => c.skill === skill);
  if (!pool.length) return null;
  return conceptFromTemplate(pick(pool, rnd), rnd);
}

export function conceptsForWorld(world: string, n: number, rnd: Rng = defaultRng): Question[] {
  const pool = CONCEPTS.filter((c) => c.world === world);
  return pickN(pool, Math.min(n, pool.length), rnd).map((t) => conceptFromTemplate(t, rnd));
}

export function conceptSkills(): SkillId[] {
  return Array.from(new Set(CONCEPTS.map((c) => c.skill)));
}
