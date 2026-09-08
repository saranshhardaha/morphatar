/**
 * Eyes.
 *
 * The organic variant always gets a pair, and the expression is drawn from the
 * same PRNG stream as the blob — so a seed's mood is as fixed as its shape.
 *
 * Eyes are painted in the *background* color rather than a new one. That reads
 * as punched-out holes, and it inherits the palette's contrast guarantee for
 * free: every foreground already clears 4.5:1 against the background, so the
 * eyes always stand out against whatever the blob is filled with.
 */
import type { Rand } from './prng.js';
import { pick } from './prng.js';
import { n } from './svg.js';

export const EXPRESSIONS = ['dot', 'wide', 'oval', 'sleepy', 'happy', 'wink'] as const;
export type Expression = (typeof EXPRESSIONS)[number];

function stroked(d: string, color: string, width: number): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${n(width)}" stroke-linecap="round"/>`;
}

/** One eye at `(x, y)`. `side` is -1 for the left eye, 1 for the right. */
function eye(
  expression: Expression,
  x: number,
  y: number,
  scale: number,
  color: string,
  side: number,
): string {
  switch (expression) {
    case 'dot':
      return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(3.2 * scale)}" fill="${color}"/>`;
    case 'wide':
      return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(4.7 * scale)}" fill="${color}"/>`;
    case 'oval':
      return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(2.7 * scale)}" ry="${n(4.4 * scale)}" fill="${color}"/>`;
    case 'sleepy':
      // A flat lid: the pupil is hidden, only the closing lash line shows.
      return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(4.4 * scale)}" ry="${n(1.7 * scale)}" fill="${color}"/>`;
    case 'happy': {
      const w = 4.4 * scale;
      const h = 3 * scale;
      return stroked(
        `M${n(x - w)} ${n(y + h * 0.5)}Q${n(x)} ${n(y - h)} ${n(x + w)} ${n(y + h * 0.5)}`,
        color,
        2.1 * scale,
      );
    }
    case 'wink':
      // Only the right eye winks; the left stays open.
      return side < 0
        ? `<circle cx="${n(x)}" cy="${n(y)}" r="${n(3.4 * scale)}" fill="${color}"/>`
        : stroked(`M${n(x - 4.2 * scale)} ${n(y)}H${n(x + 4.2 * scale)}`, color, 2.1 * scale);
  }
}

/**
 * A pair of eyes centred under `(cx, cy)`, returned as one markup string so the
 * caller can keep them welded to whatever they sit on.
 */
export function renderEyes(rand: Rand, color: string, cx: number, cy: number): string {
  const expression = pick(rand, EXPRESSIONS);
  const spread = 9 + rand() * 3.5;
  const y = cy - (3 + rand() * 4);
  const scale = 0.88 + rand() * 0.34;
  return (
    eye(expression, cx - spread, y, scale, color, -1) +
    eye(expression, cx + spread, y, scale, color, 1)
  );
}
