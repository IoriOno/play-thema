'use server';

import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  getPasswordHash,
  setPasswordHash,
  hashPassword,
  verifyPassword,
  safeCompare,
  normalize,
  getRecoveryInfo,
} from '@/lib/adminAuth';

const AUTH_COOKIE = 'play_thema_admin';

// セッションcookieの値はパスワードハッシュ由来にする。
// こうすると、パスワードを再設定した瞬間に古いcookieは自動的に無効化される。
function sessionToken(passwordHash: string): string {
  return createHash('sha256').update(`${passwordHash}:play-thema-admin-v1`).digest('hex');
}

/** ダッシュボードの認証状態を確認する（Server Component から呼ぶ） */
export async function isAuthed(): Promise<boolean> {
  const hash = await getPasswordHash();
  if (!hash) return false;
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value === sessionToken(hash);
}

export async function login(formData: FormData): Promise<void> {
  const input = formData.get('password');
  const hash = await getPasswordHash();
  if (!hash || typeof input !== 'string' || !verifyPassword(input, hash)) {
    redirect('/admin/analytics?error=1');
  }
  const store = await cookies();
  store.set(AUTH_COOKIE, sessionToken(hash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath('/admin/analytics');
  redirect('/admin/analytics');
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  revalidatePath('/admin/analytics');
  redirect('/admin/analytics');
}

/** メールアドレス＋秘密の質問を使ったパスワード再設定（パスワードを忘れた場合の自己解決） */
export async function resetPassword(formData: FormData): Promise<void> {
  const email = formData.get('email');
  const answer = formData.get('answer');
  const newPassword = formData.get('newPassword');
  const confirm = formData.get('confirm');

  const info = await getRecoveryInfo();
  const emailOk =
    !!info && typeof email === 'string' && safeCompare(normalize(email), normalize(info.email));
  const answerOk =
    !!info && typeof answer === 'string' && verifyPassword(normalize(answer), info.answerHash);

  if (!info || !emailOk || !answerOk) {
    redirect('/admin/analytics?view=reset&error=auth');
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    redirect('/admin/analytics?view=reset&error=weak');
  }
  if (newPassword !== confirm) {
    redirect('/admin/analytics?view=reset&error=mismatch');
  }

  await setPasswordHash(hashPassword(newPassword));
  redirect('/admin/analytics?reset=success');
}
