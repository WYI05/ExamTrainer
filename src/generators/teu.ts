import type { Question } from '@/types';
import { teu } from '@/utils/calc';
import { defaultRng, pick, randStep } from '@/utils/random';
import { fmtInt, mcCalc, numeric } from './common';
import type { GenOpts } from './eoq';

export function genTeu(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'easy';
  const twenty = difficulty === 'easy' ? randStep(10, 200, 10, rnd) : randStep(15, 480, 5, rnd);
  const forty = difficulty === 'easy' ? randStep(10, 300, 10, rnd) : randStep(15, 480, 5, rnd);
  const answer = teu(twenty, forty);
  const explanation = {
    steps: [`20-ft: ${twenty} × 1 = ${twenty} TEU`, `40-ft: ${forty} × 2 = ${forty * 2} TEU`, `Total = ${twenty} + ${forty * 2} = ${answer} TEUs`],
    fastRule: 'TEU = 20-ft count + 2 × 40-ft count.',
    memoryTrick: '40 is two 20s.',
  };
  const hints: [string, string] = ['How many TEUs is one 40-foot container?', 'TEU = twenty + 2 × forty.'];
  const given = [`${twenty} twenty-foot containers`, `${forty} forty-foot containers`];
  const prompt = pick(
    [
      'A ship carries the containers listed. How many TEUs is that?',
      'A port handled the containers shown today. What is the total in TEUs?',
      'How many TEUs are in this shipment?',
    ],
    rnd,
  );
  if (opts.numeric) {
    return numeric({
      skill: 'teu',
      world: 'w4',
      difficulty,
      prompt,
      given,
      answer,
      tolerance: 0.5,
      unit: 'TEU',
      format: fmtInt,
      hints,
      explanation,
      mistake: 'teu-40',
    });
  }
  return mcCalc({
    skill: 'teu',
    world: 'w4',
    difficulty,
    prompt,
    given,
    correct: answer,
    format: fmtInt,
    distractors: [
      { value: twenty + forty, mistake: 'teu-40' },
      { value: 2 * twenty + forty, mistake: 'teu-40' },
      { value: 2 * (twenty + forty), mistake: 'teu-40' },
      { value: twenty + forty / 2, mistake: 'teu-40' },
    ],
    hints,
    explanation,
    defaultMistake: 'teu-40',
    rnd,
  });
}

/** Reverse TEU drill: given TEUs and 20-ft count, find 40-ft count. */
export function genTeuReverse(opts: GenOpts = {}): Question {
  const rnd = opts.rnd ?? defaultRng;
  const difficulty = opts.difficulty ?? 'medium';
  const twenty = randStep(10, 200, 10, rnd);
  const forty = randStep(10, 200, 10, rnd);
  const total = teu(twenty, forty);
  return mcCalc({
    skill: 'teu',
    world: 'w4',
    difficulty,
    prompt: 'How many forty-foot containers are in this shipment?',
    given: [`Total = ${total} TEUs`, `${twenty} twenty-foot containers`],
    correct: forty,
    format: fmtInt,
    distractors: [
      { value: total - twenty, mistake: 'teu-40' },
      { value: (total - twenty) * 2, mistake: 'teu-40' },
      { value: total / 2, mistake: 'arithmetic' },
      { value: forty + 10, mistake: 'arithmetic' },
    ],
    hints: ['Subtract the 20-ft TEUs first.', 'Remaining TEUs ÷ 2 = number of 40-ft containers.'],
    explanation: {
      steps: [`TEUs from 40-ft = ${total} − ${twenty} = ${total - twenty}`, `40-ft containers = ${total - twenty} / 2 = ${forty}`],
      fastRule: 'Each 40-ft = 2 TEU, so divide the leftover TEUs by 2.',
    },
    defaultMistake: 'teu-40',
    rnd,
  });
}
