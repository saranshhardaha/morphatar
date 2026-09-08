/**
 * Variant A — organic fluid blobs.
 *
 * No noise library: anchor points are laid out in polar coordinates around a
 * circle, their radii pushed and pulled by the PRNG, then joined with a closed
 * Catmull–Rom spline converted to cubic beziers so the outline stays smooth.
 */
import type { Rand } from './prng.js';
import { randInt } from './prng.js';
import { clamp, n } from './svg.js';
import type { Palette } from './types.js';

type Point = [number, number];

const RADIUS_JITTER = 20;

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

/** One blob: 5–8 anchors on a circle, each radius nudged by up to ±10 units. */
export function blobPath(rand: Rand, cx: number, cy: number, radius: number, anchors: number): string {
  const points: Point[] = [];
  const rotation = rand() * Math.PI * 2;
  for (let i = 0; i < anchors; i++) {
    const angle = rotation + (i / anchors) * Math.PI * 2;
    const r = Math.max(6, radius + (rand() * RADIUS_JITTER - RADIUS_JITTER / 2));
    points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  return splinePath(points);
}

/** Returns one SVG element per layer, painted back-to-front in a 100×100 box. */
export function renderOrganic(rand: Rand, palette: Palette, complexity: number): string[] {
  const level = clamp(complexity, 1, 10);
  const layers = 2 + Math.round((level / 10) * 6);
  // Low complexity keeps blobs near-circular; high complexity adds anchors,
  // which is what makes the outline genuinely uneven.
  const maxAnchors = 5 + Math.round((level / 10) * 3);
  const elements: string[] = [];

  for (let i = 0; i < layers; i++) {
    const fill = palette.foreground[i % palette.foreground.length];
    // Layer 0 is a large, roughly centred base; the rest are smaller accents
    // scattered across the tile, so the stack reads as overlapping blobs rather
    // than one solid mass.
    const isBase = i === 0;
    const cx = isBase ? 38 + rand() * 24 : 22 + rand() * 56;
    const cy = isBase ? 38 + rand() * 24 : 22 + rand() * 56;
    const radius = isBase ? 30 + rand() * 16 : 13 + rand() * 20;
    const anchors = randInt(rand, 5, maxAnchors);
    const opacity = isBase ? 1 : 0.7 + rand() * 0.3;
    const opacityAttr = opacity >= 0.999 ? '' : ` fill-opacity="${n(opacity)}"`;
    elements.push(`<path d="${blobPath(rand, cx, cy, radius, anchors)}" fill="${fill}"${opacityAttr}/>`);
  }

  return elements;
}
