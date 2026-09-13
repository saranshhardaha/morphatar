/**
 * Regenerates the golden fixture.
 *
 *   pnpm --filter @morphatar/core build
 *   node test/generate-golden.mjs
 *
 * Run this ONLY when you mean to change what existing seeds render. The
 * fixture is the contract: a seed that renders differently is a different
 * avatar for every user who already has one, which is a breaking change no
 * matter how small the diff looks.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { morphatar } from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));

/** Awkward seeds on purpose: empty, single char, unicode, case-variant. */
export const SEEDS = [
  '',
  'a',
  '0',
  'morphatar',
  'ada@lovelace.dev',
  'Ada@Lovelace.dev',
  'grace-hopper',
  '🌱 unicode seed',
];

/** One entry per option shape worth pinning, not per permutation. */
export const CASES = [
  { variant: 'organic' },
  { variant: 'organic', complexity: 1 },
  { variant: 'organic', complexity: 10, multicolor: true },
  { variant: 'organic', animation: 'blink' },
  { variant: 'organic', animation: 'dart', mask: 'circle', background: '#09090b' },
  { variant: 'geometric', complexity: 8 },
  { variant: 'geometric', mask: 'hexagon', colors: ['#0a0a0a', '#fafafa', '#737373'] },
  { variant: 'pixel', complexity: 3 },
  { variant: 'pixel', complexity: 9, multicolor: true, background: 'transparent' },
];

export function buildGolden() {
  const out = {};
  for (const seed of SEEDS) {
    for (const options of CASES) {
      const full = { seed, ...options };
      out[JSON.stringify(full)] = morphatar(full);
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const golden = buildGolden();
  const path = join(here, 'fixtures', 'golden.json');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(golden, null, 2) + '\n');
  console.log(`wrote ${Object.keys(golden).length} entries to ${path}`);
}
