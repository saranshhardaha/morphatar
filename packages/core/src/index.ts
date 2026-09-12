/**
 * Morphatar — deterministic algorithmic avatars as raw SVG strings.
 *
 * ```ts
 * import { morphatar } from '@morphatar/core';
 * const svg = morphatar({ seed: 'ada@lovelace.dev', variant: 'organic' });
 * ```
 *
 * The same options always produce a byte-identical string: no `Math.random()`,
 * no `Date`, no counters, nothing environment-dependent.
 */
import { animationCss } from './animation.js';
import { createPalette } from './colors.js';
import { renderGeometric } from './geometric.js';
import { maskShape } from './masks.js';
import { renderOrganic } from './organic.js';
import { renderPixel } from './pixel.js';
import { createRandom, fnv1a } from './prng.js';
import { clamp, escapeXml, n } from './svg.js';
import type {
  Animation,
  Drawing,
  Mask,
  MorphatarOptions,
  Palette,
  RenderContext,
  Variant,
} from './types.js';

export type {
  Animation,
  Drawing,
  Mask,
  MorphatarOptions,
  Palette,
  RenderContext,
  Variant,
} from './types.js';
export type { Rand } from './prng.js';
export { createRandom, fnv1a, pick, randInt, sfc32, shuffle } from './prng.js';
export { contrastRatio, createPalette, hslToHex, luminance, parseColor, MIN_CONTRAST } from './colors.js';
export type { PaletteOptions } from './colors.js';
export { blobPath, renderOrganic } from './organic.js';
export { renderEyes, EXPRESSIONS } from './face.js';
export type { Expression } from './face.js';
export { renderGeometric } from './geometric.js';
export { renderPixel } from './pixel.js';
export { maskShape, SQUIRCLE_PATH } from './masks.js';

export const DEFAULTS = {
  variant: 'organic' as Variant,
  mask: 'squircle' as Mask,
  animation: 'none' as Animation,
  complexity: 5,
  multicolor: false,
  /** `null` = transparent for organic, the palette's own tone for the grids. */
  background: null as string | null,
  size: '100%' as number | string,
  title: 'Avatar',
};

interface ResolvedOptions {
  seed: string;
  variant: Variant;
  mask: Mask;
  /** Normalized: `null` means transparent. */
  background: string | null;
  /** Whether the caller said anything about the background at all. */
  backgroundGiven: boolean;
  animation: Animation;
  complexity: number;
  multicolor: boolean;
  size: number | string;
  title: string;
  colors: string[] | undefined;
}

/** `undefined` → not given; `'transparent'` / `'none'` / blank → given as none. */
function normalizeBackground(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const lowered = trimmed.toLowerCase();
  if (!trimmed || lowered === 'transparent' || lowered === 'none') return null;
  return escapeXml(trimmed);
}

/** Clamp to 1–10; a non-numeric value (NaN from an empty input, say) falls back to the default. */
function resolveComplexity(value: number | undefined): number {
  const rounded = Math.round(Number(value ?? DEFAULTS.complexity));
  return Number.isNaN(rounded) ? DEFAULTS.complexity : clamp(rounded, 1, 10);
}

function resolve(options: MorphatarOptions): ResolvedOptions {
  return {
    seed: String(options.seed ?? ''),
    variant: options.variant ?? DEFAULTS.variant,
    mask: options.mask ?? DEFAULTS.mask,
    background: normalizeBackground(options.background),
    backgroundGiven: options.background !== undefined,
    animation: options.animation ?? DEFAULTS.animation,
    complexity: resolveComplexity(options.complexity),
    multicolor: options.multicolor ?? DEFAULTS.multicolor,
    size: options.size ?? DEFAULTS.size,
    title: options.title ?? DEFAULTS.title,
    colors: Array.isArray(options.colors) && options.colors.length > 0 ? options.colors : undefined,
  };
}

/**
 * Stable per-configuration id, so ids and keyframe names never collide between
 * two avatars on the same page — and stay identical across renders of the same
 * avatar, which is what keeps SSR and hydration output in agreement.
 */
function instanceId(resolved: ResolvedOptions): string {
  const key = [
    resolved.seed,
    resolved.variant,
    resolved.mask,
    resolved.animation,
    resolved.complexity,
    resolved.multicolor ? 'm' : '',
    resolved.backgroundGiven ? String(resolved.background) : '',
    resolved.colors ? resolved.colors.join(',') : '',
  ].join('|');
  return 'm' + fnv1a(key).toString(36);
}

function dimension(size: number | string): string {
  return typeof size === 'number' ? n(size) : String(size);
}

/** Resolve the palette a seed maps to, without rendering anything. */
export function morphatarPalette(options: MorphatarOptions): Palette {
  const resolved = resolve(options);
  return createPalette(createRandom(resolved.seed), {
    colors: resolved.colors,
    background: resolved.background,
  });
}

/** Render an avatar to a standalone `<svg>` string. */
export function morphatar(options: MorphatarOptions): string {
  const resolved = resolve(options);
  const rand = createRandom(resolved.seed);

  // Palette is drawn first and from the seed alone, so switching variant or
  // nudging complexity restyles the geometry without changing the colors.
  const palette = createPalette(rand, {
    colors: resolved.colors,
    background: resolved.background,
  });

  const uid = instanceId(resolved);
  const context: RenderContext = {
    rand,
    palette,
    complexity: resolved.complexity,
    multicolor: resolved.multicolor,
    uid,
    animation: resolved.animation,
  };

  const drawing: Drawing =
    resolved.variant === 'geometric'
      ? renderGeometric(context)
      : resolved.variant === 'pixel'
        ? renderPixel(context)
        : renderOrganic(context);

  const clip = maskShape(resolved.mask);
  // Motion lives on the eyes, so only organic ever carries keyframes — the
  // grids would otherwise ship CSS targeting a class nothing wears.
  const css = resolved.variant === 'organic' ? animationCss(resolved.animation, uid) : '';

  const body = drawing.layers.join('');

  // Organic is a floating blob, so it renders on transparency unless a
  // background is asked for. The grid variants paint one by default: their
  // empty cells are negative space, not absence.
  const backgroundFill = resolved.backgroundGiven
    ? resolved.background
    : resolved.variant === 'organic'
      ? null
      : palette.background;

  // Nothing wraps the whole drawing any more: only the eyes move, and they
  // carry their own group from the generator.
  const painted =
    (backgroundFill ? `<rect width="100" height="100" fill="${backgroundFill}"/>` : '') + body;

  const defs = (clip ? `<clipPath id="${uid}c">${clip}</clipPath>` : '') + drawing.defs;
  const content =
    (defs ? `<defs>${defs}</defs>` : '') +
    (clip ? `<g clip-path="url(#${uid}c)">${painted}</g>` : painted);

  const dim = dimension(resolved.size);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${escapeXml(dim)}" height="${escapeXml(dim)}"` +
    ` role="img" aria-label="${escapeXml(resolved.title)}" preserveAspectRatio="xMidYMid slice">` +
    (css ? `<style>${css}</style>` : '') +
    content +
    '</svg>'
  );
}

/** Render to a `data:` URI, ready for `<img src>` or `background-image`. */
export function morphatarDataUri(options: MorphatarOptions): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(morphatar(options));
}

export default morphatar;
