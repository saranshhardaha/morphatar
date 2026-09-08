/** Clip silhouettes, expressed in the shared 100×100 user space. */
import type { Mask } from './types.js';

/** Approximated smooth corners — the superellipse look, in four cubic segments. */
export const SQUIRCLE_PATH =
  'M 0 50 C 0 0 0 0 50 0 C 100 0 100 0 100 50 C 100 100 100 100 50 100 C 0 100 0 100 0 50 Z';

/** Returns the clip geometry, or `null` when the avatar should not be clipped. */
export function maskShape(mask: Mask): string | null {
  switch (mask) {
    case 'circle':
      return '<circle cx="50" cy="50" r="50"/>';
    case 'squircle':
      return `<path d="${SQUIRCLE_PATH}"/>`;
    case 'hexagon':
      return '<polygon points="50 0 93.3 25 93.3 75 50 100 6.7 75 6.7 25"/>';
    case 'none':
    default:
      return null;
  }
}
