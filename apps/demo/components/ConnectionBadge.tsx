'use client';

import type { TetherState } from 'tether-ws';

const STATE_STYLES: Record<TetherState, { label: string; className: string }> = {
  idle: { label: 'Idle', className: 'bg-slate-600' },
  connecting: { label: 'Connecting', className: 'bg-amber-500 animate-pulse' },
  open: { label: 'Open', className: 'bg-emerald-500' },
  reconnecting: { label: 'Reconnecting', className: 'bg-orange-500 animate-pulse' },
  closed: { label: 'Closed', className: 'bg-red-500' },
};

interface ConnectionBadgeProps {
  state: TetherState;
}

export function ConnectionBadge({ state }: ConnectionBadgeProps) {
  const { label, className } = STATE_STYLES[state];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <span className={`inline-block h-3 w-3 rounded-full ${className}`} />
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Connection</p>
        <p className="text-lg font-semibold">{label}</p>
      </div>
    </div>
  );
}
