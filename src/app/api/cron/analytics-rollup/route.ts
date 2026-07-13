import { getSql } from '@/lib/statsDb';

export const runtime = 'nodejs';

// 日次ロールアップ（Vercel Cronから毎日0:30 JSTに実行）。
//   1. 直近3日分（今日を除く確定した日）を daily_stats へ集計し直す（冪等・取りこぼし自己修復）
//   2. 90日より古い生イベントを削除（無料枠を恒久的に使い続けるための保持ポリシー）
// daily_stats は恒久保持なので、長期推移は生イベント削除後も追える。

const RAW_RETENTION_DAYS = 90;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sql = getSql();

  // JSTの「日」で集計するための共通式（インデックスはtsに効かせ、範囲は広めに絞る）
  const rollup = async (metric: string, keyExpr: string, where = 'true') => {
    await sql.query(
      `insert into daily_stats (day, metric, key, count)
       select (ts at time zone 'Asia/Tokyo')::date as day, $1 as metric, ${keyExpr} as key, count(*)::int
       from events
       where ts >= now() - interval '4 days'
         and (ts at time zone 'Asia/Tokyo')::date < (now() at time zone 'Asia/Tokyo')::date
         and ${where}
       group by 1, 3
       on conflict (day, metric, key) do update set count = excluded.count`,
      [metric],
    );
  };

  try {
    // ユニーク訪問者（日替わりハッシュなので日単位のdistinctが正確）
    await sql.query(
      `insert into daily_stats (day, metric, key, count)
       select (ts at time zone 'Asia/Tokyo')::date, 'visitors', '', count(distinct visitor_hash)::int
       from events
       where ts >= now() - interval '4 days'
         and (ts at time zone 'Asia/Tokyo')::date < (now() at time zone 'Asia/Tokyo')::date
       group by 1
       on conflict (day, metric, key) do update set count = excluded.count`,
    );

    await rollup('pageviews', `''`, `name = 'page_view'`);
    await rollup('page', `coalesce(path, '')`, `name = 'page_view'`);
    await rollup('event', `name`, `name <> 'page_view' and name <> 'web_vital'`);
    await rollup('country', `coalesce(country, '??')`, `name = 'page_view'`);
    await rollup('device', `device`, `name = 'page_view'`);
    await rollup('browser', `browser`, `name = 'page_view'`);
    await rollup('referrer', `coalesce(referrer_host, '')`, `name = 'page_view' and referrer_host is not null`);
    await rollup('category', `coalesce(params->>'category', '')`, `name = 'category_select'`);
    await rollup('issue', `coalesce(params->>'issue_id', '')`, `name = 'issue_expand'`);

    const deleted = (await sql.query(
      `with del as (
         delete from events where ts < now() - make_interval(days => $1) returning 1
       ) select count(*)::int as n from del`,
      [RAW_RETENTION_DAYS],
    )) as Array<{ n: number }>;

    return Response.json({ ok: true, deletedOldEvents: deleted[0]?.n ?? 0 });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
