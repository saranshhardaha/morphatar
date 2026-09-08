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
 * When `multicolor` is on, the palette is blended as a soft colour field —
 * heavily blurred spots over a base fill, clipped back to the blob — rather
 * than a linear gradient, which always reads as a hard directional axis.
 */
import { contrastRatio } from './colors.js';
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
 * A soft colour field: an opaque base fill with one heavily blurred ellipse per
 * remaining palette colour floated over it.
 *
 * The blur is what softens the blend — the colours diffuse into each other with
 * no seam and no directional axis — and clipping the whole field back to the
 * blob path is what stops the blur from bleeding a fuzzy halo past the outline.
 * The base fill must be opaque and cover the blob, since the blurred spots
 * fade to transparent at their edges.
 */
function colorField(
  rand: Rand,
  palette: Palette,
  ids: { clip: string; filter: string },
  blob: string,
  cx: number,
  cy: number,
  radius: number,
): { defs: string; markup: string } {
  // The most legible colour against the avatar background becomes the body;
  // the rest are blurred over it *at partial opacity*, so they tint the base
  // rather than replace it. That is what keeps the blend soft even when a
  // custom palette mixes a near-black with a near-white: a fully opaque spot
  // of either extreme blots the middle of the blob. Placement is shuffled, so
  // the composition still varies per seed.
  const ranked = palette.foreground
    .slice()
    .sort((a, b) => contrastRatio(b, palette.background) - contrastRatio(a, palette.background));
  const base = ranked[0];
  const spots = shuffle(rand, ranked.slice(1));

  // A blur wide enough to melt the spots together, scaled to the blob.
  const blur = radius * (0.26 + rand() * 0.14);

  const markup = spots
    .map((color, i) => {
      // Spread the spots around the centre so no two stack up.
      const angle = ((i + rand() * 0.6) / Math.max(spots.length, 1)) * Math.PI * 2;
      const distance = radius * (0.3 + rand() * 0.35);
      const rx = radius * (0.72 + rand() * 0.45);
      const ry = rx * (0.7 + rand() * 0.55);
      const x = cx + Math.cos(angle) * distance;
      const y = cy + Math.sin(angle) * distance;
      const rotation = rand() * 180;
      const opacity = 0.45 + rand() * 0.3;
      return (
        `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}"` +
        ` transform="rotate(${n(rotation)} ${n(x)} ${n(y)})"` +
        ` fill="${color}" fill-opacity="${n(opacity)}"/>`
      );
    })
    .join('');

  if (!markup) return { defs: '', markup: `<path d="${blob}" fill="${base}"/>` };

  const defs =
    `<clipPath id="${ids.clip}"><path d="${blob}"/></clipPath>` +
    // A generous filter region: the default (-10%/120%) would crop the blur.
    // sRGB interpolation keeps the blend matching the flat colours.
    `<filter id="${ids.filter}" x="-50%" y="-50%" width="200%" height="200%"` +
    ` color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${n(blur)}"/></filter>`;

  return {
    defs,
    markup:
      `<g clip-path="url(#${ids.clip})"><path d="${blob}" fill="${base}"/>` +
      `<g filter="url(#${ids.filter})">${markup}</g></g>`,
  };
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

  const path = blobPath(rand, cx, cy, radius, anchors, jitter);

  const field = multicolor
    ? colorField(rand, palette, { clip: `${uid}b`, filter: `${uid}f` }, path, cx, cy, radius)
    : {
        defs: '',
        markup: `<path d="${path}" fill="${
          palette.foreground[randInt(rand, 0, palette.foreground.length - 1)]
        }"/>`,
      };

  const eyes = renderEyes(rand, palette.background, cx, cy);

  // Blob and eyes ship as one layer so `morph` moves the whole face together
  // instead of drifting the eyes off it.
  return { defs: field.defs, layers: [field.markup + eyes] };
}
