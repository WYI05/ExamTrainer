// ---------------------------------------------------------------------------
// Pure calculation engine. Every generated answer is produced by these
// functions, so the question banks can never disagree with the math.
// ---------------------------------------------------------------------------

/** EOQ = sqrt(2DS / H) */
export function eoq(D: number, S: number, H: number): number {
  return Math.sqrt((2 * D * S) / H);
}

/** H from a holding-cost rate (e.g. 0.30) times unit cost C. */
export function holdingCostFromRate(C: number, rate: number): number {
  return C * rate;
}

/** Purchase cost = D × C */
export function purchaseCost(D: number, C: number): number {
  return D * C;
}

/** Annual ordering cost = (D/Q) × S */
export function annualOrderingCost(D: number, Q: number, S: number): number {
  return (D / Q) * S;
}

/** Annual holding cost = (Q/2) × H */
export function annualHoldingCost(Q: number, H: number): number {
  return (Q / 2) * H;
}

/** TC = DC + (D/Q)S + (Q/2)H */
export function totalCost(D: number, C: number, Q: number, S: number, H: number): number {
  return purchaseCost(D, C) + annualOrderingCost(D, Q, S) + annualHoldingCost(Q, H);
}

/** Orders per year = D/Q */
export function ordersPerYear(D: number, Q: number): number {
  return D / Q;
}

/** Weekly demand = D/52 */
export function weeklyDemand(D: number): number {
  return D / 52;
}

/** Time between orders in weeks = (Q/D) × 52 */
export function weeksBetweenOrders(Q: number, D: number): number {
  return (Q / D) * 52;
}

/** Pipeline inventory = d × L */
export function pipelineInventory(d: number, L: number): number {
  return d * L;
}

export type EoqDirection = 'less' | 'greater' | 'equal';

/**
 * At EOQ, AOC = AHC.
 *  AHC > AOC → Q is too large → EOQ is LESS than current Q.
 *  AOC > AHC → Q is too small → EOQ is GREATER than current Q.
 */
export function eoqDirection(AHC: number, AOC: number): EoqDirection {
  if (Math.abs(AHC - AOC) < 1e-9) return 'equal';
  return AHC > AOC ? 'less' : 'greater';
}

/** Practical order quantities near EOQ that obey an increment restriction. */
export function practicalQuantities(eoqValue: number, increment: number): { below: number; above: number } {
  const below = Math.floor(eoqValue / increment) * increment;
  const above = Math.ceil(eoqValue / increment) * increment;
  return { below: below === 0 ? increment : below, above: above === below ? above + increment : above };
}

// ---------------------------------------------------------------------------
// Line balancing
// ---------------------------------------------------------------------------

/** Raw cycle time = OT / D (do not round). */
export function cycleTimeRaw(OT: number, D: number): number {
  return OT / D;
}

/**
 * Course rule: NEVER round cycle time up. Rounding up would give every unit
 * more time and the line would miss the required output.
 */
export function cycleTimeCourse(OT: number, D: number): number {
  return Math.floor(cycleTimeRaw(OT, D));
}

/** Theoretical minimum workstations (raw) = t / c */
export function theoreticalMinRaw(t: number, c: number): number {
  return t / c;
}

/** Course rule: ALWAYS round the number of workstations up. */
export function theoreticalMin(t: number, c: number): number {
  return Math.ceil(theoreticalMinRaw(t, c) - 1e-9);
}

/** Efficiency = t / (n × c) */
export function efficiency(t: number, n: number, c: number): number {
  return t / (n * c);
}

/** Idle time = n × c − t */
export function idleTime(t: number, n: number, c: number): number {
  return n * c - t;
}

/** Effective cycle time of an existing line = longest workstation time. */
export function effectiveCycleTime(stationTimes: number[]): number {
  return Math.max(...stationTimes);
}

/** Seconds available per day from hours per day. */
export function secondsPerDay(hours: number): number {
  return hours * 60 * 60;
}

// ---------------------------------------------------------------------------
// Logistics
// ---------------------------------------------------------------------------

/** TEU = (20-ft count) + 2 × (40-ft count) */
export function teu(twenty: number, forty: number): number {
  return twenty + 2 * forty;
}

// ---------------------------------------------------------------------------
// Rounding helpers
// ---------------------------------------------------------------------------

export function round(value: number, decimals = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function approxEqual(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance;
}
