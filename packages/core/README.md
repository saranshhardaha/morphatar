# @morphatar/core

[![npm](https://img.shields.io/npm/v/@morphatar/core)](https://www.npmjs.com/package/@morphatar/core)
[![min+gzip](https://img.shields.io/bundlephobia/minzip/@morphatar/core)](https://bundlephobia.com/package/@morphatar/core)
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
[![license](https://img.shields.io/npm/l/@morphatar/core)](https://github.com/saranshhardaha/morphatar/blob/master/LICENSE)

Zero-dependency, deterministic algorithmic avatar generator.

[![Twenty-four Morphatar avatars: organic blobs with eyes, geometric grids and pixel identicons](https://morphatar.vercel.app/hero.svg)](https://morphatar.vercel.app)

One seed in, the same SVG out — on every machine, in every runtime, forever.
No `Math.random()`, no canvas, no network, no images to host.

**[Playground](https://morphatar.vercel.app)** · **[Try on StackBlitz](https://stackblitz.com/github/saranshhardaha/morphatar/tree/master/examples/vanilla)** · **[GitHub](https://github.com/saranshhardaha/morphatar)**

- **~4.2 KB min+gzip**, 0 runtime dependencies, tree-shakeable (`sideEffects: false`)
- **3 variants** — `organic` blob with eyes, `geometric` Bauhaus grid, `pixel` identicon
- **Accessible by default** — generated colours clear WCAG AA 4.5:1 contrast
- **SSR-safe** — byte-identical output on server and client, collision-free ids
- **Framework-agnostic** — returns a plain `<svg>` string

Using React? Install [`@morphatar/react`](https://www.npmjs.com/package/@morphatar/react) instead.

## Install

```bash
npm install @morphatar/core
# or
pnpm add @morphatar/core
# or
yarn add @morphatar/core
```

The package is **ESM-only**. Use `import` in any bundler (Vite, webpack,
Next.js, esbuild, Rollup) or in Node ≥ 18. `require()` works on Node versions
that support loading ES modules synchronously (20.19+, 22.12+).

## Quick start

```ts
import { morphatar, morphatarDataUri } from '@morphatar/core';

// A raw <svg> string
const svg = morphatar({ seed: 'ada@lovelace.dev' });

// A data: URI for <img src> or CSS background-image
const uri = morphatarDataUri({ seed: 'ada@lovelace.dev', variant: 'pixel', size: 64 });
```

### In the browser (vanilla)

```html
<div id="avatar"></div>
<script type="module">
  import { morphatar } from 'https://cdn.jsdelivr.net/npm/@morphatar/core/+esm';
  document.getElementById('avatar').innerHTML = morphatar({ seed: 'grace-hopper', size: 96 });
</script>
```

### As an `<img>`

```ts
const img = document.createElement('img');
img.src = morphatarDataUri({ seed: user.id, size: 48 });
img.alt = `${user.name}'s avatar`;
```

### In Vue, Svelte, Solid or Astro

The output is a string that is safe to inject, so every framework is one line:

```vue
<!-- Vue -->
<span v-html="morphatar({ seed, size: 40 })" />
```

```svelte
<!-- Svelte -->
{@html morphatar({ seed, size: 40 })}
```

```tsx
// Solid
<span innerHTML={morphatar({ seed: props.seed, size: 40 })} />
```

```astro
<!-- Astro: no client JavaScript -->
<Fragment set:html={morphatar({ seed, size: 40 })} />
```

Full component examples are in the
[main README](https://github.com/saranshhardaha/morphatar#any-framework).

### Without installing anything

A hosted endpoint renders avatars from query parameters, for Markdown, CMS
fields or prototypes:

```html
<img src="https://morphatar.vercel.app/api/avatar?seed=grace-hopper&variant=pixel&size=96" alt="" width="96" height="96">
```

Every option is a query parameter; see the
[parameter table](https://github.com/saranshhardaha/morphatar#hosted-endpoint).
For production traffic, serve avatars from your own app instead.

### Served from your own endpoint

Output never changes for the same options, so responses can be cached forever.

```ts
// Next.js App Router: app/avatar/[seed]/route.ts
import { morphatar } from '@morphatar/core';

export async function GET(_req: Request, { params }: { params: Promise<{ seed: string }> }) {
  const { seed } = await params;
  return new Response(morphatar({ seed, size: 128 }), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
```

The same pattern works in Express, Hono, Cloudflare Workers, Deno or Bun — the
core only needs a JavaScript runtime.

## Options

```ts
morphatar(options: MorphatarOptions): string
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `seed` | `string` | — (required) | The deterministic seed. Same seed, same avatar. Usually a user id or email. |
| `variant` | `'organic' \| 'geometric' \| 'pixel'` | `'organic'` | Shape algorithm. |
| `colors` | `string[]` | derived from seed | Shape palette as hex, `rgb()` or `hsl()`. Every entry is a shape colour. |
| `background` | `string` | per variant | Background fill. `'transparent'` / `'none'` / `''` paint nothing. |
| `mask` | `'circle' \| 'squircle' \| 'hexagon' \| 'none'` | `'squircle'` | Clip silhouette. |
| `complexity` | `number` (1–10) | `5` | Node count / density. Out-of-range values are clamped. |
| `multicolor` | `boolean` | `false` | Paint with the whole palette instead of one foreground. |
| `animation` | `'none' \| 'blink' \| 'dart'` | `'none'` | Idle eye motion, baked in as scoped CSS keyframes. `organic` only — the grids have no eyes. |
| `size` | `number \| string` | `'100%'` | Width/height. Numbers are px; strings are any CSS length. |
| `title` | `string` | `'Avatar'` | Accessible name (`aria-label`). The seed is never written into the markup. |

### Background

- **organic** renders on **transparency** by default — it is a floating blob.
- **geometric** and **pixel** paint the palette's own background by default,
  because their empty cells are negative space.

```ts
morphatar({ seed: 'ada' });                                           // transparent blob
morphatar({ seed: 'ada', background: '#09090b' });                    // painted
morphatar({ seed: 'ada', variant: 'pixel', background: 'transparent' }); // forced off
```

Whatever you pass as `background` is also the palette's **contrast anchor**:
generated foregrounds are re-derived to clear 4.5:1 against it. With no
background the library cannot know what your page looks like, so pass your
page's colour when legibility against a specific surface matters. Adding a
background never changes the shapes.

With a transparent organic avatar the `mask` has nothing to clip — the blob's
own outline is the silhouette.

### Colour modes

| Variant | `multicolor: false` | `multicolor: true` |
| --- | --- | --- |
| organic | one flat foreground | soft blurred colour field clipped to the blob |
| geometric | every cell shares one colour | each cell picks its own |
| pixel | every pixel shares one colour | each pixel picks its own |

### Custom palettes

```ts
morphatar({
  seed: 'ada',
  variant: 'geometric',
  multicolor: true,
  colors: ['#e4572e', '#1789bb', '#1b1b1b'],
  background: '#f4efe4',
});
```

Custom colours are used as given — they are not adjusted for contrast. Use
hex, `rgb()` or `hsl()`; named colours (`red`) render, but the contrast maths
reads them as black.

## Other exports

| Export | What it does |
| --- | --- |
| `morphatarDataUri(options)` | Same as `morphatar`, encoded as a `data:image/svg+xml` URI. |
| `morphatarPalette(options)` | Resolve a seed's `{ background, foreground[] }` without rendering. Useful for theming UI around an avatar. |
| `DEFAULTS` | The default option values. |
| `contrastRatio(a, b)`, `luminance(c)`, `parseColor(c)`, `hslToHex(h, s, l)`, `MIN_CONTRAST` | Colour utilities used by the palette. |
| `fnv1a`, `sfc32`, `createRandom`, `randInt`, `pick`, `shuffle` | The deterministic PRNG primitives. |
| `createPalette`, `renderOrganic`, `renderGeometric`, `renderPixel`, `renderEyes`, `blobPath`, `maskShape`, `SQUIRCLE_PATH`, `EXPRESSIONS` | Building blocks, for composing your own renderer. Generators take a `RenderContext` and return a `Drawing` (`{ defs, layers }`). |

All option and return types (`MorphatarOptions`, `Variant`, `Mask`,
`Animation`, `Palette`, `RenderContext`, `Drawing`, `Rand`) are exported.

## Guarantees

- **Deterministic.** The same options produce a byte-identical string. Avatars
  are stable across versions within a major release; a change that alters
  existing avatars ships as a breaking change.
- **Safe to inject.** `title`, `colors`, `background` and `size` are escaped
  before they reach the markup, so hostile values cannot break out of an
  attribute. The seed never appears in the output.
- **No id collisions.** Clip paths, filters and keyframes are named from a hash
  of the options, so many avatars can share one page.
- **Respects `prefers-reduced-motion`.** Animations switch themselves off.

## How it works

1. **Hash** — FNV-1a folds the seed into a 32-bit integer.
2. **Expand** — splitmix32 seeds an sfc32 PRNG with 128 bits of state.
3. **Colour** — the palette is drawn first, so changing `variant` or
   `complexity` keeps a seed's colours.
4. **Draw** — the same stream feeds the chosen generator.
5. **Assemble** — shapes, background, mask and keyframes become one `<svg>`.

## License

MIT
