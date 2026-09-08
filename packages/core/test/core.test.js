import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  contrastRatio,
  createPalette,
  createRandom,
  fnv1a,
  morphatar,
  morphatarDataUri,
  morphatarPalette,
  MIN_CONTRAST,
} from '../dist/index.js';

const SEEDS = [
  'ada@lovelace.dev',
  'grace-hopper',
  'morphatar',
  '',
  '🌱 unicode seed',
  'a',
  '0',
  'Ada@Lovelace.dev',
];

describe('fnv1a', () => {
  it('matches the published 32-bit reference vectors', () => {
    assert.equal(fnv1a(''), 0x811c9dc5);
    assert.equal(fnv1a('a'), 0xe40c292c);
    assert.equal(fnv1a('foobar'), 0xbf9cf968);
  });

  it('always returns an unsigned 32-bit integer', () => {
    for (const seed of SEEDS) {
      const hash = fnv1a(seed);
      assert.ok(Number.isInteger(hash) && hash >= 0 && hash <= 0xffffffff, seed);
    }
  });
});

describe('createRandom', () => {
  it('produces the same stream for the same seed', () => {
    const a = createRandom('morphatar');
    const b = createRandom('morphatar');
    for (let i = 0; i < 500; i++) assert.equal(a(), b());
  });

  it('produces a different stream for a different seed', () => {
    const a = createRandom('morphatar');
    const b = createRandom('morphatas');
    const left = Array.from({ length: 20 }, a);
    const right = Array.from({ length: 20 }, b);
    assert.notDeepEqual(left, right);
  });

  it('stays inside [0, 1)', () => {
    const rand = createRandom('range-check');
    for (let i = 0; i < 20000; i++) {
      const value = rand();
      assert.ok(value >= 0 && value < 1, `out of range: ${value}`);
    }
  });

  it('is roughly uniform across 10 buckets', () => {
    const rand = createRandom('uniformity');
    const draws = 100000;
    const buckets = new Array(10).fill(0);
    for (let i = 0; i < draws; i++) buckets[Math.floor(rand() * 10)]++;
    for (const count of buckets) {
      assert.ok(Math.abs(count - draws / 10) < draws / 10 * 0.1, `skewed bucket: ${count}`);
    }
  });
});

describe('morphatar determinism', () => {
  it('renders byte-identical SVG for identical options', () => {
    for (const seed of SEEDS) {
      for (const variant of ['organic', 'geometric', 'pixel']) {
        const options = { seed, variant, complexity: 7, mask: 'hexagon' };
        assert.equal(morphatar(options), morphatar({ ...options }), `${variant}:${seed}`);
      }
    }
  });

  it('renders differently for different seeds', () => {
    const rendered = new Set(SEEDS.map((seed) => morphatar({ seed })));
    assert.equal(rendered.size, SEEDS.length);
  });

  it('keeps the palette stable when only geometry options change', () => {
    const base = morphatarPalette({ seed: 'stable-palette' });
    for (const variant of ['organic', 'geometric', 'pixel']) {
      for (const complexity of [1, 5, 10]) {
        assert.deepEqual(morphatarPalette({ seed: 'stable-palette', variant, complexity }), base);
      }
    }
  });

  it('never emits NaN in path or shape data', () => {
    for (const seed of SEEDS) {
      for (const variant of ['organic', 'geometric', 'pixel']) {
        for (let complexity = 1; complexity <= 10; complexity++) {
          const svg = morphatar({ seed, variant, complexity });
          assert.ok(!svg.includes('NaN'), `${variant}/${complexity}/${seed}`);
          assert.ok(!svg.includes('undefined'), `${variant}/${complexity}/${seed}`);
        }
      }
    }
  });
});

