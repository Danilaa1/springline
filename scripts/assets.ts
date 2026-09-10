/* Renders the README figures from the library itself. Run `npm run build` first; this reads dist/. */

import { writeFileSync } from "node:fs";
import { spring, presets, type Stop } from "../dist/index.js";

const INK = "#18181b";
const INK_2 = "#52525b";
const DIM = "#a1a1aa";
const FAINT = "#e4e4e7";
const ACCENT = "#15803d";
const AMBER = "#b45309";
const FONT = `font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11"`;

const Y_MIN = -0.35;
const Y_MAX = 1.55;

interface Curve {
  stops: Stop[];
  color: string;
  dash?: string;
  dots?: boolean;
}

interface Panel {
  title: string;
  meta: string;
  curves: Curve[];
}

function panel(p: Panel, x0: number, y0: number, w: number, h: number): string {
  const pad = { t: 22, r: 8, b: 8, l: 8 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const X = (at: number) => x0 + pad.l + at * iw;
  const Y = (v: number) => y0 + pad.t + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * ih;
  const path = (stops: Stop[]) =>
    stops.map((s, i) => `${i ? "L" : "M"}${X(s.at).toFixed(1)} ${Y(s.value).toFixed(1)}`).join(" ");
  let out = "";
  out += `<text x="${x0 + pad.l}" y="${y0 + 13}" ${FONT} fill="${INK}" font-weight="500">${p.title}</text>`;
  out += `<text x="${x0 + w - pad.r}" y="${y0 + 13}" ${FONT} fill="${DIM}" text-anchor="end">${p.meta}</text>`;
  out += `<line x1="${X(0)}" x2="${X(1)}" y1="${Y(0)}" y2="${Y(0)}" stroke="${FAINT}"/>`;
  out += `<line x1="${X(0)}" x2="${X(1)}" y1="${Y(1)}" y2="${Y(1)}" stroke="${FAINT}" stroke-dasharray="2 3"/>`;
  for (const c of p.curves) {
    out += `<path d="${path(c.stops)}" fill="none" stroke="${c.color}" stroke-width="1.5" stroke-linejoin="round"${c.dash ? ` stroke-dasharray="${c.dash}"` : ""}/>`;
    if (c.dots)
      for (const s of c.stops)
        out += `<circle cx="${X(s.at).toFixed(1)}" cy="${Y(s.value).toFixed(1)}" r="2.2" fill="#fff" stroke="${c.color}" stroke-width="1.2"/>`;
  }
  return out;
}

function svg(panels: Panel[], cols: number, pw: number, ph: number): string {
  const rows = Math.ceil(panels.length / cols);
  const W = cols * pw;
  const H = rows * ph;
  let body = `<rect width="${W}" height="${H}" fill="#fff"/>`;
  panels.forEach((p, i) => {
    body += panel(p, (i % cols) * pw, Math.floor(i / cols) * ph, pw, ph);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>\n`;
}

const ms = (s: number) => `${Math.round(s * 1000)}ms`;
const fmt = (o: number) => (o > 0.001 ? `+${(o * 100).toFixed(1)}%` : "no overshoot");

/* presets: one panel each */
writeFileSync(
  "assets/presets.svg",
  svg(
    Object.entries(presets).map(([name, p]) => {
      const s = spring(p);
      return {
        title: name,
        meta: `${p.stiffness}/${p.damping} · ${ms(s.duration)} · ${fmt(s.overshoot)}`,
        curves: [{ stops: s.stops, color: ACCENT }],
      };
    }),
    2,
    320,
    150,
  ),
);

/* velocity: same spring, three initial velocities */
writeFileSync(
  "assets/velocity.svg",
  svg(
    [
      {
        title: "velocity",
        meta: "snappy · −20  0  +20 units/s",
        curves: [
          { stops: spring({ ...presets.snappy, velocity: -20 }).stops, color: DIM },
          { stops: spring(presets.snappy).stops, color: INK_2, dash: "3 3" },
          { stops: spring({ ...presets.snappy, velocity: 20 }).stops, color: ACCENT },
        ],
      },
    ],
    1,
    640,
    170,
  ),
);

/* duration form: fixed 500ms, rising bounce */
writeFileSync(
  "assets/duration.svg",
  svg(
    [0, 0.3, 0.6].map((bounce) => {
      const s = spring({ duration: 0.5, bounce });
      return {
        title: `bounce ${bounce}`,
        meta: `500ms · ${fmt(s.overshoot)}`,
        curves: [{ stops: s.stops, color: ACCENT }],
      };
    }),
    3,
    213,
    150,
  ),
);

/* point budget: where the stops land */
const full = spring(presets.bouncy);
const capped = spring({ ...presets.bouncy, points: 12 });
writeFileSync(
  "assets/budget.svg",
  svg(
    [
      {
        title: "default",
        meta: `${full.stops.length} stops · ${full.easing.length} bytes`,
        curves: [{ stops: full.stops, color: ACCENT, dots: true }],
      },
      {
        title: "points: 12",
        meta: `${capped.stops.length} stops · ${capped.easing.length} bytes`,
        curves: [
          { stops: full.stops, color: FAINT },
          { stops: capped.stops, color: AMBER, dots: true },
        ],
      },
    ],
    2,
    320,
    170,
  ),
);

console.log("assets written");
