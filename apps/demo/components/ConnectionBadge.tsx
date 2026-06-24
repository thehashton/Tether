'use client';

import type { TetherState } from 'tether-ws';
import { MetricCard } from '@/components/MetricCard';

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
    label: 'Reconnecting',
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
      <div className="flex items-center gap-3">
        <span className={`metric-dot ${dotClass}`} aria-hidden />
        <p className={`metric-hero-value ${valueClass}`}>{label}</p>
      </div>
    </MetricCard>
  );
}
