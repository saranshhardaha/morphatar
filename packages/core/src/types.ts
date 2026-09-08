/** Shape algorithm used to draw the avatar. */
export type Variant = 'organic' | 'geometric' | 'pixel';

/** Silhouette the avatar is clipped to. */
export type Mask = 'circle' | 'squircle' | 'hexagon' | 'none';

/** Optional idle motion baked into the SVG as CSS keyframes. */
export type Animation = 'none' | 'pulse' | 'morph' | 'spin';

export interface MorphatarOptions {
  /** Deterministic seed: the same string always renders the same avatar. */
  seed: string;
  /** Shape algorithm. Default: `'organic'`. */
  variant?: Variant;
  /**
   * Shape palette (hex, `rgb()` or `hsl()`). Every entry is used for shapes —
   * the background is set only by `background`. Omit to derive one from the seed.
   */
  colors?: string[];
  /**
   * Background fill. Omit for the per-variant default: organic renders on
   * transparency, geometric and pixel paint the palette's own background, since
   * their empty cells are negative space rather than absence. Pass
   * `'transparent'` (or `'none'`) to force transparency on any variant.
   */
  background?: string;
  /** Clip silhouette. Default: `'squircle'`. */
  mask?: Mask;
  /** 1–10, controls node count / layer density. Default: `5`. */
  complexity?: number;
  /**
   * Paint with the whole palette instead of a single foreground color.
   * Organic blends its colors into one gradient; geometric and pixel colour
   * each cell independently. Default: `false`.
   */
  multicolor?: boolean;
  /** Idle motion. Default: `'none'`. */
  animation?: Animation;
  /** CSS length or px number applied to width/height. Default: `'100%'`. */
  size?: number | string;
  /**
   * Accessible name for the `<svg role="img">`.
   * Defaults to `'Avatar'` — the seed is never written into the markup, since
   * seeds are often emails or user ids.
   */
  title?: string;
}

/** A resolved palette: ordered foregrounds plus the tone they contrast against. */
export interface Palette {
  /**
   * The palette's contrast anchor — the caller's `background` when given, or a
   * derived tone otherwise. Foregrounds and eyes are measured against it even
   * when nothing is painted with it.
   */
  background: string;
  foreground: string[];
}

/** Everything a shape generator needs, so generators stay pure functions. */
export interface RenderContext {
  rand: import('./prng.js').Rand;
  palette: Palette;
  /** Already clamped to 1–10. */
  complexity: number;
  multicolor: boolean;
  /** Instance id, for scoping any gradient or filter the generator defines. */
  uid: string;
}

/** A generator's output: optional `<defs>` content plus animatable layers. */
export interface Drawing {
  /** Markup to place inside the shared `<defs>` block. */
  defs: string;
  /**
   * One entry per independently animatable unit. `morph` staggers these, so a
   * generator that wants its parts to move together returns them as one entry.
   */
  layers: string[];
}
