'use client';

import { MetricCard, MetricStat, MetricStatGrid } from '@/components/MetricCard';

interface QueueDepthProps {
  queueDepth: number;
  bufferedAmount: number;
}

export function QueueDepth({ queueDepth, bufferedAmount }: QueueDepthProps) {
  const bufferedKb = (bufferedAmount / 1024).toFixed(1);
  return (
    <MetricCard
      label="Outbound pressure"
      tooltip="Outbound queue depth and browser send-buffer pressure."
    >
      <MetricStatGrid>
        <MetricStat
          value={queueDepth}
          hint="in queue"
          tooltip="Messages held client-side until the socket can send."
        />
        <MetricStat
          value={`${bufferedKb} KB`}
          hint="send buffer"
          tooltip="socket.bufferedAmount — bytes queued in the WebSocket send buffer."
        />
      </MetricStatGrid>
    </MetricCard>
  );
}
