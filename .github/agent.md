# springline

Spring easing as a CSS `linear()` string. Zero dependencies, pure function, no runtime.

```
npm i springline
```

## API

```ts
import { spring, presets } from "springline";

spring(options?: SpringOptions): SpringResult
```

Options, one of two forms plus shared fields:

```ts
// physics form (duration comes out)
{ stiffness?: number; damping?: number; mass?: number }   // defaults 180 / 17 / 1

// duration form (physics solved for you)
{ duration: number; bounce?: number }                      // seconds; bounce 0..1, default 0

// shared
{ velocity?: number; points?: number }
```

- `velocity`: initial velocity in target-distances per second. Positive towards the target, negative away. Default 0.
- `points`: hard cap on `linear()` stops. Default keeps stops where the curve bends (typically 18–35).

Result:

```ts
{
  easing: string;    // "linear(0, 0.31 8.2%, …, 1)"
  duration: number;  // seconds
  fallback: string;  // "cubic-bezier(0.3, 1.2, 0.2, 1)" for browsers without linear()
  overshoot: number; // 0.12 = 12% past the target
  stops: { at: number; value: number }[];
}
```

Throws `RangeError` on stiffness ≤ 0, damping < 0, mass ≤ 0, duration ≤ 0, bounce outside [0, 1), points < 2.

## Presets

`presets.gentle`, `presets.snappy`, `presets.bouncy`, `presets.stiff`. Plain `{ stiffness, damping, mass }` objects; spread and override.

## Usage

```js
const { easing, duration } = spring({ duration: 0.4, bounce: 0.2 });
el.style.transition = `transform ${duration}s ${easing}`;
```

Call at build time, in a design tool, or once at startup. Never per frame.
