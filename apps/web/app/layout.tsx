import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Free Matrimony: verified Malayali matrimony',
  description: 'Every profile verified. No sales calls. Built for Malayali families around the world.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#cf2e4c' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
