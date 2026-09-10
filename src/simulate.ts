/* m·x'' = -k(x − 1) − c·x', semi-implicit Euler. */

export const STEP = 1 / 1000;
const SETTLE_POS = 5e-4;
const SETTLE_VEL = 5e-3;
const MIN_TIME = 0.05;
const MAX_TIME = 10;

export interface Sample {
  t: number;
  x: number;
}

export function simulate(k: number, c: number, m: number, v0: number, until?: number): Sample[] {
  const out: Sample[] = [{ t: 0, x: 0 }];
  let x = 0;
  let v = v0;
  let t = 0;
  const end = until ?? MAX_TIME;
  while (t < end) {
    const a = (-k * (x - 1) - c * v) / m;
    v += a * STEP;
    x += v * STEP;
    t += STEP;
    out.push({ t, x });
    if (until === undefined && t > MIN_TIME && Math.abs(x - 1) < SETTLE_POS && Math.abs(v) < SETTLE_VEL) break;
  }
  return out;
}
