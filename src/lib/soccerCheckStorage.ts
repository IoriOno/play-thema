import { SoccerCheckResult } from '@/types/soccerCheck';

const SOCCER_CHECK_KEY = 'torinome_soccer_check';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function saveSoccerCheck(result: SoccerCheckResult): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(SOCCER_CHECK_KEY, JSON.stringify(result));
  } catch {}
}

export function loadSoccerCheck(): SoccerCheckResult | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(SOCCER_CHECK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSoccerCheck(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(SOCCER_CHECK_KEY);
  } catch {}
}
