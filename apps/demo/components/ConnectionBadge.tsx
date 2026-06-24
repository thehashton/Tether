'use client';

import type { TetherState } from 'tether-ws';

const STATE_STYLES: Record<
  TetherState,
  { label: string; dotClass: string; valueClass: string }
> = {
  idle: { label: 'Idle', dotClass: 'bg-slate-500', valueClass: 'text-slate-300' },
  connecting: {
    label: 'Connecting',
    dotClass: 'bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]',
    valueClass: 'text-amber-300',
  },
  open: {
    label: 'Open',
    dotClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    valueClass: 'text-emerald-300',
  },
  reconnecting: {
    label: 'Reconnecting',
    dotClass: 'bg-orange-400 animate-pulse shadow-[0_0_8px_#fb923c]',
    valueClass: 'text-orange-300',
  },
  closed: { label: 'Closed', dotClass: 'bg-red-400', valueClass: 'text-red-300' },
};

interface ConnectionBadgeProps {
  state: TetherState;
}

export function ConnectionBadge({ state }: ConnectionBadgeProps) {
  const { label, dotClass, valueClass } = STATE_STYLES[state];
  return (
    <div className="panel flex items-center gap-4 px-5 py-4">
      <span className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full ${dotClass}`} />
      <div className="min-w-0">
        <p className="panel-label">Connection</p>
        <p className={`metric-value ${valueClass}`}>{label}</p>
      </div>
    </div>
  );
}
