import { getSql } from '@/lib/statsDb';

// 管理ダッシュボード用の集計クエリ。
// 直近30日は生イベント（保持90日）から直接集計する。
// 日付はすべて日本時間（Asia/Tokyo）の「日」で数える。

export interface DailyPoint {
  day: string; // YYYY-MM-DD
  visitors: number;
  pageviews: number;
}

export interface KeyCount {
  key: string;
  count: number;
}

export interface StatsData {
  today: { visitors: number; pageviews: number };
  last30: {
    visitors: number; // 日次ユニークの合計（延べ）
    pageviews: number;
    categorySelects: number;
    issueExpands: number;
  };
  daily: DailyPoint[];
  topPages: KeyCount[];
  referrers: KeyCount[];
  countries: KeyCount[];
  devices: KeyCount[];
  browsers: KeyCount[];
  categories: KeyCount[]; // よく選ばれたカテゴリ
  issues: KeyCount[]; // よく読まれたプレーテーマ（項目）
  vitals: { metric: string; p75: number; samples: number }[];
  events: KeyCount[];
}

const JST_DAY = `(ts at time zone 'Asia/Tokyo')::date`;
const SINCE_30D = `ts >= (now() at time zone 'Asia/Tokyo' - interval '29 days')::date at time zone 'Asia/Tokyo'`;

export async function fetchStats(): Promise<StatsData> {
  const sql = getSql();
  const q = async <T>(text: string): Promise<T[]> => (await sql.query(text)) as T[];

  const [
    todayRows,
    kpiRows,
    daily,
    topPages,
    referrers,
    countries,
    devices,
    browsers,
    categories,
    issues,
    vitals,
    events,
  ] = await Promise.all([
    q<{ visitors: number; pageviews: number }>(`
      select count(distinct visitor_hash)::int as visitors,
             count(*) filter (where name = 'page_view')::int as pageviews
      from events
      where ${JST_DAY} = (now() at time zone 'Asia/Tokyo')::date`),
    q<{ visitors: number; pageviews: number; category_selects: number; issue_expands: number }>(`
      with d as (
        select ${JST_DAY} as day, count(distinct visitor_hash)::int as v
        from events where ${SINCE_30D} group by 1
      )
      select
        (select coalesce(sum(v), 0)::int from d) as visitors,
        count(*) filter (where name = 'page_view')::int as pageviews,
        count(*) filter (where name = 'category_select')::int as category_selects,
        count(*) filter (where name = 'issue_expand')::int as issue_expands
      from events where ${SINCE_30D}`),
    q<DailyPoint>(`
      select to_char(${JST_DAY}, 'YYYY-MM-DD') as day,
             count(distinct visitor_hash)::int as visitors,
             count(*) filter (where name = 'page_view')::int as pageviews
      from events where ${SINCE_30D}
      group by 1 order by 1`),
    q<KeyCount>(`
      select coalesce(path, '') as key, count(*)::int as count
      from events where name = 'page_view' and ${SINCE_30D}
      group by 1 order by 2 desc limit 10`),
    q<KeyCount>(`
      select referrer_host as key, count(*)::int as count
      from events where name = 'page_view' and referrer_host is not null and ${SINCE_30D}
      group by 1 order by 2 desc limit 10`),
    q<KeyCount>(`
      select coalesce(country, '??') as key, count(*)::int as count
      from events where name = 'page_view' and ${SINCE_30D}
      group by 1 order by 2 desc limit 10`),
    q<KeyCount>(`
      select device as key, count(*)::int as count
      from events where name = 'page_view' and ${SINCE_30D}
      group by 1 order by 2 desc`),
    q<KeyCount>(`
      select browser as key, count(*)::int as count
      from events where name = 'page_view' and ${SINCE_30D}
      group by 1 order by 2 desc limit 8`),
    q<KeyCount>(`
      select coalesce(params->>'category', '(不明)') as key, count(*)::int as count
      from events where name = 'category_select' and ${SINCE_30D}
      group by 1 order by 2 desc limit 12`),
    q<KeyCount>(`
      select coalesce(params->>'issue_id', '(不明)') as key, count(*)::int as count
      from events where name = 'issue_expand' and ${SINCE_30D}
      group by 1 order by 2 desc limit 20`),
    q<{ metric: string; p75: number; samples: number }>(`
      select params->>'metric' as metric,
             percentile_cont(0.75) within group (order by (params->>'value')::numeric)::float as p75,
             count(*)::int as samples
      from events
      where name = 'web_vital' and ts >= now() - interval '7 days'
      group by 1`),
    q<KeyCount>(`
      select name as key, count(*)::int as count
      from events where name not in ('page_view', 'web_vital') and ${SINCE_30D}
      group by 1 order by 2 desc`),
  ]);

  return {
    today: todayRows[0] ?? { visitors: 0, pageviews: 0 },
    last30: {
      visitors: kpiRows[0]?.visitors ?? 0,
      pageviews: kpiRows[0]?.pageviews ?? 0,
      categorySelects: kpiRows[0]?.category_selects ?? 0,
      issueExpands: kpiRows[0]?.issue_expands ?? 0,
    },
    daily,
    topPages,
    referrers,
    countries,
    devices,
    browsers,
    categories,
    issues,
    vitals,
    events,
  };
}
