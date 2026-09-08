/**
 * Variant C — mirrored identicon.
 *
 * Classic 5×5: only the left three columns are drawn from the PRNG, columns 4
 * and 5 mirror columns 2 and 1, which is what gives identicons their face-like
 * vertical symmetry.
 */
import { randInt } from './prng.js';
import { n } from './svg.js';
import type { Drawing, RenderContext } from './types.js';

const GRID = 5;
const CELL = 100 / GRID;

export function renderPixel({ rand, palette, complexity, multicolor }: RenderContext): Drawing {
  const density = 0.32 + (complexity / 10) * 0.36;
  const primary = palette.foreground[randInt(rand, 0, palette.foreground.length - 1)];

  const half = Math.ceil(GRID / 2); // 3 generated columns
  const cells: (string | null)[][] = [];

  for (let row = 0; row < GRID; row++) {
    const line: (string | null)[] = new Array(GRID).fill(null);
    for (let column = 0; column < half; column++) {
      const filled = rand() < density;
      const cellColor = palette.foreground[randInt(rand, 0, palette.foreground.length - 1)];
      const fill = multicolor ? cellColor : primary;
      if (!filled) continue;
      line[column] = fill;
      line[GRID - 1 - column] = fill; // mirror
    }
    cells.push(line);
  }

  const elements: string[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let column = 0; column < GRID; column++) {
      const fill = cells[row][column];
      if (!fill) continue;
      elements.push(
        `<rect x="${n(column * CELL)}" y="${n(row * CELL)}" width="${n(CELL)}" height="${n(CELL)}" fill="${fill}"/>`,
      );
    }
  }

  // Guarantee a visible glyph even on a very sparse roll.
  if (elements.length === 0) {
    const offset = n(2 * CELL);
    elements.push(
      `<rect x="${offset}" y="${offset}" width="${n(CELL)}" height="${n(CELL)}" fill="${primary}"/>`,
    );
  }

  return { defs: '', layers: elements };
}
