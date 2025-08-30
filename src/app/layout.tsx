import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: 'WebFlight Simulator Pro',
  description: 'ブラウザで動作する高品質なフライトシミュレーター。Cessna 172、Boeing 737、F-16の3機種でリアルな飛行体験を楽しめます。',
  applicationName: 'WebFlight Simulator Pro',
  authors: [{ name: 'WebFlight Simulator Pro Development Team' }],
  generator: 'Next.js',
  keywords: ['flight simulator', 'aviation', 'web game', 'cessna', 'boeing', 'f16', 'フライトシミュレーター'],
  
  icons: {
    icon: [
      { url: '/FlightSimulatorPro.png', sizes: 'any', type: 'image/png' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/FlightSimulatorPro.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/FlightSimulatorPro.png',
      },
    ],
  },

  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: '/',
    title: 'WebFlight Simulator Pro',
    description: 'ブラウザで動作する高品質なフライトシミュレーター。Cessna 172、Boeing 737、F-16の3機種でリアルな飛行体験を楽しめます。',
    images: [
      {
        url: '/FlightSimulatorPro.png',
        width: 1200,
        height: 630,
        alt: 'WebFlight Simulator Pro - リアルなフライトシミュレーター',
      },
    ],
    siteName: 'WebFlight Simulator Pro',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'WebFlight Simulator Pro',
    description: 'ブラウザで動作する高品質なフライトシミュレーター',
    images: ['/FlightSimulatorPro.png'],
  },

  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
