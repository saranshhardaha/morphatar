/**
 * The determinism contract.
 *
 * Every other test asserts self-consistency within one run, which cannot catch
 * the failure that matters most here: a change to PRNG call order, palette
 * maths or shape maths that quietly reshapes every avatar users already have.
 * This one pins the actual bytes for a fixed matrix of seeds and options.
 *
 * A failure here is not automatically a bug — but it is always a decision. If
 * the new output is intended, regenerate with `node test/generate-golden.mjs`
 * and ship it as a breaking change.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import { morphatar } from '../dist/index.js';
import { CASES, SEEDS } from './generate-golden.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(readFileSync(join(here, 'fixtures', 'golden.json'), 'utf8'));

describe('golden output', () => {
  it('covers every seed and case in the matrix', () => {
    const expected = SEEDS.length * CASES.length;
    assert.equal(
      Object.keys(golden).length,
      expected,
      `fixture holds ${Object.keys(golden).length} entries, matrix expects ${expected} — regenerate it`,
    );
  });

  it('exercises all three variants and both animations', () => {
    const keys = Object.keys(golden).join(' ');
    for (const token of ['organic', 'geometric', 'pixel', 'blink', 'dart', 'multicolor']) {
      assert.ok(keys.includes(token), `matrix never exercises ${token}`);
    }
  });

  it('renders byte-identical output for every pinned configuration', () => {
    const drifted = [];
    for (const [key, expected] of Object.entries(golden)) {
      const actual = morphatar(JSON.parse(key));
      if (actual !== expected) drifted.push(key);
    }

    assert.equal(
      drifted.length,
      0,
      `${drifted.length} configuration(s) changed shape — every existing avatar for these seeds would look different:\n` +
        drifted.map((k) => `  ${k}`).join('\n') +
        '\n\nIf this is intended, regenerate: node test/generate-golden.mjs',
    );
  });

  it('fails loudly if a fixture entry is empty or malformed', () => {
    for (const [key, svg] of Object.entries(golden)) {
      assert.ok(svg.startsWith('<svg '), `${key} is not an svg`);
      assert.ok(svg.endsWith('</svg>'), `${key} is truncated`);
      assert.ok(!svg.includes('NaN') && !svg.includes('undefined'), `${key} contains NaN/undefined`);
    }
  });
});
