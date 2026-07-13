'use client';

import { sendGAEvent } from '@next/third-parties/google';

// GA4 の測定ID。Vercel の環境変数 NEXT_PUBLIC_GA_ID に G-XXXXXXXXXX を
// 設定すると GA4 への送信が有効になる（未設定なら GA 送信はスキップ）。
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

// 自前アナリティクス（/api/app-event → Neon）への送信可否。
// 本番のみ送信し、ローカル開発のデータ混入を防ぐ。
// ローカルで動作確認したいときは NEXT_PUBLIC_STATS_DEBUG=1 を付けて起動する。
const APP_STATS_ENABLED =
  process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_STATS_DEBUG === '1';

type EventParams = Record<string, string | number | boolean>;

/**
 * GA4 へ送信する。GA スクリプト（dataLayer）の初期化がページ表示直後の
 * イベントに間に合わないことがあるため、その場合は短いリトライで待つ。
 */
function sendToGA(name: string, params: EventParams, attempt = 0): void {
  if (typeof window === 'undefined') return;
  if (!(window as unknown as { dataLayer?: unknown[] }).dataLayer) {
    if (attempt < 10) {
      setTimeout(() => sendToGA(name, params, attempt + 1), 300);
    }
    return;
  }
  try {
    sendGAEvent('event', name, params);
  } catch {
    /* noop */
  }
}

/**
 * 自前アナリティクスへ送信する。sendBeacon（ページ離脱時も届く）を優先し、
 * 使えない環境では keepalive fetch にフォールバック。
 */
function sendToApp(name: string, params: EventParams, extra: { path?: string; ref?: string } = {}): void {
  if (typeof window === 'undefined' || !APP_STATS_ENABLED) return;
  // 管理画面（アクセス解析自身）は計測しない
  if ((extra.path ?? window.location.pathname).startsWith('/admin')) return;
  try {
    const body = JSON.stringify({
      name,
      params: Object.keys(params).length > 0 ? params : undefined,
      path: extra.path ?? window.location.pathname,
      ref: extra.ref,
    });
    const ok =
      typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon('/api/app-event', new Blob([body], { type: 'application/json' }));
    if (!ok) {
      fetch('/api/app-event', {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {});
    }
  } catch {
    /* noop */
  }
}

/**
 * すべてのアナリティクス（自前 / Google Analytics 4）へ同一イベントを送る。
 * 計測の失敗がアプリ動作に影響しないよう握りつぶす。
 */
export function trackEvent(name: string, params: EventParams = {}): void {
  sendToApp(name, params);
  if (GA_ID) {
    sendToGA(name, params);
  }
}

/**
 * ページビュー。自前アナリティクスのみに送る
 * （GA4側は拡張計測が履歴イベントから自動でpage_viewを記録するため二重送信しない）。
 */
export function trackPageView(path: string): void {
  sendToApp('page_view', {}, { path, ref: document.referrer || undefined });
}

/** Web Vitals（LCP/CLS/INPなど）。自前アナリティクスのみに送る。 */
export function trackWebVital(metric: string, value: number): void {
  sendToApp('web_vital', {
    metric,
    // CLSは小数なので1000倍して整数化（表示時に戻す）
    value: Math.round(metric === 'CLS' ? value * 1000 : value),
  });
}

// ─── プレーテーマ辞典のイベント ──────────────────────────────

/** カテゴリを選んだ（イントロのカテゴリボタン / 一覧画面のタブ切替） */
export function trackCategorySelect(category: string): void {
  trackEvent('category_select', { category });
}

/** 項目（プレーテーマ）を展開して詳細を読んだ。どのテーマが読まれているかの分析用（中心指標） */
export function trackIssueExpand(issueId: string, category: string): void {
  trackEvent('issue_expand', { issue_id: issueId, category });
}

/** 主要ボタンのクリック（導線分析用。例: すべてのカテゴリを見る） */
export function trackCtaClick(id: string): void {
  trackEvent('cta_click', { id });
}
