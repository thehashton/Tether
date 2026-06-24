'use client';

interface QueueDepthProps {
  queueDepth: number;
  bufferedAmount: number;
}

export function QueueDepth({ queueDepth, bufferedAmount }: QueueDepthProps) {
  const bufferedKb = (bufferedAmount / 1024).toFixed(1);
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Outbound pressure</p>
      <div className="mt-2 grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{queueDepth}</p>
          <p className="text-sm text-[var(--muted)]">queued messages</p>
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{bufferedKb} KB</p>
          <p className="text-sm text-[var(--muted)]">socket.bufferedAmount</p>
        </div>
      </div>
    </div>
  );
}
