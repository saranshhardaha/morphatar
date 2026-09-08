/**
 * Variant A — one organic blob, with eyes.
 *
 * No noise library: anchor points are laid out in polar coordinates around a
 * circle, their radii pushed and pulled by the PRNG, then joined with a *closed*
 * Catmull–Rom spline converted to cubic beziers. Closing the spline is what
 * removes every hard edge — the curve is C1-continuous all the way round,
 * including across the seam.
 *
 * A single blob, not a stack: overlapping shapes read as mud at avatar sizes.
 * When `multicolor` is on, the palette is merged into one linear gradient
 * instead of being split across separate layers.
 */
import { renderEyes } from './face.js';
import type { Rand } from './prng.js';
import { randInt, shuffle } from './prng.js';
import { n } from './svg.js';
import type { Drawing, Palette, RenderContext } from './types.js';

type Point = [number, number];

/** Closed Catmull–Rom → cubic bezier. Tangents are the neighbour chord / 6. */
function splinePath(points: Point[]): string {
  const count = points.length;
  const first = points[0];
  let d = `M${n(first[0])} ${n(first[1])}`;
  for (let i = 0; i < count; i++) {
    const p0 = points[(i - 1 + count) % count];
    const p1 = points[i];
    const p2 = points[(i + 1) % count];
    const p3 = points[(i + 2) % count];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${n(c1x)} ${n(c1y)} ${n(c2x)} ${n(c2y)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d + 'Z';
}

/** Anchors on a circle, each radius nudged by up to `±jitter / 2`. */
export function blobPath(
  rand: Rand,
  cx: number,
  cy: number,
  radius: number,
  anchors: number,
  jitter: number,
): string {
  const points: Point[] = [];
  const rotation = rand() * Math.PI * 2;
  for (let i = 0; i < anchors; i++) {
    const angle = rotation + (i / anchors) * Math.PI * 2;
    const r = Math.max(6, radius + (rand() * jitter - jitter / 2));
    points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  return splinePath(points);
}

/**
 * A linear gradient across the palette at a seed-chosen angle, expressed in
 * objectBoundingBox units so it follows the blob rather than the viewBox.
 */
function gradient(rand: Rand, palette: Palette, id: string): string {
  const stops = shuffle(rand, palette.foreground).slice(0, 3);
  const angle = rand() * Math.PI * 2;
  const dx = Math.cos(angle) * 0.5;
  const dy = Math.sin(angle) * 0.5;
  const markup = stops
    .map((color, i) => {
      const offset = stops.length === 1 ? 0 : i / (stops.length - 1);
      return `<stop offset="${n(offset * 100)}%" stop-color="${color}"/>`;
    })
    .join('');
  return (
    `<linearGradient id="${id}" x1="${n(0.5 - dx)}" y1="${n(0.5 - dy)}"` +
    ` x2="${n(0.5 + dx)}" y2="${n(0.5 + dy)}">${markup}</linearGradient>`
  );
}

export function renderOrganic({
  rand,
  palette,
  complexity,
  multicolor,
  uid,
}: RenderContext): Drawing {
  // Complexity is node count: a near-circle at 1, a lobed blob at 10. The count
  // is driven mostly by complexity rather than sampled from a range, otherwise
  // one unlucky draw makes the whole slider look inert.
  const anchors = 5 + Math.round(((complexity - 1) / 9) * 4) + randInt(rand, 0, 1);
  const jitter = 6 + ((complexity - 1) / 9) * 20;

  const cx = 48 + rand() * 4;
  const cy = 48 + rand() * 4;
  const radius = 32 + rand() * 6;

  const gradientId = `${uid}g`;
  const defs = multicolor ? gradient(rand, palette, gradientId) : '';
  const fill = multicolor
    ? `url(#${gradientId})`
    : palette.foreground[randInt(rand, 0, palette.foreground.length - 1)];

  const blob = `<path d="${blobPath(rand, cx, cy, radius, anchors, jitter)}" fill="${fill}"/>`;
  const eyes = renderEyes(rand, palette.background, cx, cy);

  // Blob and eyes ship as one layer so `morph` moves the whole face together
  // instead of drifting the eyes off it.
  return { defs, layers: [blob + eyes] };
}
