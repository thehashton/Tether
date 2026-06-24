'use client';

interface BackoffMeterProps {
  attempt: number;
  delayMs: number | null;
}

export function BackoffMeter({ attempt, delayMs }: BackoffMeterProps) {
  return (
    <div className="panel px-5 py-4">
      <p className="panel-label">Reconnect backoff</p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="metric-value">{attempt}</p>
          <p className="mt-0.5 text-sm text-[var(--muted)]">attempt</p>
        </div>
        <div>
          <p className="metric-value">{delayMs !== null ? `${delayMs}ms` : '—'}</p>
          <p className="mt-0.5 text-sm text-[var(--muted)]">next delay (jittered)</p>
        </div>
      </div>
    </div>
  );
}
