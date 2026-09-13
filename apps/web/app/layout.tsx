import type { Metadata } from 'next';

import { siteUrl } from './site-url';
import './globals.css';

export const metadata: Metadata = {
  title: 'Morphatar — deterministic algorithmic avatars',
  description:
    'Zero-dependency, deterministic avatar generator. One seed in, the same SVG out — organic blobs, Bauhaus grids or mirrored identicons.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Morphatar',
    description: 'Deterministic algorithmic avatars in about 6 KB, with zero dependencies.',
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
