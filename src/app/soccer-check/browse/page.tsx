'use client';

import { Suspense, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { soccerIssues, ISSUE_CATEGORIES, CATEGORY_META } from '@/data/soccerIssues';
import { SoccerIssue } from '@/types/soccerCheck';
import { trackCategorySelect, trackIssueExpand } from '@/lib/analytics';

function isEmpty(value: string | string[]): boolean {
  if (typeof value === 'string') return value.trim() === '';
  return value.every((v) => v.trim() === '');
}

const CAUSE_LABELS: Record<string, string> = {
  cognition: '認知',
  technique: '技術',
  bodyControl: '身体操作',
  interpersonal: '対人',
};

const ISSUE_IMAGES: Record<string, { src: string; alt: string }> = {
  cognition_01: {
    src: '/images/issues/cognition-01-ball-watching.png',
    alt: 'ボールだけを見て、背後の相手やフリーの味方に気づいていない選手',
  },
  cognition_02: {
    src: '/images/issues/cognition-02-stop-then-think.png',
    alt: 'ボールを足元に止めて考えている間に、相手選手が近づいている場面',
  },
  cognition_03: {
    src: '/images/issues/cognition-03-ball-and-opponent.png',
    alt: 'ボールを持つ相手に集中し、背後へ走る別の相手に気づいていない守備選手',
  },
  cognition_04: {
    src: '/images/issues/cognition-04-surroundings.png',
    alt: '近くの選手だけを見て、遠くの味方や空いた場所に気づいていない選手',
  },
  cognition_05: {
    src: '/images/issues/cognition-05-slow-decision.png',
    alt: 'ドリブルしながら判断に迷い、相手に囲まれかけている選手',
  },
  cognition_06: {
    src: '/images/issues/cognition-06-prediction.png',
    alt: 'こぼれ球を予測して動く相手より反応が一歩遅れている選手',
  },
  cognition_07: {
    src: '/images/issues/cognition-07-pass-lanes.png',
    alt: '味方へのパスコースを見つけられず相手の前で迷っている選手',
  },
  cognition_08: {
    src: '/images/issues/cognition-08-open-space.png',
    alt: '選手が集まる狭い場所だけを見て、反対側の広いスペースに気づいていない場面',
  },
  support_01: {
    src: '/images/issues/support-01-crowding.png',
    alt: '味方がボールの近くに集まり、周囲の広いスペースを使えていない場面',
  },
  support_02: {
    src: '/images/issues/support-02-stop-after-pass.png',
    alt: 'パスを出した後にその場で止まり、次のサポートへ動けていない選手',
  },
  support_03: {
    src: '/images/issues/support-03-hidden-pass-lane.png',
    alt: '相手の背後に重なり、ボールを持つ味方から見えない位置にいる選手',
  },
  support_04: {
    src: '/images/issues/support-04-late-support.png',
    alt: '相手に囲まれかけた味方へのサポートに遅れて走り出す選手たち',
  },
  support_05: {
    src: '/images/issues/support-05-positioning.png',
    alt: '味方を助けられる立ち位置を見つけられず中途半端な場所で迷う選手',
  },
  support_06: {
    src: '/images/issues/support-06-no-width.png',
    alt: '選手が中央に集まり、両サイドの広いスペースを使えていない場面',
  },
  support_07: {
    src: '/images/issues/support-07-no-depth.png',
    alt: '味方が同じ高さに並び、相手の背後へ走る選手がいない場面',
  },
  support_08: {
    src: '/images/issues/support-08-too-close-ball.png',
    alt: '味方がボールへ近づき過ぎて互いのプレーする場所を狭くしている場面',
  },
  pass_01: {
    src: '/images/issues/pass-01-inaccurate-pass.png',
    alt: '走る味方からずれた弱いパスに相手が先に近づいている場面',
  },
  pass_02: {
    src: '/images/issues/pass-02-heavy-touch.png',
    alt: 'ファーストタッチが大きくなり、離れたボールを相手に狙われている選手',
  },
  pass_03: {
    src: '/images/issues/pass-03-cannot-face-forward.png',
    alt: '攻める方向に背を向けたままボールを受け、相手に寄せられている選手',
  },
  pass_04: {
    src: '/images/issues/pass-04-dominant-foot.png',
    alt: '利き足だけでボールを扱おうとして窮屈な姿勢になっている選手',
  },
  dribble_01: {
    src: '/images/issues/dribble-01-straight-into-opponent.png',
    alt: '空いている方向を見ず、正面の相手へ一直線にドリブルする選手',
  },
  dribble_02: {
    src: '/images/issues/dribble-02-no-speed-change.png',
    alt: '一定の速さでドリブルし、相手に余裕を持ってついてこられている選手',
  },
  dribble_03: {
    src: '/images/issues/dribble-03-timing.png',
    alt: '相手が整った不利なタイミングでドリブルを仕掛けようとしている選手',
  },
  dribble_04: {
    src: '/images/issues/dribble-04-shielding.png',
    alt: 'ボールを相手側へ置き、身体で守れず奪われかけている選手',
  },
  defense_01: {
    src: '/images/issues/defense-01-diving-in.png',
    alt: 'ボールへ大きく飛び込み、相手に横へかわされかけている守備選手',
  },
  defense_02: {
    src: '/images/issues/defense-02-reaching-foot.png',
    alt: '身体を寄せずに足だけを伸ばし、相手に抜かれかけている守備選手',
  },
  defense_03: {
    src: '/images/issues/defense-03-lost-mark.png',
    alt: 'ボールを見続け、背後からゴール前へ走る相手のマークを外している守備選手',
  },
  defense_04: {
    src: '/images/issues/defense-04-transition.png',
    alt: 'ボールを失った直後に足が止まり、走り出した相手への対応が遅れている選手',
  },
  mental_01: {
    src: '/images/issues/mental-01-panic-clearance.png',
    alt: '周囲に時間と味方がいるのに、慌てて前方へボールを蹴り出す選手',
  },
  mental_02: {
    src: '/images/issues/mental-02-waiting-instructions.png',
    alt: '自分でプレーを選べず、タッチラインのコーチの指示を待っている選手',
  },
  mental_03: {
    src: '/images/issues/mental-03-after-mistake.png',
    alt: 'ミスの後に下を向いて止まり、次の守備への反応が遅れている選手',
  },
  mental_04: {
    src: '/images/issues/mental-04-hesitant-challenge.png',
    alt: 'フリーでパスを受けられるのに、不安からボールを要求できずにいる選手',
  },
  physical_01: {
    src: '/images/issues/physical-01-late-start.png',
    alt: '高い姿勢で止まり、こぼれ球への最初の一歩が相手より遅れている選手',
  },
  physical_02: {
    src: '/images/issues/physical-02-balance.png',
    alt: '相手との軽い接触で身体が傾き、バランスを崩しかけている選手',
  },
  physical_03: {
    src: '/images/issues/physical-03-direction-change.png',
    alt: '相手の切り返しに重心を残し、方向転換が遅れている守備選手',
  },
  physical_04: {
    src: '/images/issues/physical-04-body-orientation.png',
    alt: '足と腰の向きを整えられず、窮屈な身体の向きでボールを受けている選手',
  },
};

export default function SoccerCheckBrowsePage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center text-gray-400 text-sm">読み込み中...</div>}>
      <BrowseContent />
    </Suspense>
  );
}

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = useMemo(() => {
    const param = searchParams.get('category');
    return param && (ISSUE_CATEGORIES as readonly string[]).includes(param)
      ? param
      : ISSUE_CATEGORIES[0];
  }, [searchParams]);

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categoryIssues = useMemo(
    () => soccerIssues.filter((i) => i.category === activeCategory),
    [activeCategory]
  );

  const selectCategory = (cat: string) => {
    trackCategorySelect(cat);
    setActiveCategory(cat);
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <button
            onClick={() => router.push('/soccer-check')}
            className="flex items-center justify-center text-gray-400"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-gray-900 text-base flex-1">プレーテーマ辞典</h1>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {ISSUE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => selectCategory(cat)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full font-medium transition-all border"
                style={{
                  minHeight: '36px',
                  backgroundColor: isActive ? '#16A34A' : '#F8FAFC',
                  borderColor: isActive ? '#16A34A' : '#E2E8F0',
                  color: isActive ? 'white' : '#64748B',
                }}
              >
                <span className="text-sm">{CATEGORY_META[cat].emoji}</span>
                {CATEGORY_META[cat].short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category heading */}
      <div className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{CATEGORY_META[activeCategory as keyof typeof CATEGORY_META].emoji}</span>
          <div>
            <h2 className="font-black text-gray-900 text-base leading-tight">{activeCategory}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              気になる項目をタップすると詳しい内容が見られます
            </p>
          </div>
        </div>
      </div>

      {/* Issues (accordion) */}
      <div className="flex-1 px-4 py-4">
        <div className="space-y-2.5">
          {categoryIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              isExpanded={expandedId === issue.id}
              onToggle={() =>
                setExpandedId((prev) => {
                  const next = prev === issue.id ? null : issue.id;
                  // 展開したときのみ計測（閉じる操作は数えない）
                  if (next) trackIssueExpand(issue.id, issue.category);
                  return next;
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function IssueCard({
  issue,
  isExpanded,
  onToggle,
}: {
  issue: SoccerIssue;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const causesEntries = Object.entries(issue.causes).filter(([, v]) => v.trim() !== '');
  const showCommonScene = !isEmpty(issue.commonScene);
  const showCauses = causesEntries.length > 0;
  const showVoicePrompts = !isEmpty(issue.voicePrompts);
  const showAwareness = !isEmpty(issue.awareness);
  const hasAnyDetail = showCommonScene || showCauses || showVoicePrompts || showAwareness;
  const issueImage = ISSUE_IMAGES[issue.id];

  return (
    <div
      className="bg-white rounded-3xl shadow-sm overflow-hidden"
      style={{ border: `1.5px solid ${isExpanded ? '#86EFAC' : '#E2E8F0'}` }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-5 flex items-center gap-3.5"
        style={{ minHeight: '60px', paddingTop: '16px', paddingBottom: '16px' }}
      >
        <p className="flex-1 text-sm font-bold text-gray-900 leading-snug">
          {issue.displayTitle}
        </p>
        {hasAnyDetail && (
          <span className="text-gray-300 flex-shrink-0">
            <svg
              width="16" height="16"
              fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2.5}
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        )}
      </button>

      {isExpanded && hasAnyDetail && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5 bg-gray-50/50">
          {issueImage && (
            <figure className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
              <Image
                src={issueImage.src}
                alt={issueImage.alt}
                width={1200}
                height={675}
                className="h-auto w-full"
                priority
              />
            </figure>
          )}

          {showCommonScene && (
            <div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                よくある場面
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">{issue.commonScene}</p>
            </div>
          )}

          {showCauses && (
            <div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                なぜ起こるのか
              </h4>
              <div className="space-y-2">
                {causesEntries.map(([key, value]) => (
                  <div key={key} className="bg-white rounded-2xl p-3.5 border border-gray-100">
                    <span className="text-xs font-bold text-green-700">
                      {CAUSE_LABELS[key] ?? key}
                    </span>
                    <p className="text-xs text-gray-600 leading-relaxed mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showVoicePrompts && (
            <div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                明日できる声がけ
              </h4>
              <div className="space-y-2">
                {issue.voicePrompts.filter((p) => p.trim() !== '').map((prompt, i) => (
                  <div key={i} className="bg-blue-50 rounded-2xl px-4 py-3 border border-blue-100">
                    <p className="text-sm text-blue-800 font-medium">{prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAwareness && (
            <div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                明日からできる意識付け
              </h4>
              <div className="bg-green-50 rounded-2xl px-4 py-3.5 border border-green-200">
                <p className="text-sm text-green-800 font-medium leading-relaxed">
                  💡 {issue.awareness}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
