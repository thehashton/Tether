'use client';

interface FloodMeterProps {
  received: number;
  target: number | null;
  backpressureEvents: number;
}

export function FloodMeter({ received, target, backpressureEvents }: FloodMeterProps) {
  const pct =
    target && target > 0 ? Math.min(100, Math.round((received / target) * 100)) : null;

  return (
    <div className="panel px-5 py-4">
      <p className="panel-label">Inbound flood</p>
      <div className="mt-3">
        <p className="metric-value text-orange-300">
          {target !== null ? `${received} / ${target}` : received > 0 ? received : '—'}
        </p>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          messages received on <code className="text-[var(--accent)]">flood</code> channel
        </p>
        {target !== null && pct !== null && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {backpressureEvents > 0 && (
          <p className="mt-2 text-xs text-orange-400">
            {backpressureEvents} inbound backpressure event
            {backpressureEvents === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  );
}
