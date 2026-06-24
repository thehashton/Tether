'use client';

import { MetricCard, MetricStat, MetricStatGrid } from '@/components/MetricCard';

interface BackoffMeterProps {
  attempt: number;
  delayMs: number | null;
}

export function BackoffMeter({ attempt, delayMs }: BackoffMeterProps) {
  return (
    <MetricCard label="Reconnect backoff">
      <MetricStatGrid>
        <MetricStat value={attempt} hint="attempt" />
        <MetricStat value={delayMs !== null ? `${delayMs}ms` : '—'} hint="next delay" />
      </MetricStatGrid>
    </MetricCard>
  );
}
