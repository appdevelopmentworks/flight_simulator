import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebFlight Simulator Pro',
  description: 'ブラウザで動作する高品質なフライトシミュレーター',
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
