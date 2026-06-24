'use client';

interface QueueDepthProps {
  queueDepth: number;
  bufferedAmount: number;
}

export function QueueDepth({ queueDepth, bufferedAmount }: QueueDepthProps) {
  const bufferedKb = (bufferedAmount / 1024).toFixed(1);
  return (
    <div className="panel px-5 py-4">
      <p className="panel-label">Outbound pressure</p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="metric-value">{queueDepth}</p>
          <p className="mt-0.5 text-sm text-[var(--muted)]">queued messages</p>
        </div>
        <div>
          <p className="metric-value">{bufferedKb} KB</p>
          <p className="mt-0.5 text-sm text-[var(--muted)]">socket.bufferedAmount</p>
        </div>
      </div>
    </div>
  );
}
