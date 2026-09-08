'use client';

import { useEffect, useState } from 'react';

export interface CodeProp {
  name: string;
  /** Already-formatted literal, e.g. `"organic"` or `{7}`. */
  literal: string;
  kind: 'string' | 'expr';
}

function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return [
    copied,
    (text: string) => {
      void navigator.clipboard?.writeText(text).then(
        () => setCopied(true),
        () => setCopied(false),
      );
    },
  ];
}

/**
 * Monochrome "syntax highlighting": weight and neutral value carry the
 * structure instead of hue, so the code block stays part of the black-and-white
 * design while remaining readable.
 */
export function CodeBlock({ props }: { props: CodeProp[] }) {
  const [copied, copy] = useCopy();

  const source = [
    "import { Morphatar } from '@morphatar/react';",
    '',
    '<Morphatar',
    ...props.map((prop) => `  ${prop.name}=${prop.literal}`),
    '/>',
  ].join('\n');

  return (
    <div className="border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Usage</span>
        <button
          type="button"
          onClick={() => copy(source)}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-soft transition-colors hover:text-chalk"
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>

      <pre className="overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-relaxed">
        <code>
          <span className="text-muted">import </span>
          <span className="text-muted">{'{ '}</span>
          <span className="text-chalk">Morphatar</span>
          <span className="text-muted">{' } '}</span>
          <span className="text-muted">from </span>
          <span className="text-soft">&apos;@morphatar/react&apos;</span>
          <span className="text-muted">;</span>
          {'\n\n'}
          <span className="text-muted">{'<'}</span>
          <span className="font-semibold text-chalk">Morphatar</span>
          {props.map((prop) => (
            <span key={prop.name}>
              {'\n  '}
              <span className="text-soft">{prop.name}</span>
              <span className="text-muted">=</span>
              <span className={prop.kind === 'string' ? 'text-chalk' : 'text-muted'}>
                {prop.kind === 'string' ? (
                  prop.literal
                ) : (
                  <>
                    {'{'}
                    <span className="text-chalk">{prop.literal.slice(1, -1)}</span>
                    {'}'}
                  </>
                )}
              </span>
            </span>
          ))}
          {'\n'}
          <span className="text-muted">{'/>'}</span>
        </code>
      </pre>
    </div>
  );
}
