import { morphatarPalette } from '@morphatar/core';
import { Morphatar } from '@morphatar/react';
import { Playground } from '@/components/Playground';
import { Hero } from '@/components/Hero';

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
          <div className="flex gap-2">
            <a
              href="https://www.npmjs.com/package/@morphatar/react"
              className="border border-line px-3 py-2 font-mono text-[11px] lowercase text-soft transition-colors hover:border-soft hover:text-chalk"
            >
              npm
            </a>
            <a
              href="https://github.com/saranshhardaha/morphatar"
              className="border border-line px-3 py-2 font-mono text-[11px] lowercase text-soft transition-colors hover:border-soft hover:text-chalk"
            >
              github
            </a>
          </div>
        </div>

        <Hero>
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
        </Hero>
      </header>

      <Playground />

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
        <a
          href="https://www.npmjs.com/package/@morphatar/react"
          className="font-mono text-[11px] text-muted transition-colors hover:text-chalk"
        >
          pnpm add @morphatar/react
        </a>
      </footer>
    </main>
  );
}
