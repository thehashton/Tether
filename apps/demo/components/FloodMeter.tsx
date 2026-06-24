'use client';

import { MetricCard } from '@/components/MetricCard';

interface FloodMeterProps {
  received: number;
  target: number | null;
  backpressureEvents: number;
}

export function FloodMeter({ received, target, backpressureEvents }: FloodMeterProps) {
  const pct =
    target && target > 0 ? Math.min(100, Math.round((received / target) * 100)) : null;

  const display =
    target !== null ? `${received} / ${target}` : received > 0 ? String(received) : '—';

  return (
    <MetricCard
      label="Inbound flood"
      footer={
        backpressureEvents > 0 ? (
          <p className="text-xs text-orange-400/90">
            {backpressureEvents} backpressure event{backpressureEvents === 1 ? '' : 's'}
          </p>
        ) : null
      }
    >
      <p className="metric-hero-value text-orange-300">{display}</p>
      {target !== null && pct !== null && (
        <div className="metric-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="metric-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </MetricCard>
  );
}
