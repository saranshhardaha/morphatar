# @morphatar/react

React component for [Morphatar](https://github.com/saranshhardaha/morphatar) —
deterministic, zero-dependency algorithmic avatars.

One seed in, the same avatar out, on the server and in the browser.

## Install

```bash
npm install @morphatar/react
# or
pnpm add @morphatar/react
# or
yarn add @morphatar/react
```

Requires React 17 or newer. [`@morphatar/core`](https://www.npmjs.com/package/@morphatar/core)
is installed automatically.

## Usage

```tsx
import { Morphatar } from '@morphatar/react';

export function UserBadge({ user }: { user: { id: string; name: string } }) {
  return <Morphatar seed={user.id} size={40} title={`${user.name}'s avatar`} />;
}
```

### Variants

```tsx
<Morphatar seed="ada" variant="organic" />    {/* blob with eyes (default) */}
<Morphatar seed="ada" variant="geometric" />  {/* Bauhaus grid */}
<Morphatar seed="ada" variant="pixel" />      {/* mirrored identicon */}
```

### Styling

The component renders a `<span>` wrapping the `<svg>`. Any `<span>` attribute
— `className`, `style`, `onClick`, `data-*`, `aria-*` — is forwarded to it.

```tsx
<Morphatar seed="ada" size={64} className="rounded-full ring-2 ring-white" />
```

- `size={64}` → a 64 × 64 px box.
- `size="3rem"` → any CSS length; the box stays square via `aspect-ratio`.
- Omit `size` → fills the parent's width, square.

### Custom palette and background

```tsx
<Morphatar
  seed="ada"
  variant="geometric"
  multicolor
  colors={['#e4572e', '#1789bb', 'rgb(27, 27, 27)']}
  background="#f4efe4"
/>
```

### Animation

```tsx
<Morphatar seed="ada" animation="blink" />  {/* also: 'dart' */}
```

Animations turn themselves off for users with `prefers-reduced-motion`.

## Props

All options from `@morphatar/core`, plus standard `<span>` attributes.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `seed` | `string` | — (required) | Deterministic seed, e.g. a user id or email. |
| `variant` | `'organic' \| 'geometric' \| 'pixel'` | `'organic'` | Shape algorithm. |
| `colors` | `string[]` | derived from seed | Shape colours (hex, `rgb()`, `hsl()`). |
| `background` | `string` | per variant | Background fill; `'transparent'` paints nothing. Organic is transparent by default, geometric and pixel paint one. |
| `mask` | `'circle' \| 'squircle' \| 'hexagon' \| 'none'` | `'squircle'` | Clip silhouette. |
| `complexity` | `number` (1–10) | `5` | Node count / density. |
| `multicolor` | `boolean` | `false` | Use the whole palette instead of one colour. |
| `animation` | `'none' \| 'blink' \| 'dart'` | `'none'` | Idle eye motion. `organic` only — the grids have no eyes. |
| `size` | `number \| string` | `'100%'` | px number or CSS length. |
| `title` | `string` | `'Avatar'` | Accessible name. The seed is never written into the markup. |

See the [`@morphatar/core` README](https://www.npmjs.com/package/@morphatar/core)
for how `background`, contrast and colour modes interact.

## Server components and SSR

The component is marked `'use client'` (it memoises with `useMemo`), so in the
Next.js App Router you can import it from a Server Component and it is
server-rendered as usual. Output is identical on server and client, so there is
no hydration mismatch.

To render with zero client JavaScript, use the core functions directly — they
are re-exported from this package:

```tsx
// A Server Component
import { morphatarDataUri } from '@morphatar/react';

export default function Avatar({ id }: { id: string }) {
  return <img src={morphatarDataUri({ seed: id, size: 40 })} alt="" width={40} height={40} />;
}
```

Re-exports: `morphatar`, `morphatarDataUri`, `morphatarPalette`, and the
`Variant`, `Mask`, `Animation` types.

## License

MIT
