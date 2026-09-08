'use client';

import { useCallback, useMemo, useState } from 'react';
import { morphatar } from '@morphatar/core';
import type { Animation, Mask, Variant } from '@morphatar/core';
import { Morphatar } from '@morphatar/react';

import { Button, Field, PalettePicker, Slider, ToggleGroup } from './controls';
import { CodeBlock } from './CodeBlock';
import type { CodeProp } from './CodeBlock';

const VARIANTS: readonly { value: Variant; label: string }[] = [
  { value: 'organic', label: 'organic' },
  { value: 'geometric', label: 'geometric' },
  { value: 'pixel', label: 'pixel' },
];

const MASKS: readonly { value: Mask; label: string }[] = [
  { value: 'circle', label: 'circle' },
  { value: 'squircle', label: 'squircle' },
  { value: 'hexagon', label: 'hexagon' },
  { value: 'none', label: 'none' },
];

const ANIMATIONS: readonly { value: Animation; label: string }[] = [
  { value: 'none', label: 'none' },
  { value: 'pulse', label: 'pulse' },
  { value: 'morph', label: 'morph' },
  { value: 'spin', label: 'spin' },
];

const COLOUR_MODES = [
  { value: 'single', label: 'single' },
  { value: 'multi', label: 'multicolor' },
] as const;

/** `auto` passes no `background` at all, so each variant uses its own default. */
const BACKGROUNDS = [
  { value: 'auto', label: 'auto' },
  { value: 'transparent', label: 'none' },
  { value: '#fafafa', label: 'white' },
  { value: '#09090b', label: 'black' },
] as const;

type BackgroundChoice = (typeof BACKGROUNDS)[number]['value'];

const PALETTES: readonly { name: string; colors?: string[] }[] = [
  { name: 'auto' },
  { name: 'mono', colors: ['#09090b', '#fafafa', '#a1a1aa', '#3f3f46'] },
  { name: 'ember', colors: ['#170c0a', '#ff5a36', '#ffb37a', '#ffe8d6'] },
  { name: 'tide', colors: ['#04202c', '#3bd6c6', '#89f0d8', '#e8fffb'] },
  { name: 'bauhaus', colors: ['#f4efe4', '#e4572e', '#1789bb', '#1b1b1b'] },
  { name: 'orchid', colors: ['#1a0f2b', '#c084fc', '#f0abfc', '#ede9fe'] },
];

const SAMPLE_SEEDS = [
  'ada@lovelace.dev',
  'grace-hopper',
  'katherine.johnson',
  'alan.turing',
  'margaret-hamilton',
  'radia-perlman',
  'barbara.liskov',
  'shafi@goldwasser.io',
];

