'use client';

import { MetricCard, MetricStat, MetricStatGrid } from '@/components/MetricCard';

interface QueueDepthProps {
  queueDepth: number;
  bufferedAmount: number;
}

export function QueueDepth({ queueDepth, bufferedAmount }: QueueDepthProps) {
  const bufferedKb = (bufferedAmount / 1024).toFixed(1);
  return (
    <MetricCard label="Outbound pressure">
      <MetricStatGrid>
        <MetricStat value={queueDepth} hint="queued" />
        <MetricStat value={`${bufferedKb} KB`} hint="buffered" />
      </MetricStatGrid>
    </MetricCard>
  );
}
