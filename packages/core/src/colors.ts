/**
 * Palette derivation.
 *
 * Two modes: order a caller-supplied array, or invent a harmonic palette from
 * the seed. In both cases foregrounds are ordered so the highest-contrast
 * colors come first, and generated palettes are pushed to at least the WCAG AA
 * 4.5:1 ratio against the contrast anchor.
 *
 * The anchor is the caller's `background` when they pass one, and a derived
 * tone otherwise. It is what foregrounds and eyes are measured against — it is
 * not necessarily painted, since an avatar may render on transparency.
 */
import type { Rand } from './prng.js';
import { shuffle } from './prng.js';
import { escapeXml } from './svg.js';
import type { Palette } from './types.js';

export const MIN_CONTRAST = 4.5;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX_DIGITS = '0123456789abcdef';

function toHexByte(value: number): string {
  const v = Math.max(0, Math.min(255, Math.round(value)));
  return HEX_DIGITS[(v >> 4) & 0xf] + HEX_DIGITS[v & 0xf];
}

/** `h` in degrees, `s`/`l` in `[0, 1]`. */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) { r = c; g = x; }
  else if (hue < 120) { r = x; g = c; }
  else if (hue < 180) { g = c; b = x; }
  else if (hue < 240) { g = x; b = c; }
  else if (hue < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return '#' + toHexByte(r) + toHexByte(g) + toHexByte(b);
}

/** Accepts `#rgb`, `#rrggbb[aa]`, `rgb()` and `hsl()`. Unparseable input reads as black. */
export function parseColor(input: string): Rgb {
  const value = input.trim().toLowerCase();

  if (value.charCodeAt(0) === 35 /* # */) {
    const hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r: r || 0, g: g || 0, b: b || 0 };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16) || 0,
        g: parseInt(hex.slice(2, 4), 16) || 0,
        b: parseInt(hex.slice(4, 6), 16) || 0,
      };
    }
    return { r: 0, g: 0, b: 0 };
  }

  const open = value.indexOf('(');
  if (open > 0 && value.endsWith(')')) {
    const fn = value.slice(0, open).replace(/a$/, '');
    const parts = value
      .slice(open + 1, -1)
      .split(/[\s,/]+/)
      .filter(Boolean);
    const nums = parts.map((p) => parseFloat(p));
    if (fn === 'rgb') {
      return { r: nums[0] || 0, g: nums[1] || 0, b: nums[2] || 0 };
    }
    if (fn === 'hsl') {
      const s = (nums[1] || 0) / 100;
      const l = (nums[2] || 0) / 100;
      return hslToRgb(nums[0] || 0, s, l);
    }
  }

  return { r: 0, g: 0, b: 0 };
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance. */
export function luminance(color: string): number {
  const { r, g, b } = parseColor(color);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG contrast ratio between two colors, `1`–`21`. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

/** Lightness each foreground aims for, so layered shapes stay tellable apart. */
const TONE_TARGETS_ON_DARK = [0.55, 0.7, 0.85];
const TONE_TARGETS_ON_LIGHT = [0.5, 0.37, 0.24];

/**
 * Start at the requested lightness and walk *away* from the background until
 * the pair clears `MIN_CONTRAST`, falling back to the pure extreme.
 *
 * Starting from a per-layer target rather than always from the extreme is what
 * keeps a palette's three foregrounds visually distinct — otherwise every
 * generated color collapses onto the first lightness that happens to pass.
 */
function contrastingTone(
  hue: number,
  saturation: number,
  background: string,
  preferred: number,
): string {
  const backgroundIsDark = luminance(background) < 0.5;
  const direction = backgroundIsDark ? 1 : -1;
  let lightness = preferred;
  for (let step = 0; step <= 40; step++) {
    const candidate = hslToHex(hue, saturation, lightness);
    if (contrastRatio(candidate, background) >= MIN_CONTRAST) return candidate;
    lightness += direction * 0.025;
    if (lightness > 0.98 || lightness < 0.02) break;
  }
  return backgroundIsDark ? '#ffffff' : '#000000';
}

/** Black or white — whichever contrasts better with the *worst* of the palette. */
function anchorFor(colors: string[]): string {
  const worstAgainst = (anchor: string) =>
    colors.reduce((worst, color) => Math.min(worst, contrastRatio(color, anchor)), Infinity);
  return worstAgainst('#ffffff') >= worstAgainst('#000000') ? '#ffffff' : '#000000';
}

export interface PaletteOptions {
  /** Caller-supplied shape colors. Every entry becomes a foreground. */
  colors?: string[];
  /**
   * Caller-supplied contrast anchor. `null` or omitted derives one — either
   * black/white against a custom palette, or a generated tone.
   */
  background?: string | null;
}

/**
 * Resolve the palette for one avatar.
 *
 * Called before any shape generator so that changing `variant` or `complexity`
 * keeps a seed's colors stable — only the geometry moves. The generated
 * background is computed even when the caller overrides it, so the PRNG stream
 * stays aligned and passing `background` never reshuffles the shapes.
 */
export function createPalette(rand: Rand, options: PaletteOptions = {}): Palette {
  const given = options.background ?? null;
  // Caller-supplied strings land in attribute values; escape them at intake.
  const provided = options.colors
    ?.filter((color) => typeof color === 'string' && color.trim().length > 0)
    .map((color) => escapeXml(color.trim()));

  if (provided && provided.length > 0) {
    const background = given ?? anchorFor(provided);
    const foreground = shuffle(rand, provided).sort(
      (a, b) => contrastRatio(b, background) - contrastRatio(a, background),
    );
    return { background, foreground };
  }

  const baseHue = rand() * 360;
  const shift = rand() < 0.5 ? 30 : 120;
  const generatedIsDark = rand() < 0.5;
  const backgroundSaturation = 0.16 + rand() * 0.34;
  const backgroundLightness = generatedIsDark ? 0.07 + rand() * 0.07 : 0.9 + rand() * 0.07;
  const background = given ?? hslToHex(baseHue, backgroundSaturation, backgroundLightness);

  const targets = luminance(background) < 0.5 ? TONE_TARGETS_ON_DARK : TONE_TARGETS_ON_LIGHT;
  const foreground: string[] = [];
  for (let i = 0; i < targets.length; i++) {
    const saturation = 0.5 + rand() * 0.45;
    foreground.push(
      contrastingTone(baseHue + shift * (i + 1), saturation, background, targets[i]),
    );
  }

  return { background, foreground };
}
