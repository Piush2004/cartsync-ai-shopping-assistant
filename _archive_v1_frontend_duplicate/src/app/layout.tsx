import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'CartSyncAI - AI Fashion Stylist',
  description:
    'Your intelligent AI-powered fashion assistant. Get personalized style recommendations, virtual try-on, and smart sizing powered by multi-agent AI technology.',
  keywords: ['AI fashion', 'style assistant', 'virtual try-on', 'smart sizing', 'AI shopping'],
  authors: [{ name: 'CartSyncAI' }],
  openGraph: {
    title: 'CartSyncAI - AI Fashion Stylist',
    description: 'Your intelligent AI-powered fashion assistant.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-overlay">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
