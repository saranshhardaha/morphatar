'use client';

import { useEffect, useState } from 'react';
import { Morphatar } from '@morphatar/react';

import { CodeBlock } from './CodeBlock';
import type { CodeProp } from './CodeBlock';

/** The npm mark, inline so the page pulls no external asset. */
function NpmMark() {
  return (
    <svg viewBox="0 0 27.23 27.23" width="20" height="20" aria-hidden="true">
      <rect width="27.23" height="27.23" rx="2" fill="#cb3837" />
      <path d="M5.8 21.75V5.8h15.63v15.95h-4.3V9.4h-3.6v12.35z" fill="#fff" />
    </svg>
  );
}

function randomSeed(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Code on the left, the avatar it describes on the right.
 *
 * The first render — server and hydration alike — uses the package's own name
 * as the seed, so there is no mismatch and no empty frame. The random seed
 * lands on mount, which is what makes every refresh a different face.
 */
export function Hero({ children }: { children: React.ReactNode }) {
  const [seed, setSeed] = useState('morphatar');

  useEffect(() => {
    setSeed(randomSeed());
  }, []);

  const code: CodeProp[] = [
    { name: 'seed', literal: `"${seed}"`, kind: 'string' },
    { name: 'animation', literal: '"blink"', kind: 'string' },
    { name: 'size', literal: '{64}', kind: 'expr' },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-center lg:gap-16">
      <div className="max-w-2xl space-y-6">
        {children}

        <CodeBlock props={code} />

        <a
          href="https://www.npmjs.com/package/@morphatar/react"
          className="inline-flex items-center gap-2.5 border border-line px-3.5 py-2.5 font-mono text-[11px] text-soft transition-colors hover:border-soft hover:text-chalk"
        >
          <NpmMark />
          @morphatar/react
        </a>
      </div>

      <div className="flex justify-center lg:justify-end">
        <div className="grid-lines flex aspect-square w-full max-w-[320px] items-center justify-center border border-line p-8">
          <Morphatar
            key={seed}
            seed={seed}
            variant="organic"
            animation="blink"
            background="#fafafa"
            size="100%"
            className="w-full max-w-[220px] animate-rise"
            title="A randomly seeded avatar"
          />
        </div>
      </div>
    </div>
  );
}
