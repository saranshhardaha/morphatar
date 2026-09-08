/**
 * Deterministic randomness.
 *
 * `Math.random()` is unusable here: the whole contract of Morphatar is that a
 * seed maps to exactly one avatar, on every machine, forever. So we hash the
 * seed with FNV-1a and drive an sfc32 counter with it.
 */

/** A stream of deterministic floats in `[0, 1)`. */
export type Rand = () => number;

/** FNV-1a, 32-bit. Returns an unsigned integer. */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** splitmix32 — expands one 32-bit hash into a well-distributed state vector. */
function splitmix32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x9e3779b9) | 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    return ((z ^ (z >>> 15)) >>> 0);
  };
}

/** sfc32 (Small Fast Counting) — 128 bits of state, fast, good distribution. */
export function sfc32(a: number, b: number, c: number, d: number): Rand {
  let s0 = a >>> 0;
  let s1 = b >>> 0;
  let s2 = c >>> 0;
  let s3 = d >>> 0;
  return () => {
    let t = (s0 + s1) | 0;
    s0 = s1 ^ (s1 >>> 9);
    s1 = (s2 + (s2 << 3)) | 0;
    s2 = (s2 << 21) | (s2 >>> 11);
    s3 = (s3 + 1) | 0;
    t = (t + s3) | 0;
    s2 = (s2 + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

/** Hash a seed string and return the PRNG stream every generator draws from. */
export function createRandom(seed: string): Rand {
  const next = splitmix32(fnv1a(seed));
  const rand = sfc32(next(), next(), next(), next());
  // sfc32 needs a short warm-up before its output is well mixed.
  for (let i = 0; i < 12; i++) rand();
  return rand;
}

/** Integer in `[min, max]`, inclusive. */
export function randInt(rand: Rand, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

/** Deterministically pick one item. */
export function pick<T>(rand: Rand, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)] as T;
}

/** Fisher–Yates, driven by `rand`. Returns a new array. */
export function shuffle<T>(rand: Rand, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}
