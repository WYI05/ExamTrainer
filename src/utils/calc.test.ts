import { describe, it, expect } from 'vitest';
import {
  eoq,
  holdingCostFromRate,
  efficiency,
  theoreticalMin,
  theoreticalMinRaw,
  idleTime,
  teu,
  effectiveCycleTime,
  eoqDirection,
  cycleTimeCourse,
  cycleTimeRaw,
  annualOrderingCost,
  annualHoldingCost,
  totalCost,
  purchaseCost,
  weeklyDemand,
  weeksBetweenOrders,
  ordersPerYear,
  practicalQuantities,
} from './calc';

describe('EOQ', () => {
  it('D=3000 S=400 H=38 → ≈251.31 (closest MC 251)', () => {
    const v = eoq(3000, 400, 38);
    expect(v).toBeCloseTo(251.31, 2);
    expect(Math.round(v)).toBe(251);
  });

  it('D=6400 S=800 C=100 rate=30% → H=30, EOQ ≈584.24', () => {
    const H = holdingCostFromRate(100, 0.3);
    expect(H).toBeCloseTo(30, 9);
    expect(eoq(6400, 800, H)).toBeCloseTo(584.24, 2);
  });

  it('EOQ intuition: AHC=80000 AOC=40000 → EOQ < current Q', () => {
    expect(eoqDirection(80000, 40000)).toBe('less');
    expect(eoqDirection(40000, 80000)).toBe('greater');
    expect(eoqDirection(5000, 5000)).toBe('equal');
  });
});

describe('Buckshot Electronics lab', () => {
  const D = 7800;
  const C = 175;
  const H = holdingCostFromRate(C, 0.35);
  const S = 250 + 125 + 25 + 25 + 50;
  const Q = 900;

  it('inputs', () => {
    expect(H).toBeCloseTo(61.25, 9);
    expect(S).toBe(475);
    expect(weeklyDemand(D)).toBe(150);
    expect(ordersPerYear(D, Q)).toBeCloseTo(8.6667, 4);
  });

  it('cost pieces at Q=900', () => {
    expect(purchaseCost(D, C)).toBe(1365000);
    expect(annualOrderingCost(D, Q, S)).toBeCloseTo(4116.67, 2);
    expect(annualHoldingCost(Q, H)).toBeCloseTo(27562.5, 9);
    expect(totalCost(D, C, Q, S, H)).toBeCloseTo(1396679.17, 2);
  });

  it('EOQ and practical order quantity', () => {
    const e = eoq(D, S, H);
    expect(e).toBeCloseTo(347.82, 2);
    expect(Math.round(e)).toBe(348);
    expect(weeksBetweenOrders(348, D)).toBeCloseTo(2.32, 2);
    const p = practicalQuantities(e, 100);
    expect(p.below).toBe(300);
    expect(p.above).toBe(400);
    expect(annualHoldingCost(300, H)).toBeCloseTo(9187.5, 9);
    expect(annualOrderingCost(D, 300, S)).toBeCloseTo(12350, 9);
    expect(totalCost(D, C, 300, S, H)).toBeCloseTo(1386537.5, 9);
    expect(totalCost(D, C, Q, S, H) - totalCost(D, C, 300, S, H)).toBeCloseTo(10141.67, 1);
  });
});

describe('Line balancing', () => {
  it('efficiency t=224 n=5 c=95 → ≈0.47158', () => {
    expect(efficiency(224, 5, 95)).toBeCloseTo(0.47158, 4);
  });

  it('TM t=224 c=55 → raw 4.0727, course answer 5', () => {
    expect(theoreticalMinRaw(224, 55)).toBeCloseTo(4.0727, 3);
    expect(theoreticalMin(224, 55)).toBe(5);
  });

  it('TM t=224 c=80 → 3', () => {
    expect(theoreticalMin(224, 80)).toBe(3);
  });

  it('idle t=271 n=4 c=80 → 49', () => {
    expect(idleTime(271, 4, 80)).toBe(49);
  });

  it('effective CT [45,75,45,70,55] → 75', () => {
    expect(effectiveCycleTime([45, 75, 45, 70, 55])).toBe(75);
  });

  it('cycle time never rounds up: 28800/370 → 77', () => {
    expect(cycleTimeRaw(28800, 370)).toBeCloseTo(77.84, 2);
    expect(cycleTimeCourse(28800, 370)).toBe(77);
  });

  it('Lab 2 numbers', () => {
    expect(theoreticalMinRaw(537, 77)).toBeCloseTo(6.974, 3);
    expect(theoreticalMin(537, 77)).toBe(7);
    expect(efficiency(537, 7, 77)).toBeCloseTo(0.996, 3);
    expect(idleTime(537, 7, 77)).toBe(2);
    expect(efficiency(537, 10, 77)).toBeCloseTo(0.697, 3);
    expect(idleTime(537, 10, 77)).toBe(233);
    expect(idleTime(537, 9, 77)).toBe(156);
    expect(efficiency(537, 9, 77)).toBeCloseTo(0.775, 3);
    expect(efficiency(224, 3, 85)).toBeCloseTo(0.878, 3);
  });
});

describe('TEU', () => {
  it('100 twenty-foot + 250 forty-foot → 600', () => {
    expect(teu(100, 250)).toBe(600);
  });
});
