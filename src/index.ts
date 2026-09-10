import { simulate } from "./simulate.js";
import { toStops, toLinear, type Stop } from "./linear.js";
import { closestBezier } from "./bezier.js";

export { presets } from "./presets.js";
export type { Stop };

export interface PhysicalSpring {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export interface DurationSpring {
  /** seconds until the spring has settled */
  duration: number;
  /** 0 = no overshoot, towards 1 = more bounce (Apple's model) */
  bounce?: number;
}

export type SpringOptions = (PhysicalSpring | DurationSpring) & {
  /** initial velocity in target-units per second; positive is towards the target */
  velocity?: number;
  /** cap on linear() stops; the default keeps the bends and drops the straights */
  points?: number;
};

export interface SpringResult {
  /** `linear(...)` for transition-timing-function or animation-timing-function */
  easing: string;
  /** seconds */
  duration: number;
  /** closest cubic-bezier for browsers without linear() */
  fallback: string;
  /** how far past the target the spring travels, 0.12 = 12% */
  overshoot: number;
  stops: Stop[];
}

const DEFAULTS = { stiffness: 180, damping: 17, mass: 1 };
const MAX_POINTS = 64;
/* the duration form scales this reference spring in time; only its shape matters */
const REF_STIFFNESS = 100;
const MIN_DURATION = 0.2;
const MAX_DURATION = 2.5;

function assert(ok: boolean, msg: string) {
  if (!ok) throw new RangeError(`springline: ${msg}`);
}

export function spring(options: SpringOptions = {}): SpringResult {
  const velocity = options.velocity ?? 0;
  const points = options.points ?? MAX_POINTS;
  assert(points >= 2, "points must be at least 2");

  let samples;
  let duration;

  if ("duration" in options) {
    const bounce = options.bounce ?? 0;
    assert(options.duration > 0, "duration must be positive");
    assert(bounce >= 0 && bounce < 1, "bounce must be in [0, 1)");
    /* damping ratio ζ = 1 − bounce; find how long the reference spring takes, then
       scale stiffness by s² and damping by s so it settles in exactly `duration` */
    const zeta = 1 - bounce;
    const refDamping = 2 * zeta * Math.sqrt(REF_STIFFNESS);
    const natural = simulate(REF_STIFFNESS, refDamping, 1, 0).at(-1)!.t;
    const s = natural / options.duration;
    samples = simulate(REF_STIFFNESS * s * s, refDamping * s, 1, velocity, options.duration);
    duration = options.duration;
  } else {
    const { stiffness, damping, mass } = { ...DEFAULTS, ...options };
    assert(stiffness > 0, "stiffness must be positive");
    assert(damping >= 0, "damping cannot be negative");
    assert(mass > 0, "mass must be positive");
    samples = simulate(stiffness, damping, mass, velocity);
    duration = Math.min(MAX_DURATION, Math.max(MIN_DURATION, samples.at(-1)!.t));
  }

  const stops = toStops(samples, duration, points);
  const peak = Math.max(...stops.map((s) => s.value));
  return {
    easing: toLinear(stops),
    duration: +duration.toFixed(3),
    fallback: closestBezier(stops),
    overshoot: Math.max(0, +(peak - 1).toFixed(4)),
    stops,
  };
}
