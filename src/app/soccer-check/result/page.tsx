'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSoccerCheck } from '@/lib/soccerCheckStorage';
import { soccerIssues } from '@/data/soccerIssues';
import { SoccerIssue } from '@/types/soccerCheck';

function isEmpty(value: string | string[] | Record<string, string>): boolean {
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.every((v) => v.trim() === '');
  return Object.values(value).every((v) => v.trim() === '');
}

const RANK_COLORS = ['#EA580C', '#CA8A04', '#64748B'];

export default function SoccerCheckResultPage() {
  const router = useRouter();
  const [{ result, initialExpandedId }] = useState(() => {
    const saved = loadSoccerCheck();
    return {
      result: saved,
      initialExpandedId:
        saved && saved.topIssues.length > 0 ? saved.topIssues[0].issueId : null,
    };
  });
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId);

  useEffect(() => {
    if (!result) router.replace('/soccer-check');
  }, [router, result]);

  const getIssueDetail = (issueId: string): SoccerIssue | undefined =>
    soccerIssues.find((i) => i.id === issueId);

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  const hasIssues = result.topIssues.length > 0;

  const CAUSE_LABELS: Record<string, string> = {
    cognition: '認知',
    technique: '技術',
    bodyControl: '身体操作',
    interpersonal: '対人',
  };

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-900 text-base">今伸ばしたいプレーテーマ</h1>
      </div>

      <div className="flex-1 px-4 py-6">
        {!hasIssues ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-5">🎉</div>
            <h2 className="font-black text-gray-900 text-xl mb-3">
              気になる場面が少ないようです
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              引き続き日々の練習と<br />声がけを続けていきましょう！
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-base font-black text-gray-900 mb-1">
                気になるプレーテーマ（{result.topIssues.length}件）
              </h2>
              <p className="text-xs text-gray-400">タップすると詳細を確認できます</p>
            </div>

            {result.topIssues.map((item, rank) => {
              const detail = getIssueDetail(item.issueId);
              const isExpanded = expandedId === item.issueId;
              const rankColor = RANK_COLORS[rank] ?? '#64748B';

              const causesEntries = detail
                ? Object.entries(detail.causes).filter(([, v]) => v.trim() !== '')
                : [];

              const showCommonScene = detail && !isEmpty(detail.commonScene);
              const showCauses = causesEntries.length > 0;
              const showVoicePrompts = detail && !isEmpty(detail.voicePrompts);
              const showAwareness = detail && !isEmpty(detail.awareness);
              const hasAnyDetail = showCommonScene || showCauses || showVoicePrompts || showAwareness;

              return (
                <div
                  key={item.issueId}
                  className="bg-white rounded-3xl shadow-sm mb-4 overflow-hidden"
                  style={{ border: '1.5px solid #E2E8F0' }}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.issueId)}
                    className="w-full text-left px-5"
                    style={{ minHeight: '64px', paddingTop: '16px', paddingBottom: '16px' }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                        style={{ backgroundColor: rankColor }}
                      >
                        {rank + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-xs font-bold"
                          style={{ color: '#16A34A' }}
                        >
                          {item.category}
                        </span>
                        <p className="text-sm font-bold text-gray-900 mt-0.5 leading-snug">
                          {item.displayTitle}
                        </p>
                      </div>
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
                    </div>
                  </button>

                  {isExpanded && detail && hasAnyDetail && (
                    <div className="border-t border-gray-100 px-5 py-5 space-y-5 bg-gray-50/50">
                      {showCommonScene && (
                        <div>
                          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            よくある場面
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">{detail.commonScene}</p>
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
                            {detail.voicePrompts.filter((p) => p.trim() !== '').map((prompt, i) => (
                              <div key={i} className="bg-blue-50 rounded-2xl px-4 py-3 border border-blue-100">
                                <p className="text-sm text-blue-800 font-medium">「{prompt}」</p>
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
                              💡 {detail.awareness}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isExpanded && !hasAnyDetail && (
                    <div className="border-t border-gray-100 px-5 py-4">
                      <p className="text-xs text-gray-400 text-center">詳細情報は準備中です</p>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-xs text-amber-700 leading-relaxed">
          このチェックは、子どもの欠点を探すものではありません。今伸ばしたいプレーテーマを整理し、家庭での声がけや関わり方を考えるためのものです。
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full text-gray-400 text-sm font-medium"
          style={{ minHeight: '44px' }}
        >
          最初からやり直す
        </button>
      </div>
    </div>
  );
}
