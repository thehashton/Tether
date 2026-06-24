'use client';

import type { TetherState } from 'tether-ws';
import { MetricCard } from '@/components/MetricCard';
import { TooltipLabel } from '@/components/InfoTooltip';

const STATE_STYLES: Record<
  TetherState,
  { label: string; dotClass: string; valueClass: string }
> = {
  idle: { label: 'Idle', dotClass: 'metric-dot-idle', valueClass: 'text-slate-200' },
  connecting: {
    label: 'Connecting',
    dotClass: 'metric-dot-connecting',
    valueClass: 'text-amber-200',
  },
  open: {
    label: 'Open',
    dotClass: 'metric-dot-open',
    valueClass: 'text-emerald-200',
  },
  reconnecting: {
    label: 'Retrying',
    dotClass: 'metric-dot-reconnecting',
    valueClass: 'text-orange-200',
  },
  closed: { label: 'Closed', dotClass: 'metric-dot-closed', valueClass: 'text-red-200' },
};

interface ConnectionBadgeProps {
  state: TetherState;
}

export function ConnectionBadge({ state }: ConnectionBadgeProps) {
  const { label, dotClass, valueClass } = STATE_STYLES[state];
  return (
    <MetricCard
      label="Connection"
      tooltip="WebSocket lifecycle state managed by Tether's reconnecting client."
    >
      <div className="connection-metric">
        <div className="connection-metric-main">
          <p className={`connection-metric-value ${valueClass}`}>{label}</p>
          <span className={`metric-dot metric-dot-lg shrink-0 ${dotClass}`} aria-hidden />
        </div>
        <div className="connection-metric-labels">
          <TooltipLabel
            text="Current state: idle, connecting, open, reconnecting, or closed."
            placement="above"
          >
            status
          </TooltipLabel>
          <TooltipLabel
            text="Live socket indicator — color matches connection health."
            placement="above"
          >
            socket
          </TooltipLabel>
        </div>
      </div>
    </MetricCard>
  );
}
