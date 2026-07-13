'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { trackWebVital } from '@/lib/analytics';

const TRACKED = new Set(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']);

/** Speed Insightsの代替。Core Web Vitalsを自前アナリティクスへ送る。 */
export default function WebVitals() {
  useReportWebVitals((metric) => {
    if (TRACKED.has(metric.name)) {
      trackWebVital(metric.name, metric.value);
    }
  });
  return null;
}
