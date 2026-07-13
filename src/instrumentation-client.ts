// アプリのフロントエンドコードより先（ハイドレーション前）に実行されるファイル。
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
//
// 自前アナリティクスのページビュー計測:
//   - 初回ロードをここで1回記録
//   - 以降のSPA遷移は onRouterTransitionStart（Next.js公式フック）で記録
import { trackPageView } from '@/lib/analytics';

let lastPath = window.location.pathname;
trackPageView(lastPath);

export function onRouterTransitionStart(url: string): void {
  try {
    const next = new URL(url, window.location.origin);
    if (next.pathname !== lastPath) {
      lastPath = next.pathname;
      trackPageView(next.pathname);
    }
  } catch {
    /* noop */
  }
}
