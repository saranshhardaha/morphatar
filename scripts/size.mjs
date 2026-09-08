/** Reports the shipped size of @morphatar/core: raw, minified-ish and gzipped. */
import { gzipSync } from 'node:zlib';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../packages/core/dist/', import.meta.url).pathname;

let source = '';
for (const file of readdirSync(dist).sort()) {
  if (file.endsWith('.js')) source += readFileSync(join(dist, file), 'utf8');
}

if (!source) {
  console.error('No build output found. Run `pnpm build` first.');
  process.exit(1);
}

// Strip comments and indentation — an approximation of what a bundler ships.
const stripped = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/^[ \t]+/gm, '')
  .replace(/\n{2,}/g, '\n');

const kb = (bytes) => (bytes / 1024).toFixed(2) + ' KB';
const gzipped = gzipSync(Buffer.from(stripped, 'utf8')).length;

console.log('@morphatar/core');
console.log('  raw       ', kb(Buffer.byteLength(source)));
console.log('  stripped  ', kb(Buffer.byteLength(stripped)));
console.log('  gzipped   ', kb(gzipped));

const BUDGET = 8 * 1024;
if (gzipped > BUDGET) {
  console.error(`\nOver budget: ${kb(gzipped)} gzipped exceeds ${kb(BUDGET)}.`);
  process.exit(1);
}
console.log(`\nWithin the ${kb(BUDGET)} budget.`);
