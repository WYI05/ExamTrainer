// Small RNG helpers. Math.random is fine for study variety; a seeded RNG is
// exposed for deterministic tests.

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const defaultRng: Rng = () => Math.random();

export function randInt(min: number, max: number, rnd: Rng = defaultRng): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

export function pick<T>(arr: readonly T[], rnd: Rng = defaultRng): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export function pickN<T>(arr: readonly T[], n: number, rnd: Rng = defaultRng): T[] {
  return shuffle(arr, rnd).slice(0, n);
}

export function shuffle<T>(arr: readonly T[], rnd: Rng = defaultRng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Random multiple of `step` in [min, max]. */
export function randStep(min: number, max: number, step: number, rnd: Rng = defaultRng): number {
  const lo = Math.ceil(min / step);
  const hi = Math.floor(max / step);
  return randInt(lo, hi, rnd) * step;
}

let counter = 0;
export function uid(prefix = 'q'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}
