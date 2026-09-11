import type { Sample } from "./simulate.js";

export interface Stop {
  /** position along the duration, 0..1 */
  at: number;
  value: number;
}

/* Ramer–Douglas–Peucker on (at, value): keeps the bends, drops the straights. */

function simplify(pts: Stop[], tol: number): Stop[] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const A = pts[a];
    const B = pts[b];
    const dx = B.at - A.at;
    const dy = B.value - A.value;
    const len = Math.hypot(dx, dy) || 1;
    let worst = -1;
    let worstD = tol;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (pts[i].at - A.at) - dx * (pts[i].value - A.value)) / len;
      if (d > worstD) {
        worstD = d;
        worst = i;
      }
    }
    if (worst < 0) continue;
    keep[worst] = 1;
    stack.push([a, worst], [worst, b]);
  }
  return pts.filter((_, i) => keep[i]);
}

/* tolerance tuned so the four presets land at 20–35 stops (~250 bytes) */
const DEFAULT_TOL = 0.002;
const TOL_STEP = 1.15;

export function toStops(samples: Sample[], duration: number, maxPoints: number): Stop[] {
  /* Samples past `duration` (a physical spring settling after MAX_DURATION)
     would all collapse onto at=1 with different values: a vertical stack plus
     a jump to the pinned end. Drop them; the played window ends at duration. */
  const inWindow = samples.filter((s) => s.t <= duration);
  const pts: Stop[] = inWindow.map((s) => ({ at: s.t / duration, value: s.x }));
  /* A sub-millisecond duration can leave only t=0 in the window; push the
     pinned end then instead of overwriting the start. */
  if (pts.length < 2) pts.push({ at: 1, value: 1 });
  else pts[pts.length - 1] = { at: 1, value: 1 };
  let tol = DEFAULT_TOL;
  let out = simplify(pts, tol);
  while (out.length > maxPoints) {
    tol *= TOL_STEP;
    out = simplify(pts, tol);
  }
  return out;
}

const round = (n: number, places: number) => +n.toFixed(places);

export function toLinear(stops: Stop[]): string {
  const inner = stops.map((s, i) =>
    i === 0 || i === stops.length - 1
      ? String(round(s.value, 4))
      : `${round(s.value, 4)} ${round(s.at * 100, 1)}%`,
  );
  return `linear(${inner.join(", ")})`;
}
