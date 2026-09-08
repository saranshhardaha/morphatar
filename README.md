# Morphatar

Zero-dependency, deterministic algorithmic avatar generator.

One seed in, the same SVG out — on every machine, in every runtime, forever.
No `Math.random()`, no canvas, no network, no images to host.

```
5.0 KB gzipped · 0 runtime dependencies · 3 shape variants
```

## Packages

| Package | What it is |
| --- | --- |
| `@morphatar/core` | Pure TypeScript engine. Takes options, returns a raw `<svg>` string. |
| `@morphatar/react` | ~40-line React wrapper around the core, memoised with `useMemo`. |
| `apps/web` | Next.js 14 playground for exploring the parameter space. |

## Install

```bash
pnpm add @morphatar/react   # React
pnpm add @morphatar/core    # anything else
```

## Usage

```tsx
import { Morphatar } from '@morphatar/react';

<Morphatar seed="ada@lovelace.dev" variant="organic" size={64} />;
```

```ts
import { morphatar, morphatarDataUri } from '@morphatar/core';

const svg = morphatar({ seed: 'ada@lovelace.dev', variant: 'geometric' });
const uri = morphatarDataUri({ seed: 'ada@lovelace.dev' }); // for <img src>
```

The core is framework-agnostic and side-effect free, so it runs the same in a
React Server Component, an edge function, a CLI or a `<script>` tag.

## API

```ts
interface MorphatarProps {
  seed: string;                                       // the deterministic seed
  variant?: 'organic' | 'geometric' | 'pixel';        // default: 'organic'
  colors?: string[];                                  // hex / rgb() / hsl()
  mask?: 'circle' | 'squircle' | 'hexagon' | 'none';  // default: 'squircle'
  complexity?: number;                                // 1–10, default: 5
  animation?: 'none' | 'pulse' | 'morph' | 'spin';    // default: 'none'
  size?: number | string;                             // default: '100%'
  title?: string;                                     // aria-label, default: 'Avatar'
}
```

`<Morphatar>` also forwards any `<span>` attribute (`className`, `style`,
`onClick`, …) to the wrapper element.

Extra exports from `@morphatar/core`: `morphatarPalette()` (resolve a seed's
colors without rendering), plus the building blocks — `fnv1a`, `sfc32`,
`createRandom`, `createPalette`, `contrastRatio`, `renderOrganic`,
`renderGeometric`, `renderPixel`, `maskShape`.

### Notes

- **The seed never reaches the markup.** `aria-label` defaults to the literal
  string `"Avatar"`, because seeds are usually emails or user ids. Pass `title`
  when you want a real accessible name.
- **Ids are content-derived**, so two avatars on one page never collide and
  server and client render byte-identical markup.
- **Motion respects `prefers-reduced-motion`** — animated variants disable
  themselves automatically.

## How it works

1. **Hash** — FNV-1a folds the seed string into one 32-bit integer.
2. **Expand** — splitmix32 stretches that integer into 128 bits of sfc32 state.
   sfc32 is a small, fast counting PRNG; the same seed always yields the same
   stream of floats.
3. **Colour** — the palette is drawn *first*, from the seed alone. That is why
   switching `variant` or nudging `complexity` restyles the geometry without
   changing an avatar's colors. Generated foregrounds target distinct lightness
   levels and are pushed until each clears **4.5:1** against the background.
4. **Draw** — the same stream feeds one of three generators:
   - **organic** — 5–8 anchor points laid out in polar coordinates, radii pushed
     and pulled by the PRNG, joined with a closed Catmull–Rom spline emitted as
     cubic beziers.
   - **geometric** — a 3×3 or 4×4 Bauhaus grid; each cell becomes a disc, a
     quarter disc, a triangle or empty space, snapped to a right-angle rotation.
   - **pixel** — a 5×5 identicon where only the left three columns are generated
     and the remainder is mirrored.
5. **Assemble** — shapes, background, `<clipPath>` mask and scoped keyframes are
   concatenated into a single `<svg>` string.

## Development

```bash
pnpm install
pnpm build          # build core + react
pnpm test           # determinism, contrast and markup tests (node:test, no deps)
pnpm size           # enforce the 8 KB gzipped budget for @morphatar/core
pnpm dev            # run the Next.js playground
pnpm typecheck      # every workspace
```

The test suite is the contract: it pins the FNV-1a reference vectors, asserts
byte-identical output across renders, verifies the pixel grid really is
mirrored, checks that a custom palette is never escaped, and sweeps 300 seeds
for the contrast floor.

## Licence

MIT.
