// 自前アナリティクスのスキーマを作成する（冪等）。
// 実行: node --env-file=.env.local scripts/setup-analytics-db.mjs
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL がありません。`vercel env pull .env.local` を先に実行してください。');
  process.exit(1);
}
const sql = neon(url);

// 生イベント（90日保持。日次ロールアップ後に削除される）
await sql`
  create table if not exists events (
    id bigint generated always as identity primary key,
    ts timestamptz not null default now(),
    name text not null,
    path text,
    params jsonb,
    visitor_hash text not null,
    country char(2),
    device text,
    browser text,
    os text,
    referrer_host text
  )`;
await sql`create index if not exists events_ts_idx on events (ts)`;
await sql`create index if not exists events_name_ts_idx on events (name, ts)`;

// 日次ロールアップ（恒久保持）
await sql`
  create table if not exists daily_stats (
    day date not null,
    metric text not null,
    key text not null default '',
    count integer not null,
    primary key (day, metric, key)
  )`;

const t = await sql`select count(*)::int as n from events`;
console.log('schema OK / events rows:', t[0].n);
