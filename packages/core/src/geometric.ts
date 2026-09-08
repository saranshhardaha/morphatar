/**
 * Variant B — Bauhaus grid.
 *
 * A 3×3 or 4×4 grid; every cell independently becomes a disc, a quarter disc,
 * a triangle or empty space, then snaps to one of four right-angle rotations.
 */
import { pick, randInt } from './prng.js';
import { n } from './svg.js';
import type { Drawing, RenderContext } from './types.js';

const ROTATIONS = [0, 90, 180, 270] as const;
const SHAPES = ['circle', 'quarter', 'triangle'] as const;
type Shape = (typeof SHAPES)[number];

function cellShape(shape: Shape, size: number, fill: string): string {
  const half = n(size / 2);
  const full = n(size);
  switch (shape) {
    case 'circle':
      return `<circle cx="${half}" cy="${half}" r="${half}" fill="${fill}"/>`;
    case 'quarter':
      return `<path d="M0 0H${full}A${full} ${full} 0 0 1 0 ${full}Z" fill="${fill}"/>`;
    case 'triangle':
      return `<path d="M0 0H${full}L0 ${full}Z" fill="${fill}"/>`;
  }
}

export function renderGeometric({
  rand,
  palette,
  complexity,
  multicolor,
}: RenderContext): Drawing {
  const columns = complexity <= 5 ? 3 : 4;
  const cell = 100 / columns;
  // Sparse at low complexity, nearly packed at 10.
  const density = 0.42 + (complexity / 10) * 0.45;
  // Single-color grids pick one foreground and hold it for every cell.
  const primary = palette.foreground[randInt(rand, 0, palette.foreground.length - 1)];

  const elements: string[] = [];
  for (let row = 0; row < columns; row++) {
    for (let column = 0; column < columns; column++) {
      const filled = rand() < density;
      const shape = pick(rand, SHAPES);
      const rotation = pick(rand, ROTATIONS);
      const cellColor = palette.foreground[randInt(rand, 0, palette.foreground.length - 1)];
      const fill = multicolor ? cellColor : primary;
      if (!filled) continue;

      const x = n(column * cell);
      const y = n(row * cell);
      const pivot = n(cell / 2);
      const transform =
        rotation === 0
          ? `translate(${x} ${y})`
          : `translate(${x} ${y}) rotate(${rotation} ${pivot} ${pivot})`;
      elements.push(`<g transform="${transform}">${cellShape(shape, cell, fill)}</g>`);
    }
  }

  // An all-empty grid is a valid roll of the dice but a useless avatar.
  if (elements.length === 0) {
    const offset = n((100 - cell) / 2);
    elements.push(
      `<g transform="translate(${offset} ${offset})">${cellShape('circle', cell, primary)}</g>`,
    );
  }

  return { defs: '', layers: elements };
}
