import { morphatar } from '@morphatar/core';
import type { Animation, Mask, MorphatarOptions, Variant } from '@morphatar/core';

/**
 * GET /api/avatar?seed=ada&variant=pixel&size=64
 *
 * A hosted avatar for places that cannot install a package: an `<img src>`, a
 * Markdown file, a no-build prototype. The response is a pure function of the
 * query string, so the CDN can keep every URL until the next deploy.
 */

const VARIANTS: readonly Variant[] = ['organic', 'geometric', 'pixel'];
const MASKS: readonly Mask[] = ['circle', 'squircle', 'hexagon', 'none'];
const ANIMATIONS: readonly Animation[] = ['none', 'blink', 'dart'];

const MAX_SEED = 256;
const MAX_TITLE = 128;
const MAX_COLOR = 64;
const MAX_COLORS = 8;
const MIN_SIZE = 16;
const MAX_SIZE = 1024;
const DEFAULT_SIZE = 256;

class BadRequest extends Error {}

function oneOf<T extends string>(params: URLSearchParams, name: string, allowed: readonly T[]): T | undefined {
  const value = params.get(name);
  if (value === null) return undefined;
  if (!(allowed as readonly string[]).includes(value)) {
    throw new BadRequest(`${name} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

function integer(params: URLSearchParams, name: string, min: number, max: number): number | undefined {
  const value = params.get(name);
  if (value === null) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new BadRequest(`${name} must be an integer from ${min} to ${max}`);
  }
  return parsed;
}

function boolean(params: URLSearchParams, name: string): boolean | undefined {
  const value = params.get(name);
  if (value === null) return undefined;
  if (value === '' || value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  throw new BadRequest(`${name} must be true or false`);
}

/** `#` has to be URL-encoded, so bare hex (`e4572e`) is accepted and prefixed. */
function color(value: string, name: string): string {
  const trimmed = value.trim();
  if (trimmed.length > MAX_COLOR) throw new BadRequest(`${name} is too long`);
  return /^(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed) ? `#${trimmed}` : trimmed;
}

function parse(params: URLSearchParams): MorphatarOptions {
  const seed = params.get('seed');
  if (!seed) throw new BadRequest('seed is required');
  if (seed.length > MAX_SEED) throw new BadRequest(`seed must be at most ${MAX_SEED} characters`);

  const title = params.get('title') ?? undefined;
  if (title !== undefined && title.length > MAX_TITLE) {
    throw new BadRequest(`title must be at most ${MAX_TITLE} characters`);
  }

  const background = params.get('background');

  // Split on commas outside parentheses, so `rgb(1, 2, 3)` stays one colour.
  const colorsParam = params.get('colors');
  const colors = colorsParam
    ?.split(/,(?![^(]*\))/)
    .filter((entry) => entry.trim())
    .map((entry) => color(entry, 'colors'));
  if (colors && colors.length > MAX_COLORS) throw new BadRequest(`colors takes at most ${MAX_COLORS} entries`);

  return {
    seed,
    variant: oneOf(params, 'variant', VARIANTS),
    mask: oneOf(params, 'mask', MASKS),
    animation: oneOf(params, 'animation', ANIMATIONS),
    complexity: integer(params, 'complexity', 1, 10),
    multicolor: boolean(params, 'multicolor'),
    background: background === null ? undefined : color(background, 'background'),
    colors: colors?.length ? colors : undefined,
    size: integer(params, 'size', MIN_SIZE, MAX_SIZE) ?? DEFAULT_SIZE,
    title,
  };
}

export function GET(request: Request) {
  let options: MorphatarOptions;
  try {
    options = parse(new URL(request.url).searchParams);
  } catch (error) {
    if (!(error instanceof BadRequest)) throw error;
    return new Response(error.message + '\n', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  return new Response(morphatar(options), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Browsers re-check daily; the CDN holds each URL until a deploy purges it,
      // which is the only time output for the same query can change.
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000',
      'Access-Control-Allow-Origin': '*',
      // Opened directly, an SVG is a document. It never needs scripts or fetches.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
