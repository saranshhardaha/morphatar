import type { Config } from 'tailwindcss';

/**
 * Strictly monochrome: the only hues on the page come from the avatars
 * themselves. Everything else is black, white, and the neutral ramp between.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        surface: '#09090b',
        raised: '#111113',
        line: '#26262b',
        muted: '#71717a',
        soft: '#a1a1aa',
        chalk: '#fafafa',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 220ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
