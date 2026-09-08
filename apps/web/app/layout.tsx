import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Morphatar — deterministic algorithmic avatars',
  description:
    'Zero-dependency, deterministic avatar generator. One seed in, the same SVG out — organic blobs, Bauhaus grids or mirrored identicons.',
  metadataBase: new URL('https://morphatar.dev'),
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
