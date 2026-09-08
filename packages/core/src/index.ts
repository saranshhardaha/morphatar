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
import { animationCss, isPerLayer, layerClass, rootClass } from './animation.js';
import { createPalette } from './colors.js';
import { renderGeometric } from './geometric.js';
import { maskShape } from './masks.js';
import { renderOrganic } from './organic.js';
import { renderPixel } from './pixel.js';
import { createRandom, fnv1a } from './prng.js';
import { clamp, escapeXml, n } from './svg.js';
import type { Animation, Mask, MorphatarOptions, Palette, Variant } from './types.js';

export type { Animation, Mask, MorphatarOptions, Palette, Variant } from './types.js';
export type { Rand } from './prng.js';
export { createRandom, fnv1a, pick, randInt, sfc32, shuffle } from './prng.js';
export { contrastRatio, createPalette, hslToHex, luminance, parseColor, MIN_CONTRAST } from './colors.js';
export { blobPath, renderOrganic } from './organic.js';
export { renderGeometric } from './geometric.js';
export { renderPixel } from './pixel.js';
export { maskShape, SQUIRCLE_PATH } from './masks.js';

export const DEFAULTS = {
  variant: 'organic' as Variant,
  mask: 'squircle' as Mask,
  animation: 'none' as Animation,
  complexity: 5,
  size: '100%' as number | string,
  title: 'Avatar',
};

interface ResolvedOptions {
  seed: string;
  variant: Variant;
  mask: Mask;
  animation: Animation;
  complexity: number;
  size: number | string;
  title: string;
  colors: string[] | undefined;
}

function resolve(options: MorphatarOptions): ResolvedOptions {
  return {
    seed: String(options.seed ?? ''),
    variant: options.variant ?? DEFAULTS.variant,
    mask: options.mask ?? DEFAULTS.mask,
    animation: options.animation ?? DEFAULTS.animation,
    complexity: clamp(Math.round(options.complexity ?? DEFAULTS.complexity), 1, 10),
    size: options.size ?? DEFAULTS.size,
    title: options.title ?? DEFAULTS.title,
    colors: options.colors && options.colors.length > 0 ? options.colors : undefined,
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
  return createPalette(createRandom(resolved.seed), resolved.colors);
}

/** Render an avatar to a standalone `<svg>` string. */
export function morphatar(options: MorphatarOptions): string {
  const resolved = resolve(options);
  const rand = createRandom(resolved.seed);

  // Palette is drawn first and from the seed alone, so switching variant or
  // nudging complexity restyles the geometry without changing the colors.
  const palette = createPalette(rand, resolved.colors);

  const shapes =
    resolved.variant === 'geometric'
      ? renderGeometric(rand, palette, resolved.complexity)
      : resolved.variant === 'pixel'
        ? renderPixel(rand, palette, resolved.complexity)
        : renderOrganic(rand, palette, resolved.complexity);

  const uid = instanceId(resolved);
  const clip = maskShape(resolved.mask);
  const css = animationCss(resolved.animation, uid);

  const body = isPerLayer(resolved.animation)
    ? shapes
        .map(
          (shape, i) =>
            `<g class="${layerClass(uid)}" style="animation-delay:${n(i * 0.4)}s">${shape}</g>`,
        )
        .join('')
    : shapes.join('');

  // The background sits outside the animated group so `spin` never exposes a
  // bare corner, and the clip group sits outside both so the mask holds still.
  const painted =
    `<rect width="100" height="100" fill="${palette.background}"/>` +
    (resolved.animation === 'pulse' || resolved.animation === 'spin'
      ? `<g class="${rootClass(uid)}">${body}</g>`
      : body);

  const content = clip
    ? `<defs><clipPath id="${uid}c">${clip}</clipPath></defs><g clip-path="url(#${uid}c)">${painted}</g>`
    : painted;

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
