import { describe, it, expect } from 'vitest';
import { GRAPHS, LAB2_LAYOUTS } from '@/data/diagrams';
import { checkLayout, checkStation, totalTaskTime, eligibleTasks, buildRandomValidLayout } from './precedence';
import { mulberry32 } from './random';

describe('Practice diagram 1 (t=224)', () => {
  const g = GRAPHS.g1;
  it('total task time', () => expect(totalTaskTime(g)).toBe(224));

  it('CT=85, WS1=AE: BC valid; DF, BCD, CF invalid', () => {
    const before = new Set(['A', 'E']);
    expect(checkStation(g, before, ['B', 'C']).missing).toEqual([]);
    expect(checkStation(g, before, ['D', 'F']).missing.length).toBeGreaterThan(0);
    expect(checkLayout(g, [['A', 'E'], ['B', 'C', 'D']], 85).verdict).toBe('cycle-time');
    expect(checkLayout(g, [['A', 'E'], ['C', 'F']], 85).verdict).toBe('precedence');
    expect(checkLayout(g, [['A', 'E'], ['B', 'C']], 85).verdict).toBe('valid');
  });
});

describe('Practice diagram 2 (t=210)', () => {
  const g = GRAPHS.g2;
  it('total task time', () => expect(totalTaskTime(g)).toBe(210));
  it('CT=80, WS1=BC: AD valid; DF, EF, DE invalid', () => {
    expect(checkLayout(g, [['B', 'C'], ['A', 'D']], 80).verdict).toBe('valid');
    expect(checkLayout(g, [['B', 'C'], ['D', 'F']], 80).verdict).toBe('precedence');
    expect(checkLayout(g, [['B', 'C'], ['E', 'F']], 80).verdict).toBe('precedence');
    expect(checkLayout(g, [['B', 'C'], ['D', 'E']], 80).verdict).toBe('precedence');
  });
});

describe('Practice diagram 3 (t=271)', () => {
  const g = GRAPHS.g3;
  it('total task time', () => expect(totalTaskTime(g)).toBe(271));
  it('AC / BD / FEG / HJ at CT=80 is valid', () => {
    const r = checkLayout(g, [['A', 'C'], ['B', 'D'], ['F', 'E', 'G'], ['H', 'J']], 80);
    expect(r.verdict).toBe('valid');
    expect(r.stationTimes).toEqual([67, 70, 72, 62]);
  });
});

describe('SCM Lab 2 diagram (t=537)', () => {
  const g = GRAPHS.lab2;
  it('total task time', () => expect(totalTaskTime(g)).toBe(537));

  it('Layout A invalid because of cycle time only (IF = 82 > 77)', () => {
    const r = checkLayout(g, LAB2_LAYOUTS.A, 77);
    expect(r.verdict).toBe('cycle-time');
    expect(r.stationTimes).toEqual([77, 60, 82, 71, 57, 59, 71, 60]);
  });

  it('Layout B valid', () => {
    const r = checkLayout(g, LAB2_LAYOUTS.B, 77);
    expect(r.verdict).toBe('valid');
    expect(r.stationTimes).toEqual([67, 71, 71, 60, 60, 28, 61, 59, 60]);
  });

  it('Layout C invalid because of precedence', () => {
    const r = checkLayout(g, LAB2_LAYOUTS.C, 77);
    expect(r.verdict).toBe('precedence');
    expect(r.stationTimes).toEqual([69, 77, 51, 61, 61, 71, 28, 59, 60]);
  });

  it('WS1=ID, WS2=AC → BF not acceptable', () => {
    expect(checkLayout(g, [['I', 'D'], ['A', 'C'], ['B', 'F']], 77).verdict).toBe('precedence');
    expect(checkLayout(g, [['I', 'D'], ['A', 'C']], 77).verdict).toBe('valid');
  });

  it('WS1=IB → ADJ not acceptable', () => {
    expect(checkLayout(g, [['I', 'B']], 77).verdict).toBe('valid');
    expect(checkLayout(g, [['I', 'B'], ['A', 'D', 'J']], 77).verdict).toBe('precedence');
  });

  it('random valid layouts really are valid', () => {
    const rnd = mulberry32(42);
    for (let i = 0; i < 25; i++) {
      const layout = buildRandomValidLayout(g, 77, rnd);
      expect(checkLayout(g, layout, 77).verdict).toBe('valid');
      expect(layout.flat().sort()).toEqual(g.tasks.map((t) => t.id).sort());
    }
  });

  it('starting tasks are those with no predecessors', () => {
    expect(eligibleTasks(g, new Set()).sort()).toEqual(['A', 'B', 'C', 'I']);
  });
});
