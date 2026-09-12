/**
 * Idle motion, emitted as a `<style>` block scoped by the instance id so many
 * avatars can share a page without their keyframes colliding.
 *
 * Both animations move the eyes and leave the blob still. Eyes are the part
 * that reads as alive at avatar sizes; translating or scaling the whole shape
 * at 24px just smears it. That also means motion belongs to the `organic`
 * variant alone — the grids have no eyes to move.
 */
import type { Animation } from './types.js';

/** Class applied to the group wrapping the pair of eyes. */
export const eyeClass = (uid: string): string => `${uid}e`;

/** Whether this animation needs the eyes wrapped in their own group. */
export function isEyeAnimation(animation: Animation): boolean {
  return animation === 'blink' || animation === 'dart';
}

export function animationCss(animation: Animation, uid: string): string {
  if (!isEyeAnimation(animation)) return '';

  const eyes = `.${eyeClass(uid)}`;
  // fill-box pivots on the eyes' own bounding box, so a squash or a shift
  // happens in place instead of swinging around the middle of the viewBox.
  const origin = 'transform-origin:50% 50%;transform-box:fill-box;';
  let css = '';

  if (animation === 'blink') {
    // Long open, brief close: a blink is ~150ms in a ~4s cycle, and anything
    // slower reads as a wink or a doze.
    css =
      `${eyes}{${origin}animation:${uid}b 4.4s ease-in-out infinite}` +
      `@keyframes ${uid}b{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(0.08)}}`;
  } else {
    css =
      `${eyes}{${origin}animation:${uid}d 5.2s ease-in-out infinite}` +
      `@keyframes ${uid}d{0%,62%,100%{transform:translateX(0)}` +
      `72%{transform:translateX(1.6px)}86%{transform:translateX(-1.6px)}}`;
  }

  return css + `@media(prefers-reduced-motion:reduce){${eyes}{animation:none}}`;
}
