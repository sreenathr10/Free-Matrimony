import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Free Matrimony · Verified Malayali matrimony',
    template: '%s · Free Matrimony',
  },
  description:
    'Every profile verified. No sales calls. The modern matrimony app for Malayali families around the world.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fffbf8' },
    { media: '(prefers-color-scheme: dark)', color: '#120c0e' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
