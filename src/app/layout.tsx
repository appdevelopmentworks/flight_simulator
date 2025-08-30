import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebFlight Simulator Pro',
  description: 'ブラウザで動作する高品質なフライトシミュレーター',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
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
