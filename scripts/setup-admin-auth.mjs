// 管理画面パスワード・パスワード再設定用情報（メール＋秘密の質問）の設定スクリプト。
// 通常、パスワードを忘れた場合はログイン画面の「パスワードをお忘れですか？」
// （メールアドレス＋秘密の質問によるセルフサービス再設定）を使う。
// このスクリプトは初回セットアップ、または再設定用情報自体を変更したい
// 場合の手段（DATABASE_URLへアクセスできる開発者のみ実行可能）。
//
// 実行: node --env-file=.env.local scripts/setup-admin-auth.mjs
//
// 必要な環境変数:
//   ADMIN_PASSWORD          管理画面ログインパスワード（必須）
//   ADMIN_RECOVERY_EMAIL    再設定用メールアドレス（任意・question/answerとセットで指定）
//   ADMIN_SECURITY_QUESTION 秘密の質問文（任意）
//   ADMIN_SECURITY_ANSWER   秘密の質問の答え（任意）
import { neon } from '@neondatabase/serverless';
import { randomBytes, scryptSync } from 'node:crypto';

const url = process.env.DATABASE_URL;
const password = process.env.ADMIN_PASSWORD;
const email = process.env.ADMIN_RECOVERY_EMAIL;
const question = process.env.ADMIN_SECURITY_QUESTION;
const answer = process.env.ADMIN_SECURITY_ANSWER;

if (!url) {
  console.error('DATABASE_URL がありません。`vercel env pull .env.local` を先に実行してください。');
  process.exit(1);
}
if (!password) {
  console.error('ADMIN_PASSWORD がありません（.env.local に設定してください）。');
  process.exit(1);
}
const sql = neon(url);

await sql`
  create table if not exists admin_auth (
    id int primary key default 1,
    password_hash text not null,
    recovery_email text,
    security_question text,
    security_answer_hash text,
    updated_at timestamptz not null default now(),
    constraint admin_auth_single_row check (id = 1)
  )`;
// 旧バージョンで作成済みのテーブルにも対応（既にあれば何もしない）
await sql`alter table admin_auth add column if not exists recovery_email text`;
await sql`alter table admin_auth add column if not exists security_question text`;
await sql`alter table admin_auth add column if not exists security_answer_hash text`;

function hash(value) {
  const salt = randomBytes(16).toString('hex');
  const h = scryptSync(value, salt, 64).toString('hex');
  return `${salt}:${h}`;
}

const passwordHash = hash(password);

if (email && question && answer) {
  const answerHash = hash(answer.trim().toLowerCase());
  await sql`
    insert into admin_auth (id, password_hash, recovery_email, security_question, security_answer_hash, updated_at)
    values (1, ${passwordHash}, ${email.trim().toLowerCase()}, ${question}, ${answerHash}, now())
    on conflict (id) do update set
      password_hash = excluded.password_hash,
      recovery_email = excluded.recovery_email,
      security_question = excluded.security_question,
      security_answer_hash = excluded.security_answer_hash,
      updated_at = now()`;
  console.log('admin_auth を更新しました（パスワード + 再設定用のメール/秘密の質問）');
} else {
  await sql`
    insert into admin_auth (id, password_hash, updated_at)
    values (1, ${passwordHash}, now())
    on conflict (id) do update set password_hash = excluded.password_hash, updated_at = now()`;
  console.log('admin_auth を更新しました（パスワードのみ。再設定用情報は未設定のまま）');
}
