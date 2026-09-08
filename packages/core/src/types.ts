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
  /** Custom palette (hex, `rgb()` or `hsl()`). Omit to derive one from the seed. */
  colors?: string[];
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

/** A resolved background + ordered foreground colors, all guaranteed renderable. */
export interface Palette {
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