describe('morphatar markup', () => {
  it('emits a single well-formed svg root', () => {
    const svg = morphatar({ seed: 'markup' });
    assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(svg.endsWith('</svg>'));
    assert.equal(svg.split('<svg').length - 1, 1);
    assert.ok(svg.includes('viewBox="0 0 100 100"'));
    assert.ok(svg.includes('role="img"'));
  });

  it('applies defaults: organic, squircle, no animation, 100%', () => {
    const svg = morphatar({ seed: 'defaults' });
    assert.equal(svg, morphatar({ seed: 'defaults', variant: 'organic', mask: 'squircle', animation: 'none', size: '100%', complexity: 5 }));
    assert.ok(svg.includes('<path'));
    assert.ok(svg.includes('<clipPath'));
    assert.ok(!svg.includes('<style>'));
    assert.ok(svg.includes('width="100%"'));
  });

  it('adds a clipPath for every mask except none', () => {
    for (const mask of ['circle', 'squircle', 'hexagon']) {
      assert.ok(morphatar({ seed: 'mask', mask }).includes('<clipPath'), mask);
    }
    assert.ok(!morphatar({ seed: 'mask', mask: 'none' }).includes('<clipPath'));
  });

  it('scopes animation ids per configuration', () => {
    const a = morphatar({ seed: 'anim-a', animation: 'pulse' });
    const b = morphatar({ seed: 'anim-b', animation: 'pulse' });
    const idOf = (svg) => svg.match(/@keyframes (m[a-z0-9]+)p/)[1];
    assert.notEqual(idOf(a), idOf(b));
    assert.ok(a.includes('prefers-reduced-motion'));
    assert.ok(!morphatar({ seed: 'anim-a' }).includes('@keyframes'));
  });

  it('staggers morph across layers and wraps pulse/spin once', () => {
    const morph = morphatar({ seed: 'motion', animation: 'morph', complexity: 10 });
    assert.ok(morph.includes('animation-delay:0s'));
    assert.ok(morph.includes('animation-delay:0.4s'));
    const spin = morphatar({ seed: 'motion', animation: 'spin' });
    assert.equal(spin.split('class="').length - 1, 1);
  });

  it('honours numeric and string sizes', () => {
    assert.ok(morphatar({ seed: 's', size: 128 }).includes('width="128" height="128"'));
    assert.ok(morphatar({ seed: 's', size: '4rem' }).includes('width="4rem" height="4rem"'));
  });

  it('escapes the accessible name and never leaks the seed', () => {
    const svg = morphatar({ seed: 'user@example.com', title: 'Ada & "Co" <x>' });
    assert.ok(svg.includes('aria-label="Ada &amp; &quot;Co&quot; &lt;x&gt;"'));
    assert.ok(!svg.includes('user@example.com'));
    assert.ok(morphatar({ seed: 'user@example.com' }).includes('aria-label="Avatar"'));
  });

  it('produces a decodable data uri', () => {
    const uri = morphatarDataUri({ seed: 'uri' });
    assert.ok(uri.startsWith('data:image/svg+xml;utf8,'));
    assert.equal(decodeURIComponent(uri.slice('data:image/svg+xml;utf8,'.length)), morphatar({ seed: 'uri' }));
  });

  it('clamps complexity into 1..10', () => {
    assert.equal(morphatar({ seed: 'c', complexity: -4 }), morphatar({ seed: 'c', complexity: 1 }));
    assert.equal(morphatar({ seed: 'c', complexity: 99 }), morphatar({ seed: 'c', complexity: 10 }));
  });

  it('stays comfortably small', () => {
    for (const variant of ['organic', 'geometric', 'pixel']) {
      const svg = morphatar({ seed: 'size-budget', variant, complexity: 10 });
      assert.ok(svg.length < 4000, `${variant} is ${svg.length} bytes`);
    }
  });
});

describe('variants', () => {
  it('scales node count with complexity', () => {
    const count = (svg) => (svg.match(/<path |<rect |<circle /g) || []).length;
    assert.ok(count(morphatar({ seed: 'v', complexity: 10 })) > count(morphatar({ seed: 'v', complexity: 1 })));
  });

  it('mirrors the pixel grid horizontally', () => {
    for (const seed of SEEDS) {
      const svg = morphatar({ seed, variant: 'pixel', mask: 'none', complexity: 6 });
      const cells = new Set(
        [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="20"/g)].map(
          (m) => `${m[1]},${m[2]}`,
        ),
      );
      for (const cell of cells) {
        const [x, y] = cell.split(',').map(Number);
        assert.ok(cells.has(`${80 - x},${y}`), `missing mirror of ${cell} for "${seed}"`);
      }
    }
  });

  it('draws geometric cells on a 3x3 or 4x4 grid', () => {
    for (const complexity of [1, 5, 6, 10]) {
      const columns = complexity <= 5 ? 3 : 4;
      const cell = 100 / columns;
      const svg = morphatar({ seed: 'grid', variant: 'geometric', complexity });
      const offsets = [...svg.matchAll(/translate\(([\d.]+) ([\d.]+)\)/g)];
      assert.ok(offsets.length > 0);
      const lanes = Array.from({ length: columns }, (_, i) => Math.round(i * cell * 100) / 100);
      for (const [, x, y] of offsets) {
        assert.ok(lanes.includes(Number(x)), `${x} off-grid at complexity ${complexity}`);
        assert.ok(lanes.includes(Number(y)), `${y} off-grid at complexity ${complexity}`);
      }
    }
  });
});

describe('palette', () => {
  it('meets the 4.5:1 contrast floor for generated palettes', () => {
    for (let i = 0; i < 300; i++) {
      const { background, foreground } = morphatarPalette({ seed: `contrast-${i}` });
      for (const color of foreground) {
        const ratio = contrastRatio(color, background);
        assert.ok(ratio >= MIN_CONTRAST - 1e-9, `seed ${i}: ${color} on ${background} is ${ratio.toFixed(2)}`);
      }
    }
  });

  it('only paints with colors from a custom palette', () => {
    const colors = ['#0a0a0a', '#fafafa', '#737373', '#d4d4d4'];
    const allowed = new Set(colors);
    for (const variant of ['organic', 'geometric', 'pixel']) {
      const svg = morphatar({ seed: 'custom', variant, colors, complexity: 9 });
      for (const [, fill] of svg.matchAll(/fill="([^"]+)"/g)) {
        assert.ok(allowed.has(fill), `${variant} used unexpected fill ${fill}`);
      }
    }
  });

  it('still renders with a single custom color', () => {
    const { background, foreground } = createPalette(createRandom('mono'), ['#000000']);
    assert.equal(background, '#000000');
    assert.equal(foreground.length, 1);
    assert.ok(contrastRatio(foreground[0], background) >= MIN_CONTRAST);
  });

  it('ignores an empty custom palette and falls back to generation', () => {
    assert.equal(morphatar({ seed: 'empty', colors: [] }), morphatar({ seed: 'empty' }));
  });

  it('computes known contrast ratios', () => {
    assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 1e-6);
    assert.ok(Math.abs(contrastRatio('#ffffff', '#ffffff') - 1) < 1e-6);
    assert.ok(Math.abs(contrastRatio('#000', '#fff') - 21) < 1e-6);
  });
});
