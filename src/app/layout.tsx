import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '今伸ばしたいプレーテーマ',
  description: '気になる場面を選ぶと、なぜ起こるのか・どんな声がけができるかがわかります',
  openGraph: {
    title: '今伸ばしたいプレーテーマ',
    description: '子どものサッカーで伸ばしたいテーマを整理するチェック',
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
