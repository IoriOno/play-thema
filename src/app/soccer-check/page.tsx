'use client';

import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { name: '認知・視野', emoji: '👁' },
  { name: 'ポジショニング', emoji: '📍' },
  { name: 'パス・コントロール', emoji: '⚽' },
  { name: 'ドリブル・1対1', emoji: '🏃' },
  { name: '守備', emoji: '🛡' },
  { name: 'メンタル・思考', emoji: '🧠' },
  { name: 'フィジカル', emoji: '💪' },
];

export default function SoccerCheckIntroPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-900 text-base flex-1">今伸ばしたいプレーテーマ</h1>
      </div>

      <div className="flex-1 px-5 py-7">
        {/* Hero icon */}
        <div className="text-center mb-7">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' }}
          >
            <span className="text-4xl">⚽</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-3">
            今伸ばしたいプレーテーマを<br />確認しましょう
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
            気になる場面を選ぶと、「なぜ起こるのか」「どんな声がけができるか」「明日から何を意識すればよいか」がわかります。
          </p>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-xs text-amber-700 leading-relaxed">
          このチェックは、子どもの欠点を探すものではありません。今伸ばしたいプレーテーマを整理し、家庭での声がけや関わり方を考えるためのものです。
        </div>

        {/* Categories */}
        <div className="mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            チェックするカテゴリ
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center gap-2.5 bg-gray-50 rounded-2xl px-4 py-3"
              >
                <span className="text-base">{cat.emoji}</span>
                <span className="text-xs font-medium text-gray-700">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push('/soccer-check/quiz')}
          className="w-full text-white font-bold py-4 px-6 rounded-2xl text-base shadow-lg transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}
        >
          チェックをはじめる →
        </button>
      </div>
    </div>
  );
}
