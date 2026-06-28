'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { soccerIssues, ISSUE_CATEGORIES } from '@/data/soccerIssues';
import { saveSoccerCheck } from '@/lib/soccerCheckStorage';
import { SoccerIssueAnswers } from '@/types/soccerCheck';

export default function SoccerCheckQuizPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>(ISSUE_CATEGORIES[0]);

  const categoryIssues = soccerIssues.filter((i) => i.category === activeCategory);
  const categoryIndex = ISSUE_CATEGORIES.indexOf(activeCategory as typeof ISSUE_CATEGORIES[number]);
  const isLastCategory = categoryIndex === ISSUE_CATEGORIES.length - 1;

  const toggle = (issueId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) { next.delete(issueId); } else { next.add(issueId); }
      return next;
    });
  };

  const handleNext = () => {
    if (!isLastCategory) {
      setActiveCategory(ISSUE_CATEGORIES[categoryIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (categoryIndex > 0) {
      setActiveCategory(ISSUE_CATEGORIES[categoryIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/soccer-check');
    }
  };

  const handleSubmit = () => {
    const answers: SoccerIssueAnswers = {};
    selected.forEach((id) => { answers[id] = 2; });
    const topIssues = soccerIssues
      .filter((issue) => selected.has(issue.id))
      .slice(0, 3)
      .map((issue) => ({
        issueId: issue.id,
        category: issue.category,
        displayTitle: issue.displayTitle,
        score: 2 as const,
      }));
    saveSoccerCheck({ topIssues, allAnswers: answers, createdAt: new Date().toISOString() });
    router.push('/soccer-check/result');
  };

  const selectedInCategory = categoryIssues.filter((i) => selected.has(i.id)).length;
  const totalSelected = selected.size;

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <button
            onClick={handleBack}
            className="flex items-center justify-center text-gray-400"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1">
            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${((categoryIndex + 1) / ISSUE_CATEGORIES.length) * 100}%`,
                  background: 'linear-gradient(90deg, #16A34A, #22C55E)',
                }}
              />
            </div>
          </div>

          <span className="text-xs font-bold text-gray-400 flex-shrink-0">
            {categoryIndex + 1}/{ISSUE_CATEGORIES.length}
          </span>

          {totalSelected > 0 && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: '#DCFCE7', color: '#15803D' }}
            >
              {totalSelected}件
            </span>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 hide-scrollbar">
          {ISSUE_CATEGORIES.map((cat, i) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 text-xs px-3 py-2 rounded-full font-medium transition-all"
              style={{
                minHeight: '36px',
                backgroundColor: activeCategory === cat
                  ? '#16A34A'
                  : i < categoryIndex
                  ? '#DCFCE7'
                  : '#F1F5F9',
                color: activeCategory === cat
                  ? 'white'
                  : i < categoryIndex
                  ? '#15803D'
                  : '#94A3B8',
              }}
            >
              {cat.length > 7 ? cat.slice(0, 6) + '…' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Category heading */}
      <div className="bg-white border-b border-gray-100 px-5 py-4">
        <h2 className="font-black text-gray-900 text-base">{activeCategory}</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          気になる場面をタップして選んでください
          {selectedInCategory > 0 && (
            <span className="ml-2 font-bold text-green-600">{selectedInCategory}件選択中</span>
          )}
        </p>
      </div>

      {/* Issues */}
      <div className="flex-1 px-4 py-3">
        <div className="space-y-2.5">
          {categoryIssues.map((issue) => {
            const isSelected = selected.has(issue.id);
            return (
              <button
                key={issue.id}
                onClick={() => toggle(issue.id)}
                className="w-full text-left flex items-center gap-3.5 px-4 rounded-2xl transition-all active:scale-[0.98]"
                style={{
                  minHeight: '60px',
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  backgroundColor: isSelected ? '#F0FDF4' : 'white',
                  border: `2px solid ${isSelected ? '#86EFAC' : '#F1F5F9'}`,
                  boxShadow: isSelected ? '0 0 0 3px rgba(22,163,74,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Check circle */}
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: isSelected ? '#16A34A' : 'white',
                    borderColor: isSelected ? '#16A34A' : '#CBD5E1',
                  }}
                >
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  className="text-sm font-medium leading-snug"
                  style={{ color: isSelected ? '#15803D' : '#374151' }}
                >
                  {issue.displayTitle}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4 mb-2">
          気になる項目がなければそのまま次へ進めます
        </p>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
        <button
          onClick={handleNext}
          className="w-full text-white font-bold rounded-2xl text-base transition-all active:scale-[0.98]"
          style={{
            minHeight: '52px',
            background: 'linear-gradient(135deg, #16A34A, #15803D)',
            boxShadow: '0 6px 20px rgba(22,163,74,0.3)',
          }}
        >
          {isLastCategory
            ? `結果を見る${totalSelected > 0 ? `（${totalSelected}件）` : ''} →`
            : '次のカテゴリへ →'}
        </button>
      </div>
    </div>
  );
}
