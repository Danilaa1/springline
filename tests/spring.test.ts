import { describe, expect, it } from "vitest";
import { spring, presets } from "../src/index.js";

const stopsOf = (easing: string) => easing.slice("linear(".length, -1).split(", ");

describe("physical form", () => {
  it("starts at 0, ends at 1, settles in a sane time", () => {
    const s = spring({ stiffness: 180, damping: 17 });
    const stops = stopsOf(s.easing);
    expect(stops[0]).toBe("0");
    expect(stops.at(-1)).toBe("1");
    expect(s.duration).toBeGreaterThan(0.5);
    expect(s.duration).toBeLessThan(1.5);
  });

  it("overshoots when underdamped and not when critically damped", () => {
    expect(spring(presets.bouncy).overshoot).toBeGreaterThan(0.2);
    expect(spring({ stiffness: 100, damping: 20, mass: 1 }).overshoot).toBe(0);
  });

  it("interior stops carry a percentage so points can cluster at the bends", () => {
    const stops = stopsOf(spring(presets.bouncy).easing);
    expect(stops[1]).toMatch(/^-?\d+(\.\d+)? \d+(\.\d+)?%$/);
  });

  it("stiffer settles faster", () => {
    expect(spring(presets.stiff).duration).toBeLessThan(spring(presets.gentle).duration);
  });

  it("throws on non-physical input", () => {
    expect(() => spring({ stiffness: 0 })).toThrow();
    expect(() => spring({ mass: -1 })).toThrow();
    expect(() => spring({ damping: -1 })).toThrow();
  });
});

describe("duration form", () => {
  it("returns exactly the requested duration", () => {
    expect(spring({ duration: 0.4, bounce: 0.2 }).duration).toBe(0.4);
    expect(spring({ duration: 1.2 }).duration).toBe(1.2);
  });

  it("bounce 0 has no overshoot, bounce 0.4 does", () => {
    expect(spring({ duration: 0.5, bounce: 0 }).overshoot).toBe(0);
    expect(spring({ duration: 0.5, bounce: 0.4 }).overshoot).toBeGreaterThan(0.05);
  });

  it("has settled by the end: the last few stops sit at 1", () => {
    const s = spring({ duration: 0.5, bounce: 0.3 });
    const last = s.stops.at(-2)!;
    expect(Math.abs(last.value - 1)).toBeLessThan(0.02);
  });

  it("throws on bad duration or bounce", () => {
    expect(() => spring({ duration: 0 })).toThrow();
    expect(() => spring({ duration: 0.5, bounce: 1 })).toThrow();
    expect(() => spring({ duration: 0.5, bounce: -0.1 })).toThrow();
  });
});

describe("velocity", () => {
  it("positive velocity overshoots more, negative dips below zero first", () => {
    const base = spring(presets.snappy);
    const fast = spring({ ...presets.snappy, velocity: 20 });
    const back = spring({ ...presets.snappy, velocity: -20 });
    expect(fast.overshoot).toBeGreaterThan(base.overshoot);
    expect(Math.min(...back.stops.map((s) => s.value))).toBeLessThan(-0.05);
  });

  it("works in the duration form too", () => {
    const still = spring({ duration: 0.5, bounce: 0.2 });
    const moving = spring({ duration: 0.5, bounce: 0.2, velocity: 20 });
    expect(moving.duration).toBe(0.5);
    expect(moving.overshoot).toBeGreaterThan(still.overshoot);
  });
});

describe("point budget", () => {
  it("default output is compact", () => {
    for (const p of Object.values(presets)) {
      const s = spring(p);
      expect(s.stops.length).toBeLessThanOrEqual(40);
      expect(s.easing.length).toBeLessThan(600);
    }
  });

  it("respects an explicit cap and stays accurate", () => {
    const full = spring(presets.bouncy);
    const capped = spring({ ...presets.bouncy, points: 12 });
    expect(capped.stops.length).toBeLessThanOrEqual(12);
    expect(capped.overshoot).toBeCloseTo(full.overshoot, 1);
  });

  it("throws below 2 points", () => {
    expect(() => spring({ points: 1 })).toThrow();
  });
});

describe("fallback", () => {
  it("is a cubic-bezier that overshoots only when the spring does", () => {
    const bouncy = spring(presets.bouncy).fallback;
    const stiff = spring(presets.stiff).fallback;
    expect(bouncy).toMatch(/^cubic-bezier\(/);
    const y1 = +bouncy.match(/cubic-bezier\([^,]+, ([^,]+),/)![1];
    const y1s = +stiff.match(/cubic-bezier\([^,]+, ([^,]+),/)![1];
    expect(y1).toBeGreaterThan(1);
    expect(y1s).toBeLessThanOrEqual(1);
  });
});

describe("presets", () => {
  it("are plain option objects and spread with overrides", () => {
    expect(presets.snappy).toEqual({ stiffness: 420, damping: 30, mass: 1 });
    expect(spring({ ...presets.snappy, mass: 2 }).duration).toBeGreaterThan(
      spring(presets.snappy).duration,
    );
  });
});
