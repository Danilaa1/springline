# springline — contributor spec

Read this before touching anything. `.github/agent.md` is the *consumer* doc
(ships in the npm package); this file is for working on the library itself.

## What this is

A pure function. Spring parameters in, a CSS `linear()` string out. No DOM,
no runtime, no framework adapters; a function needs none.

## Invariants

- **Zero runtime dependencies.** Not one.
- **Pure and deterministic.** Same options, same string. No `Date`, no
  `Math.random`, no environment sniffing.
- **Curve starts at `0` and ends at `1`.** Always, whatever the velocity or
  the cap. `toStops` pins both ends.
- **Physics and duration forms produce the same shape family.** The duration
  form scales a reference spring in time; it never uses a different model.
- **Point budget never lies.** A `points` cap is a hard ceiling. Compression
  raises the simplify tolerance until under it.
- **Throw on non-physical input** with a `RangeError` prefixed `springline:`.

## Architecture

| File | Owns |
| --- | --- |
| `src/simulate.ts` | `m·x'' = −k(x−1) − c·x'`, semi-implicit Euler at 1 kHz, settle detection |
| `src/linear.ts` | sample → stops (Ramer–Douglas–Peucker), stops → `linear()` string |
| `src/bezier.ts` | least-squares nearest ease-out `cubic-bezier` for the fallback |
| `src/presets.ts` | the four named presets |
| `src/index.ts` | option validation, the two forms, public types |
| `scripts/assets.ts` | renders `assets/*.svg` for the README from `dist/` |

## Definition of done

1. Vitest case in `tests/spring.test.ts` for the behaviour, not the number.
2. README section if the public API changed, `.github/agent.md` in the same
   commit.
3. `npm run build && npm run assets` if a figure's numbers moved; the README
   presets table is hand-copied from `assets/presets.svg` labels, keep it in
   step.
4. `npm run check` and `npm test` pass.

## Conventions

- No magic numbers: a value used twice gets a name; a tuned constant gets a
  comment saying what it was tuned against.
- Comments state constraints the code can't show, never what the next line
  does.
- Prefer deleting to adding. No speculative options.

## The site

`~/Developer/Open-source-projects/springline-site` is the landing page. Its
tuner currently carries its own copy of the simulation; swapping it to the
published package is the next step after the first npm release.
