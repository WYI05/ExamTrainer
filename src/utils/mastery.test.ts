import { describe, it, expect } from 'vitest';
import { skillMastery, masteryTier } from './mastery';

describe('mastery', () => {
  it('one correct answer is not Mastered', () => {
    const m = skillMastery({ attempts: 1, correct: 1, recent: [1], recentTimes: [5000], lastSeen: 0 });
    expect(m).toBeLessThan(50);
    expect(masteryTier(m)).toBe('Learning');
  });

  it('eight correct answers reaches Mastered', () => {
    const m = skillMastery({ attempts: 8, correct: 8, recent: [1, 1, 1, 1, 1, 1, 1, 1], recentTimes: [], lastSeen: 0 });
    expect(m).toBeGreaterThanOrEqual(90);
    expect(masteryTier(m)).toBe('Mastered');
  });

  it('mixed recent accuracy lands in Developing / Exam Ready', () => {
    const m = skillMastery({ attempts: 10, correct: 7, recent: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1], recentTimes: [], lastSeen: 0 });
    expect(['Developing', 'Exam Ready']).toContain(masteryTier(m));
  });

  it('never attempted is 0', () => {
    expect(skillMastery(undefined)).toBe(0);
    expect(masteryTier(0)).toBe('Never attempted');
  });
});