/** Deterministic-looking but genuinely random — this only picks a new seed. */
function randomSeed(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function Playground() {
  const [seed, setSeed] = useState('ada@lovelace.dev');
  const [variant, setVariant] = useState<Variant>('organic');
  const [mask, setMask] = useState<Mask>('squircle');
  const [animation, setAnimation] = useState<Animation>('none');
  const [complexity, setComplexity] = useState(5);
  const [multicolor, setMulticolor] = useState(false);
  const [backgroundChoice, setBackgroundChoice] = useState<BackgroundChoice>('auto');
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const colors = PALETTES[paletteIndex]?.colors;
  const background = backgroundChoice === 'auto' ? undefined : backgroundChoice;

  const options = useMemo(
    () => ({ seed, variant, mask, animation, complexity, multicolor, colors, background }),
    [seed, variant, mask, animation, complexity, multicolor, colors, background],
  );

  const svg = useMemo(() => morphatar({ ...options, size: 256 }), [options]);

  const flash = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 1600);
  }, []);

  const copySvg = useCallback(() => {
    void navigator.clipboard?.writeText(svg).then(
      () => flash('svg copied'),
      () => flash('copy failed'),
    );
  }, [svg, flash]);

  const downloadSvg = useCallback(() => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `morphatar-${seed.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'avatar'}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
    flash('svg downloaded');
  }, [svg, seed, flash]);

  const codeProps = useMemo<CodeProp[]>(() => {
    const list: CodeProp[] = [{ name: 'seed', literal: `"${seed}"`, kind: 'string' }];
    if (variant !== 'organic') list.push({ name: 'variant', literal: `"${variant}"`, kind: 'string' });
    if (mask !== 'squircle') list.push({ name: 'mask', literal: `"${mask}"`, kind: 'string' });
    if (complexity !== 5) list.push({ name: 'complexity', literal: `{${complexity}}`, kind: 'expr' });
    if (multicolor) list.push({ name: 'multicolor', literal: '{true}', kind: 'expr' });
    if (background) list.push({ name: 'background', literal: `"${background}"`, kind: 'string' });
    if (animation !== 'none') list.push({ name: 'animation', literal: `"${animation}"`, kind: 'string' });
    if (colors) {
      list.push({
        name: 'colors',
        literal: `{[${colors.map((c) => `'${c}'`).join(', ')}]}`,
        kind: 'expr',
      });
    }
    list.push({ name: 'size', literal: '{64}', kind: 'expr' });
    return list;
  }, [seed, variant, mask, complexity, multicolor, background, animation, colors]);

  return (
    <div className="grid gap-px border-y border-line bg-line xl:grid-cols-[320px_minmax(0,1fr)_minmax(360px,420px)]">
      {/* Configurator */}
      <section className="space-y-7 bg-ink p-6 lg:p-8">
        <Field label="Seed" hint={`${seed.length} chars`}>
          <div className="flex gap-px bg-line">
            <input
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              placeholder="username or email"
              aria-label="Avatar seed"
              className="min-w-0 flex-1 bg-surface px-3 py-2.5 font-mono text-[13px] text-chalk placeholder:text-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setSeed(randomSeed())}
              title="Random seed"
              className="bg-surface px-3 font-mono text-[11px] lowercase text-soft transition-colors hover:bg-raised hover:text-chalk"
            >
              shuffle
            </button>
          </div>
        </Field>

        <Field label="Variant">
          <ToggleGroup value={variant} options={VARIANTS} onChange={setVariant} columns={3} />
        </Field>

        <Field label="Mask">
          <ToggleGroup value={mask} options={MASKS} onChange={setMask} columns={4} />
        </Field>

        <Field label="Complexity" hint={String(complexity)}>
          <Slider value={complexity} min={1} max={10} onChange={setComplexity} ariaLabel="Complexity" />
        </Field>

        <Field label="Colour mode" hint={multicolor ? 'full palette' : 'one colour'}>
          <ToggleGroup
            value={multicolor ? 'multi' : 'single'}
            options={COLOUR_MODES}
            onChange={(next) => setMulticolor(next === 'multi')}
            columns={2}
          />
        </Field>

        <Field
          label="Background"
          hint={backgroundChoice === 'auto' ? 'per variant' : backgroundChoice === 'transparent' ? 'transparent' : backgroundChoice}
        >
          <ToggleGroup
            value={backgroundChoice}
            options={BACKGROUNDS}
            onChange={setBackgroundChoice}
            columns={4}
          />
        </Field>

        <Field label="Animation">
          <ToggleGroup value={animation} options={ANIMATIONS} onChange={setAnimation} columns={4} />
        </Field>

        <Field label="Palette" hint={colors ? `${colors.length} colors` : 'from seed'}>
          <PalettePicker presets={PALETTES} activeIndex={paletteIndex} onChange={setPaletteIndex} />
        </Field>
      </section>

      {/* Preview */}
      <section className="flex flex-col items-center justify-center gap-8 bg-ink p-8 lg:p-12">
        <div className="grid-lines flex aspect-square w-full max-w-[420px] items-center justify-center border border-line p-8">
          <Morphatar
            key={`${variant}-${animation}`}
            seed={seed}
            variant={variant}
            mask={mask}
            complexity={complexity}
            multicolor={multicolor}
            animation={animation}
            colors={colors}
            background={background}
            size="100%"
            className="w-full max-w-[320px] animate-rise"
          />
        </div>

        <div className="flex w-full max-w-[420px] items-end justify-between gap-6">
          <div className="flex items-end gap-4">
            {[48, 32, 24].map((px) => (
              <div key={px} className="flex flex-col items-center gap-2">
                <Morphatar
                  seed={seed}
                  variant={variant}
                  mask={mask}
                  complexity={complexity}
                  multicolor={multicolor}
                  colors={colors}
                  background={background}
                  size={px}
                />
                <span className="font-mono text-[10px] text-muted">{px}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={copySvg}>copy svg</Button>
            <Button onClick={downloadSvg} variant="solid">
              download
            </Button>
          </div>
        </div>

        <p aria-live="polite" className="h-4 font-mono text-[11px] text-soft">
          {notice}
        </p>
      </section>

      {/* Code */}
      <section className="space-y-6 bg-ink p-6 lg:p-8">
        <CodeBlock props={codeProps} />

        <div className="border border-line bg-surface">
          <div className="border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Same seed, every variant
          </div>
          <div className="grid grid-cols-3 gap-px bg-line">
            {VARIANTS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setVariant(option.value)}
                className="flex flex-col items-center gap-2 bg-surface p-4 transition-colors hover:bg-raised"
              >
                <Morphatar
                  seed={seed}
                  variant={option.value}
                  mask={mask}
                  complexity={complexity}
                  multicolor={multicolor}
                  colors={colors}
                  background={background}
                  size={56}
                />
                <span className="font-mono text-[10px] lowercase text-muted">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-line bg-surface">
          <div className="border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Try a seed
          </div>
          <div className="grid grid-cols-4 gap-px bg-line">
            {SAMPLE_SEEDS.map((sample) => (
              <button
                key={sample}
                type="button"
                title={sample}
                onClick={() => setSeed(sample)}
                className="bg-surface p-3 transition-colors hover:bg-raised"
              >
                <Morphatar
                  seed={sample}
                  variant={variant}
                  mask={mask}
                  complexity={complexity}
                  multicolor={multicolor}
                  colors={colors}
                  background={background}
                  size="100%"
                  className="w-full"
                />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
