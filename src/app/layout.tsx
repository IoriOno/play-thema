import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'プレーテーマ辞典',
  description: 'カテゴリから気になる項目を選ぶと、なぜ起こるのか・どんな声がけができるかがわかります',
  openGraph: {
    title: 'プレーテーマ辞典',
    description: '子どものサッカーで気になるプレーをカテゴリから調べられる辞典',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.className} bg-[#F8FAFC] min-h-screen`}>
        <div className="mx-auto max-w-lg min-h-screen flex flex-col bg-white shadow-sm">
          {children}
        </div>
      </body>
    </html>
  );
}
