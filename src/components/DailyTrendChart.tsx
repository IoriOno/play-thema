'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailyPoint } from '@/lib/statsQueries';

/** 日次の訪問者数・ページビューの推移（管理ダッシュボード用） */
export default function DailyTrendChart({ data }: { data: DailyPoint[] }) {
  const points = data.map((d) => ({ ...d, label: d.day.slice(5).replace('-', '/') }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={{ stroke: '#E2E8F0' }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #E2E8F0' }}
          labelStyle={{ fontWeight: 700 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="visitors" name="訪問者" stroke="#4338CA" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="pageviews" name="ページビュー" stroke="#16A34A" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
