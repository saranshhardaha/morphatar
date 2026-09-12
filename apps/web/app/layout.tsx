import type { Metadata } from 'next';
import './globals.css';

/**
 * Absolute base for OG and canonical URLs.
 *
 * Vercel exposes the project's production domain at build time, and each
 * preview its own host, so metadata resolves correctly in both without naming
 * a domain here. A custom domain later is a one-line override via
 * NEXT_PUBLIC_SITE_URL.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

export const metadata: Metadata = {
  title: 'Morphatar — deterministic algorithmic avatars',
  description:
    'Zero-dependency, deterministic avatar generator. One seed in, the same SVG out — organic blobs, Bauhaus grids or mirrored identicons.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Morphatar',
    description: 'Deterministic algorithmic avatars in under 5 KB.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink font-sans">{children}</body>
    </html>
  );
}
