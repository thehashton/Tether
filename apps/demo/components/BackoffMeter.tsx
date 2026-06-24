'use client';

import { MetricCard, MetricStat, MetricStatGrid } from '@/components/MetricCard';

interface BackoffMeterProps {
  attempt: number;
  delayMs: number | null;
}

export function BackoffMeter({ attempt, delayMs }: BackoffMeterProps) {
  return (
    <MetricCard
      label="Reconnect backoff"
      tooltip="Exponential backoff with jitter between reconnect attempts."
    >
      <MetricStatGrid>
        <MetricStat
          value={attempt}
          hint="retries"
          tooltip="Reconnect attempts since the last successful open."
        />
        <MetricStat
          value={delayMs !== null ? `${delayMs}ms` : '—'}
          hint="next wait"
          tooltip="Milliseconds until the next retry — blank while connected."
        />
      </MetricStatGrid>
    </MetricCard>
  );
}
