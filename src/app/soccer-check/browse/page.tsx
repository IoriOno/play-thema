'use client';

import { Suspense, useMemo, useState } from 'react';
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
