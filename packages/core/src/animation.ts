/**
 * Idle motion, emitted as a `<style>` block scoped by the instance id so many
 * avatars can share a page without their keyframes colliding.
 *
 * `pulse` and `spin` drive one wrapper group; `morph` animates each shape layer
 * with a staggered delay, which is what makes the blobs look like they breathe.
 */
import type { Animation } from './types.js';

/** Class applied to the group wrapping every shape (pulse / spin). */
export const rootClass = (uid: string): string => `${uid}r`;
/** Class applied to each individual layer (morph). */
export const layerClass = (uid: string): string => `${uid}s`;

export function isPerLayer(animation: Animation): boolean {
  return animation === 'morph';
}

export function animationCss(animation: Animation, uid: string): string {
  if (animation === 'none') return '';

  const root = `.${rootClass(uid)}`;
  const layer = `.${layerClass(uid)}`;
  const origin = 'transform-origin:50% 50%;transform-box:view-box;';
  let css = '';

  if (animation === 'pulse') {
    css =
      `${root}{${origin}animation:${uid}p 3.2s ease-in-out infinite}` +
      `@keyframes ${uid}p{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}`;
  } else if (animation === 'spin') {
    css =
      `${root}{${origin}animation:${uid}n 22s linear infinite}` +
      `@keyframes ${uid}n{from{transform:rotate(0)}to{transform:rotate(360deg)}}`;
  } else {
    css =
      `${layer}{${origin}animation:${uid}m 7s ease-in-out infinite}` +
      `@keyframes ${uid}m{` +
      '0%,100%{transform:translate(0,0) scale(1)}' +
      '33%{transform:translate(2px,-2.5px) scale(1.06)}' +
      '66%{transform:translate(-2.5px,2px) scale(0.95)}}';
  }

  const target = animation === 'morph' ? layer : root;
  return css + `@media(prefers-reduced-motion:reduce){${target}{animation:none}}`;
}
