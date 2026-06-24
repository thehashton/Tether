'use client';

import { MetricCard, MetricStat, MetricStatGrid } from '@/components/MetricCard';

interface FloodMeterProps {
  received: number;
  target: number | null;
  backpressureEvents: number;
}

export function FloodMeter({ received, target, backpressureEvents }: FloodMeterProps) {
  const pct =
    target && target > 0 ? Math.min(100, Math.round((received / target) * 100)) : null;

  const receivedDisplay =
    target !== null ? String(received) : received > 0 ? String(received) : '—';

  const totalDisplay = target !== null ? String(target) : '—';

  const showProgress = target !== null && pct !== null;
  const showFooter = showProgress || backpressureEvents > 0;

  return (
    <MetricCard
      label="Inbound flood"
      footer={
        showFooter ? (
          <>
            {showProgress && (
              <div
                className="metric-progress"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="metric-progress-fill" style={{ width: `${pct}%` }} />
              </div>
            )}
            {backpressureEvents > 0 && (
              <p className="metric-footer-note">
                {backpressureEvents} backpressure event{backpressureEvents === 1 ? '' : 's'}
              </p>
            )}
          </>
        ) : undefined
      }
    >
      <MetricStatGrid>
        <MetricStat
          value={receivedDisplay}
          hint="received"
          valueClassName="text-orange-300"
          title="Messages received on the flood channel"
        />
        <MetricStat
          value={totalDisplay}
          hint="of total"
          valueClassName="text-orange-300/80"
          title={target !== null ? `${pct}% complete` : 'No active flood'}
        />
      </MetricStatGrid>
    </MetricCard>
  );
}
