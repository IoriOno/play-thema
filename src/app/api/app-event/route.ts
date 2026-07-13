import { createHash } from 'node:crypto';
import { getSql, ALLOWED_EVENTS } from '@/lib/statsDb';

// 自前アナリティクスの受信エンドポイント。
// プライバシー方針:
//   - Cookieは使わない。訪問者の識別は「日替わりソルト + IP + UA」のSHA-256ハッシュのみ
//     （翌日には同じ人でも別ハッシュになる＝ユニーク数は日単位でしか数えない設計）
//   - 生のIP・生のUAは保存しない（国コードと device/browser/os に丸める）

const BOT_RE =
  /bot|crawl|spider|slurp|headless|lighthouse|pingdom|monitor|preview|facebookexternalhit|vercel-screenshot|prerender/i;

function parseUa(ua: string): { device: string; browser: string; os: string } {
  const device = /ipad|tablet/i.test(ua)
    ? 'tablet'
    : /mobi|iphone|android/i.test(ua)
      ? 'mobile'
      : 'desktop';
  const os = /iphone|ipad|ipod/i.test(ua)
    ? 'iOS'
    : /android/i.test(ua)
      ? 'Android'
      : /windows/i.test(ua)
        ? 'Windows'
        : /macintosh|mac os/i.test(ua)
          ? 'macOS'
          : /linux/i.test(ua)
            ? 'Linux'
            : 'other';
  // アプリ内ブラウザ（LINE/Instagram）は共有導線の分析に重要なので個別に拾う
  const browser = / line\//i.test(ua)
    ? 'LINE'
    : /instagram/i.test(ua)
      ? 'Instagram'
      : /edg\//i.test(ua)
        ? 'Edge'
        : /chrome|crios/i.test(ua)
          ? 'Chrome'
          : /firefox|fxios/i.test(ua)
            ? 'Firefox'
            : /safari/i.test(ua)
              ? 'Safari'
              : 'other';
  return { device, browser, os };
}

// 日本時間の日付でソルトを回す（0時にハッシュが切り替わる）
function jstDateString(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function visitorHash(ip: string, ua: string): string {
  const secret = process.env.ANALYTICS_SALT_SECRET ?? 'play-thema-default-salt';
  return createHash('sha256')
    .update(`${secret}:${jstDateString()}:${ip}:${ua}`)
    .digest('hex')
    .slice(0, 32);
}

function sanitizeParams(input: unknown): Record<string, string | number | boolean> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const out: Record<string, string | number | boolean> = {};
  let n = 0;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (n >= 12) break;
    if (typeof v === 'string') out[k.slice(0, 40)] = v.slice(0, 120);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k.slice(0, 40)] = v;
    else if (typeof v === 'boolean') out[k.slice(0, 40)] = v;
    else continue;
    n++;
  }
  return n > 0 ? out : null;
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (!raw || raw.length > 4096) return new Response(null, { status: 204 });

    let body: { name?: unknown; params?: unknown; path?: unknown; ref?: unknown };
    try {
      body = JSON.parse(raw);
    } catch {
      return new Response(null, { status: 204 });
    }

    const name = typeof body.name === 'string' ? body.name.slice(0, 40) : '';
    if (!ALLOWED_EVENTS.has(name)) return new Response(null, { status: 204 });

    const ua = request.headers.get('user-agent') ?? '';
    if (!ua || BOT_RE.test(ua)) return new Response(null, { status: 204 });

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      '0.0.0.0';
    const country = request.headers.get('x-vercel-ip-country')?.slice(0, 2) ?? null;
    const { device, browser, os } = parseUa(ua);

    const path = typeof body.path === 'string' ? body.path.slice(0, 200) : null;
    const params = sanitizeParams(body.params);

    // 参照元は page_view のみ・外部ホストのみ保存
    let referrerHost: string | null = null;
    if (name === 'page_view' && typeof body.ref === 'string' && body.ref) {
      try {
        const host = new URL(body.ref).hostname;
        const self = request.headers.get('host')?.split(':')[0];
        if (host && host !== self) referrerHost = host.slice(0, 100);
      } catch {
        /* noop */
      }
    }

    const sql = getSql();
    await sql`
      insert into events (name, path, params, visitor_hash, country, device, browser, os, referrer_host)
      values (${name}, ${path}, ${params ? JSON.stringify(params) : null}::jsonb,
              ${visitorHash(ip, ua)}, ${country}, ${device}, ${browser}, ${os}, ${referrerHost})`;

    return new Response(null, { status: 204 });
  } catch {
    // 計測の失敗はクライアントに影響させない
    return new Response(null, { status: 204 });
  }
}
