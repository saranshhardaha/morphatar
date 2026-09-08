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
    assert.equal(
      svg,
      morphatar({
        seed: 'defaults',
        variant: 'organic',
        mask: 'squircle',
        animation: 'none',
        size: '100%',
        complexity: 5,
        multicolor: false,
      }),
    );
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
    const morph = morphatar({ seed: 'motion', variant: 'geometric', animation: 'morph', complexity: 10 });
    assert.ok(morph.includes('animation-delay:0s'));
    assert.ok(morph.includes('animation-delay:0.4s'));
    const spin = morphatar({ seed: 'motion', animation: 'spin' });
    assert.equal(spin.split('class="').length - 1, 1);
  });

  it('keeps an organic face on a single morph layer', () => {
    // Blob and eyes must not drift apart, so organic ships exactly one layer.
    const morph = morphatar({ seed: 'motion', animation: 'morph', complexity: 10 });
    assert.equal(morph.split('animation-delay:').length - 1, 1);
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
    // Organic is always one blob, so complexity shows up as spline segments.
    const segments = (svg) => (svg.match(/C/g) || []).length;
    assert.ok(
      segments(morphatar({ seed: 'v', complexity: 10 })) >
        segments(morphatar({ seed: 'v', complexity: 1 })),
    );

    const cells = (svg) => (svg.match(/<g transform=/g) || []).length;
    assert.ok(
      cells(morphatar({ seed: 'v', variant: 'geometric', complexity: 10 })) >
        cells(morphatar({ seed: 'v', variant: 'geometric', complexity: 1 })),
    );
  });

  it('draws exactly one blob and one pair of eyes', () => {
    for (const seed of SEEDS) {
      // mask: 'none' keeps the squircle clip path out of the match.
      const svg = morphatar({ seed, complexity: 9, mask: 'none' });
      const blobs = [...svg.matchAll(/<path d="M[^"]+Z"/g)];
      assert.equal(blobs.length, 1, `seed "${seed}" drew ${blobs.length} blobs`);

      // Two eyes, whatever the expression: circles, ellipses or stroked paths.
      const eyes =
        (svg.match(/<circle cx=/g) || []).length +
        (svg.match(/<ellipse /g) || []).length +
        (svg.match(/stroke-linecap="round"/g) || []).length;
      assert.equal(eyes, 2, `seed "${seed}" drew ${eyes} eyes`);
    }
  });

  it('varies the expression across seeds', () => {
    const shapes = new Set(
      Array.from({ length: 60 }, (_, i) => {
        const svg = morphatar({ seed: `face-${i}` });
        return [
          (svg.match(/<circle cx=/g) || []).length,
          (svg.match(/<ellipse /g) || []).length,
          (svg.match(/stroke-linecap/g) || []).length,
          svg.includes('Q') ? 'q' : '',
        ].join('/');
      }),
    );
    assert.ok(shapes.size >= 3, `only ${shapes.size} distinct eye shapes over 60 seeds`);
  });

  it('paints eyes in the background color', () => {
    const colors = ['#101010', '#fafafa', '#8b8b8b'];
    for (const seed of SEEDS) {
      const svg = morphatar({ seed, colors, mask: 'none' });
      const background = svg.match(/<rect width="100" height="100" fill="([^"]+)"/)[1];
      const eyeFills = [...svg.matchAll(/<(?:circle|ellipse)[^>]*fill="([^"]+)"/g)].map((m) => m[1]);
      const eyeStrokes = [...svg.matchAll(/stroke="([^"]+)"/g)].map((m) => m[1]);
      for (const color of [...eyeFills, ...eyeStrokes]) {
        assert.equal(color, background, `seed "${seed}"`);
      }
    }
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
    const allowed = new Set([...colors, 'none']);
    for (const variant of ['organic', 'geometric', 'pixel']) {
      for (const multicolor of [false, true]) {
        const svg = morphatar({ seed: 'custom', variant, colors, complexity: 9, multicolor });
        const used = [
          ...[...svg.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]),
          ...[...svg.matchAll(/stroke="([^"]+)"/g)].map((m) => m[1]),
          ...[...svg.matchAll(/stop-color="([^"]+)"/g)].map((m) => m[1]),
        ].filter((value) => !value.startsWith('url('));
        for (const color of used) {
          assert.ok(allowed.has(color), `${variant} used unexpected color ${color}`);
        }
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

describe('multicolor', () => {
  const paletteOf = (seed) => morphatarPalette({ seed });
  const fillsOf = (svg) =>
    [...svg.matchAll(/<(?:rect|circle|path|ellipse)[^>]*fill="(#[^"]+)"/g)].map((m) => m[1]);

  it('is off by default', () => {
    for (const variant of ['organic', 'geometric', 'pixel']) {
      assert.equal(
        morphatar({ seed: 'mc', variant }),
        morphatar({ seed: 'mc', variant, multicolor: false }),
        variant,
      );
    }
  });

  it('holds every grid cell to one color when off', () => {
    for (const variant of ['geometric', 'pixel']) {
      for (const seed of SEEDS) {
        const svg = morphatar({ seed, variant, complexity: 10, mask: 'none' });
        const background = paletteOf(seed).background;
        const shapeFills = new Set(fillsOf(svg).filter((fill) => fill !== background));
        assert.ok(shapeFills.size <= 1, `${variant}/"${seed}" used ${shapeFills.size} colors`);
      }
    }
  });

  it('uses more than one color when on', () => {
    let multiColored = 0;
    for (const seed of SEEDS) {
      const svg = morphatar({ seed, variant: 'geometric', complexity: 10, multicolor: true });
      const background = paletteOf(seed).background;
      if (new Set(fillsOf(svg).filter((fill) => fill !== background)).size > 1) multiColored++;
    }
    assert.ok(
      multiColored >= SEEDS.length - 1,
      `only ${multiColored}/${SEEDS.length} seeds multi-coloured`,
    );
  });

  it('merges organic colors into one scoped gradient instead of layering them', () => {
    const flat = morphatar({ seed: 'grad' });
    assert.ok(!flat.includes('linearGradient'));

    const blended = morphatar({ seed: 'grad', multicolor: true });
    const id = blended.match(/<linearGradient id="([^"]+)"/)[1];
    assert.ok(blended.includes(`fill="url(#${id})"`));
    // One blob, one gradient — never a stack of overlapping shapes.
    assert.equal(blended.split('<linearGradient').length - 1, 1);
    assert.ok(blended.match(/<stop /g).length >= 2);
    // Scoped per configuration, so two avatars can share a page.
    assert.notEqual(
      id,
      morphatar({ seed: 'grad-2', multicolor: true }).match(/<linearGradient id="([^"]+)"/)[1],
    );
  });
});
