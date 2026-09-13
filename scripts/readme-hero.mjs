/**
 * Renders the README hero — a grid of avatars straight from the built core, so
 * the image people see before installing is exactly what the library ships.
 *
 * Written into the playground's `public/` so npm READMEs can reference it by an
 * absolute URL that serves `image/svg+xml`. Run `pnpm build` first.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { morphatar, morphatarPalette } from '../packages/core/dist/index.js';

const OUT = new URL('../apps/web/public/hero.svg', import.meta.url).pathname;

const ROWS = [
  {
    variant: 'organic',
    seeds: ['morphatar', 'ada@lovelace.dev', 'grace-hopper', 'alan.turing', 'hedy.lamarr', 'joan-clarke', 'anita-borg', 'radia-perlman'],
  },
  {
    variant: 'geometric',
    seeds: ['katherine.johnson', 'margaret-hamilton', 'barbara.liskov', 'shafi@goldwasser.io', 'edsger.dijkstra', 'donald-knuth', 'frances.allen', 'john-backus'],
  },
  {
    variant: 'pixel',
    seeds: ['ken.thompson', 'dennis-ritchie', 'lynn.conway', 'annie-easley', 'claude.shannon', 'sophie-wilson', 'tim@berners-lee.net', 'mary.kenneth'],
  },
];

const TILE = 88;
const GAP = 16;
const COLS = Math.max(...ROWS.map((row) => row.seeds.length));
const width = COLS * TILE + (COLS - 1) * GAP;
const height = ROWS.length * TILE + (ROWS.length - 1) * GAP;

let tiles = '';
ROWS.forEach(({ variant, seeds }, row) => {
  seeds.forEach((seed, col) => {
    const svg = morphatar({
      seed,
      variant,
      mask: (row + col) % 2 === 0 ? 'squircle' : 'circle',
      complexity: 3 + ((row * 3 + col) % 6),
      multicolor: col % 3 === 0,
      animation: variant === 'organic' && col % 2 === 1 ? 'blink' : 'none',
      // Painted tiles, so transparent blobs survive both GitHub themes.
      background: morphatarPalette({ seed }).background,
      size: TILE,
    });
    const x = col * (TILE + GAP);
    const y = row * (TILE + GAP);
    tiles += svg.replace('<svg ', `<svg x="${x}" y="${y}" `);
  });
});

const hero =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"` +
  ` role="img" aria-label="Twenty-four Morphatar avatars across the organic, geometric and pixel variants">` +
  tiles +
  '</svg>\n';

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, hero);
console.log(`wrote ${OUT} (${(Buffer.byteLength(hero) / 1024).toFixed(1)} KB)`);
