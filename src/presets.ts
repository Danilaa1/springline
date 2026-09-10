import type { PhysicalSpring } from "./index.js";

export const presets = {
  gentle: { stiffness: 120, damping: 24, mass: 1 },
  snappy: { stiffness: 420, damping: 30, mass: 1 },
  bouncy: { stiffness: 220, damping: 9, mass: 1 },
  stiff: { stiffness: 700, damping: 50, mass: 1 },
} as const satisfies Record<string, Required<PhysicalSpring>>;
