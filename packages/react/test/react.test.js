/**
 * The wrapper's contract: whatever `@morphatar/core` renders for a set of
 * options, the component renders the same thing — on the server, where SSR and
 * hydration have to agree byte for byte.
 *
 * The colour tests are not hypothetical. The wrapper once memoised `colors` by
 * joining the array on commas and splitting it back, which quietly tore
 * `rgb(255, 0, 0)` into three fragments. It shipped.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Morphatar, morphatar } from '../dist/index.js';

const render = (props) => renderToStaticMarkup(createElement(Morphatar, props));

describe('Morphatar component', () => {
  it('renders exactly what the core renders', () => {
    for (const options of [
      { seed: 'ada@lovelace.dev' },
      { seed: 'grace-hopper', variant: 'geometric', complexity: 8 },
      { seed: '', variant: 'pixel', multicolor: true },
      { seed: 'motion', animation: 'blink', mask: 'circle' },
    ]) {
      assert.ok(render(options).includes(morphatar(options)), JSON.stringify(options));
    }
  });

  it('keeps commas inside rgb() and hsl() colours intact', () => {
    const colors = ['rgb(255, 0, 0)', 'hsl(200, 50%, 50%)'];
    const options = { seed: 'colours', variant: 'geometric', multicolor: true, complexity: 10, colors };
    const html = render(options);

    assert.ok(html.includes(morphatar(options)), 'component output diverged from core');
    // A split on commas would leave fragments like "rgb(255" in the markup.
    assert.ok(!html.includes('rgb(255"'), 'rgb() was torn apart');
    assert.ok(!html.includes('hsl(200"'), 'hsl() was torn apart');
  });

  it('is deterministic across renders', () => {
    const options = { seed: 'stable', animation: 'dart' };
    assert.equal(render(options), render({ ...options }));
  });

  it('forwards span attributes and keeps the box square', () => {
    const html = render({ seed: 's', size: 64, className: 'rounded-full', 'data-testid': 'avatar' });
    assert.ok(html.includes('class="rounded-full"'));
    assert.ok(html.includes('data-testid="avatar"'));
    assert.ok(html.includes('width:64px'));
    assert.ok(html.includes('aspect-ratio:1 / 1'));
  });

  it('accepts a CSS length for size', () => {
    const html = render({ seed: 's', size: '4rem' });
    assert.ok(html.includes('width:4rem'));
  });

  it('never leaks the seed into the markup', () => {
    const html = render({ seed: 'user@example.com' });
    assert.ok(!html.includes('user@example.com'));
    assert.ok(html.includes('aria-label="Avatar"'));
  });

  it('re-exports the core helpers', async () => {
    const mod = await import('../dist/index.js');
    for (const name of ['morphatar', 'morphatarDataUri', 'morphatarPalette']) {
      assert.equal(typeof mod[name], 'function', name);
    }
  });
});
