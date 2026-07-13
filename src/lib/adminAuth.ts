import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getSql } from '@/lib/statsDb';

// 管理画面パスワードは Postgres の admin_auth テーブル（1行のみ）に
// scrypt ハッシュで保存する。env変数と違い実行中に書き換えられるため、
// 「パスワードを忘れた」際のセルフサービス再設定が可能になる。

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const hash = scryptSync(password, salt, 64);
  const storedHash = Buffer.from(hashHex, 'hex');
  if (hash.length !== storedHash.length) return false;
  return timingSafeEqual(hash, storedHash);
}

/** 長さの違いによるタイミング差を出さない文字列比較 */
export function safeCompare(a: string, b: string): boolean {
  const ha = scryptSync(a, 'play-thema-compare-salt', 32);
  const hb = scryptSync(b, 'play-thema-compare-salt', 32);
  return timingSafeEqual(ha, hb);
}

/** メールアドレス・秘密の質問の答えの表記ゆれ（大小文字・前後空白）を吸収する */
export function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export async function getPasswordHash(): Promise<string | null> {
  const sql = getSql();
  const rows = (await sql`select password_hash from admin_auth where id = 1`) as Array<{
    password_hash: string;
  }>;
  return rows[0]?.password_hash ?? null;
}

export async function setPasswordHash(hash: string): Promise<void> {
  const sql = getSql();
  await sql`
    insert into admin_auth (id, password_hash, updated_at)
    values (1, ${hash}, now())
    on conflict (id) do update set password_hash = excluded.password_hash, updated_at = now()`;
}

export interface RecoveryInfo {
  email: string;
  question: string;
  answerHash: string;
}

/** パスワード再設定用の登録情報（メール＋秘密の質問）。未設定なら null */
export async function getRecoveryInfo(): Promise<RecoveryInfo | null> {
  const sql = getSql();
  const rows = (await sql`
    select recovery_email, security_question, security_answer_hash
    from admin_auth where id = 1`) as Array<{
    recovery_email: string | null;
    security_question: string | null;
    security_answer_hash: string | null;
  }>;
  const row = rows[0];
  if (!row?.recovery_email || !row.security_question || !row.security_answer_hash) return null;
  return { email: row.recovery_email, question: row.security_question, answerHash: row.security_answer_hash };
}
