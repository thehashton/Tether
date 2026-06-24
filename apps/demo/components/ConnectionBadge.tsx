'use client';

import type { TetherState } from 'tether-ws';
import { MetricCard, MetricStat, MetricStatGrid } from '@/components/MetricCard';

const STATE_STYLES: Record<
  TetherState,
  { label: string; dotClass: string; valueClass: string }
> = {
  idle: { label: 'Idle', dotClass: 'metric-dot-idle', valueClass: 'text-slate-300' },
  connecting: {
    label: 'Connecting',
    dotClass: 'metric-dot-connecting',
    valueClass: 'text-amber-300',
  },
  open: {
    label: 'Open',
    dotClass: 'metric-dot-open',
    valueClass: 'text-emerald-300',
  },
  reconnecting: {
    label: 'Retrying',
    dotClass: 'metric-dot-reconnecting',
    valueClass: 'text-orange-300',
  },
  closed: { label: 'Closed', dotClass: 'metric-dot-closed', valueClass: 'text-red-300' },
};

interface ConnectionBadgeProps {
  state: TetherState;
}

export function ConnectionBadge({ state }: ConnectionBadgeProps) {
  const { label, dotClass, valueClass } = STATE_STYLES[state];
  return (
    <MetricCard label="Connection">
      <MetricStatGrid>
        <MetricStat value={label} hint="status" valueClassName={valueClass} />
        <MetricStat
          value={<span className={`metric-dot metric-dot-lg ${dotClass}`} aria-hidden />}
          hint="socket"
          title="WebSocket connection indicator"
        />
      </MetricStatGrid>
    </MetricCard>
  );
}
