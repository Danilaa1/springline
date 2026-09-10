import type { Stop } from "./linear.js";

/* y at progress u for cubic-bezier(x1, y1, x2, y2), Newton on the x polynomial */

function bezierY(x1: number, y1: number, x2: number, y2: number, u: number): number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  let t = u;
  for (let i = 0; i < 8; i++) {
    const x = ((ax * t + bx) * t + cx) * t - u;
    const dx = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(x) < 1e-6 || dx === 0) break;
    t -= x / dx;
  }
  return ((ay * t + by) * t + cy) * t;
}

const X1 = [0.2, 0.3, 0.4, 0.5];
const Y1 = [0.8, 1, 1.2, 1.4, 1.6, 1.8, 2];
const X2 = [0.2, 0.4, 0.6, 0.8];
const SAMPLES = 32;

function sampleAt(stops: Stop[], u: number): number {
  let i = 1;
  while (i < stops.length - 1 && stops[i].at < u) i++;
  const a = stops[i - 1];
  const b = stops[i];
  const span = b.at - a.at || 1;
  return a.value + ((b.value - a.value) * (u - a.at)) / span;
}

/* the closest ease-out bezier by least squares; y1 > 1 is the only way a bezier overshoots */

export function closestBezier(stops: Stop[]): string {
  let best = "";
  let bestErr = Infinity;
  for (const x1 of X1)
    for (const y1 of Y1)
      for (const x2 of X2) {
        let err = 0;
        for (let i = 1; i < SAMPLES; i++) {
          const u = i / SAMPLES;
          err += (bezierY(x1, y1, x2, 1, u) - sampleAt(stops, u)) ** 2;
        }
        if (err < bestErr) {
          bestErr = err;
          best = `cubic-bezier(${x1}, ${y1}, ${x2}, 1)`;
        }
      }
  return best;
}
