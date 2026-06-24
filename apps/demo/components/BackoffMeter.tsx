'use client';

interface BackoffMeterProps {
  attempt: number;
  delayMs: number | null;
}

export function BackoffMeter({ attempt, delayMs }: BackoffMeterProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Reconnect backoff</p>
      <div className="mt-2 grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{attempt}</p>
          <p className="text-sm text-[var(--muted)]">attempt</p>
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">
            {delayMs !== null ? `${delayMs}ms` : '—'}
          </p>
          <p className="text-sm text-[var(--muted)]">next delay (jittered)</p>
        </div>
      </div>
    </div>
  );
}
