import { neon } from '@neondatabase/serverless';

// Neon HTTPドライバ。接続プール不要でサーバーレスに向く。
// ビルド時（envなし）にimportされても落ちないよう遅延初期化にする。
let _sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    _sql = neon(url);
  }
  return _sql;
}

// 収集を許可するイベント名（それ以外は破棄）。
// プレーテーマ辞典の利用の流れ: 辞典を開く → カテゴリ選択 → 項目を展開して読む
export const ALLOWED_EVENTS = new Set([
  'page_view',
  'web_vital',
  'cta_click',
  'category_select', // カテゴリを選んだ（イントロのボタン / 一覧のタブ）
  'issue_expand', // 項目（プレーテーマ）を展開して詳細を読んだ
]);
