import { morphatarPalette } from '@morphatar/core';
import { Morphatar } from '@morphatar/react';
import { Playground } from '@/components/Playground';

const PIPELINE = [
  {
    step: '01',
    title: 'Hash',
    body: 'FNV-1a folds the seed string into a single 32-bit integer. Same string, same integer, on every machine.',
  },
  {
    step: '02',
    title: 'Expand',
    body: 'splitmix32 stretches that integer into 128 bits of sfc32 state — a fast counting PRNG with no global state.',
  },
  {
    step: '03',
    title: 'Colour',
    body: 'A base hue is drawn, then shifted by 30° or 120° and pushed until every foreground clears 4.5:1 against the background. One colour by default; multicolor merges the palette into a gradient.',
  },
  {
    step: '04',
    title: 'Draw',
    body: 'The same stream feeds one closed-spline blob and its expression, a Bauhaus grid, or a mirrored 5×5 identicon — assembled into a single SVG string, on transparency unless you ask for a background.',
  },
];

const MARQUEE_SEEDS = [
  'morphatar',
  'ada@lovelace.dev',
  'grace-hopper',
  'katherine.johnson',
  'alan.turing',
  'margaret-hamilton',
  'radia-perlman',
  'barbara.liskov',
  'shafi@goldwasser.io',
  'joan-clarke',
  'hedy.lamarr',
  'anita-borg',
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col">
      <header className="flex flex-col gap-8 px-6 py-14 lg:px-10 lg:py-20">
        <div className="flex items-start justify-between gap-8">
          <div className="flex items-center gap-4">
            <Morphatar seed="morphatar" variant="organic" mask="squircle" background="#fafafa" size={44} />
            <span className="font-mono text-sm uppercase tracking-[0.4em] text-chalk">Morphatar</span>
          </div>
          <a
            href="https://github.com/saranshhardaha/morphatar"
            className="border border-line px-3 py-2 font-mono text-[11px] lowercase text-soft transition-colors hover:border-soft hover:text-chalk"
          >
            github
          </a>
        </div>

        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl font-medium leading-[1.05] tracking-tight text-chalk sm:text-6xl">
            One seed in.
            <br />
            The same avatar out.
            <span className="block text-muted">Every time, everywhere.</span>
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-soft">
            A deterministic algorithmic avatar generator. No network, no canvas, no dependencies —
            just a hash, a counter-based PRNG and a string of SVG. Every organic blob is a single
            closed spline with an expression the seed picked for it.
          </p>
        </div>

        <dl className="grid max-w-3xl grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          {[
            ['6.1 KB', 'core, gzipped'],
            ['0', 'dependencies'],
            ['6', 'expressions'],
            ['100%', 'deterministic'],
          ].map(([value, label]) => (
            <div key={label} className="bg-ink px-4 py-5">
              <dt className="font-mono text-xl text-chalk">{value}</dt>
              <dd className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <Playground />

      <section className="px-6 py-16 lg:px-10 lg:py-24">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">The engine</h2>
        <div className="mt-8 grid gap-px border border-line bg-line md:grid-cols-2 xl:grid-cols-4">
          {PIPELINE.map((item) => (
            <article key={item.step} className="space-y-3 bg-ink p-6">
              <span className="font-mono text-[11px] text-muted">{item.step}</span>
              <h3 className="text-lg text-chalk">{item.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-soft">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line px-6 py-12 lg:px-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
          Twelve seeds, twelve avatars
        </h2>
        <div className="mt-8 grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-12">
          {MARQUEE_SEEDS.map((seed, index) => (
            <div key={seed} className="space-y-2">
              <Morphatar
                seed={seed}
                variant={index % 3 === 0 ? 'organic' : index % 3 === 1 ? 'geometric' : 'pixel'}
                mask={index % 2 === 0 ? 'squircle' : 'circle'}
                complexity={4 + (index % 5)}
                multicolor={index % 4 === 0}
                // Painted tiles: on a black page a transparent dark blob would
                // simply vanish, which is the trade-off `background` exists for.
                background={morphatarPalette({ seed }).background}
                size="100%"
                className="w-full"
              />
              <p className="truncate font-mono text-[10px] text-muted" title={seed}>
                {seed}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex flex-col gap-4 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <p className="font-mono text-[11px] text-muted">
          Morphatar — MIT licensed. Built as app 01 of 12.
        </p>
        <p className="font-mono text-[11px] text-muted">
          pnpm add @morphatar/react
        </p>
      </footer>
    </main>
  );
}
