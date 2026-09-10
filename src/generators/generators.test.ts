import { describe, it, expect } from 'vitest';
import { mulberry32 } from '@/utils/random';
import { CONCEPTS } from '@/data/concepts';
import { SKILLS } from '@/data/worlds';
import { conceptFromTemplate } from './concept';
import { examSet, diagnosticSet, questionForSkill, sprintQuestion, bossSet } from './index';
import { buckshotBoss, lab2Boss } from '@/data/bosses';
import { isCorrect } from './common';
import type { Question } from '@/types';

function assertWellFormed(q: Question) {
  expect(q.prompt.length).toBeGreaterThan(5);
  expect(q.hints).toHaveLength(2);
  expect(q.explanation.steps.length).toBeGreaterThan(0);
  expect(q.explanation.fastRule.length).toBeGreaterThan(0);
  if (q.kind === 'mc') {
    expect(q.choices).toBeDefined();
    expect(q.choices!.length).toBe(4);
    const labels = q.choices!.map((c) => c.label.trim().toLowerCase());
    expect(new Set(labels).size).toBe(4);
    const correct = q.choices!.find((c) => c.id === q.answer);
    expect(correct).toBeDefined();
    expect(correct!.label).toBe(q.correctText);
    expect(isCorrect(q, q.answer)).toBe(true);
    for (const c of q.choices!) if (c.id !== q.answer) expect(isCorrect(q, c.id)).toBe(false);
  } else {
    expect(typeof q.answer).toBe('number');
    expect(Number.isFinite(q.answer)).toBe(true);
    expect(isCorrect(q, q.answer)).toBe(true);
  }
}

describe('generators produce well-formed questions', () => {
  it('every skill generates valid questions at every difficulty (many seeds)', () => {
    const rnd = mulberry32(7);
    for (const s of SKILLS) {
      for (const difficulty of ['easy', 'medium', 'hard', 'exam'] as const) {
        for (let i = 0; i < 12; i++) {
          const q = questionForSkill(s.id, { difficulty, rnd, numericChance: 0.3 });
          assertWellFormed(q);
          expect(q.skill).toBeDefined();
        }
      }
    }
  });

  it('concept templates all build', () => {
    const rnd = mulberry32(3);
    for (const t of CONCEPTS) {
      expect(t.distractors.length).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < 3; i++) assertWellFormed(conceptFromTemplate(t, rnd));
    }
  });

  it('exam set has 40 well-formed questions', () => {
    const rnd = mulberry32(11);
    for (let s = 0; s < 5; s++) {
      const exam = examSet({ rnd });
      expect(exam).toHaveLength(40);
      exam.forEach(assertWellFormed);
      expect(exam.every((q) => q.kind === 'mc')).toBe(true);
    }
  });

  it('diagnostic has 8 questions covering the required areas', () => {
    const d = diagnosticSet(mulberry32(5));
    expect(d).toHaveLength(8);
    d.forEach(assertWellFormed);
    const skills = d.map((q) => q.skill);
    expect(skills).toContain('procurement');
    expect(skills).toContain('eoq');
    expect(skills).toContain('eoq-intuition');
    expect(skills).toContain('cycle-time');
    expect(skills).toContain('theoretical-min');
    expect(skills).toContain('precedence');
    expect(skills).toContain('teu');
  });

  it('sprint questions and bosses are well-formed', () => {
    const rnd = mulberry32(9);
    for (let i = 0; i < 60; i++) assertWellFormed(sprintQuestion('sixty', rnd));
    for (let i = 0; i < 60; i++) assertWellFormed(sprintQuestion('fiveMin', rnd));
    bossSet('w1', rnd).forEach(assertWellFormed);
    bossSet('w4', rnd).forEach(assertWellFormed);
    buckshotBoss(rnd).flatMap((s) => s.questions).forEach(assertWellFormed);
    lab2Boss(rnd).flatMap((s) => s.questions).forEach(assertWellFormed);
  });

  it('at least 150 distinct questions are available', () => {
    const rnd = mulberry32(21);
    const prompts = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const q = sprintQuestion(i % 2 ? 'sixty' : 'fiveMin', rnd);
      prompts.add(q.prompt + '|' + (q.given ?? []).join(';'));
    }
    examSet({ rnd }).forEach((q) => prompts.add(q.prompt + '|' + (q.given ?? []).join(';')));
    expect(prompts.size).toBeGreaterThanOrEqual(150);
  });
});
