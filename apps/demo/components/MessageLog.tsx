'use client';

export type LogEntryType =
  | 'sent'
  | 'received'
  | 'queued'
  | 'flushed'
  | 'heartbeat'
  | 'backpressure'
  | 'auth-refreshed'
  | 'statechange'
  | 'reconnecting'
  | 'error'
  | 'info';

export interface LogEntry {
  id: string;
  ts: number;
  type: LogEntryType;
  message: string;
  detail?: unknown;
}

const TYPE_COLORS: Record<LogEntryType, string> = {
  sent: 'text-sky-400',
  received: 'text-emerald-400',
  queued: 'text-amber-400',
  flushed: 'text-lime-400',
  heartbeat: 'text-violet-400',
  backpressure: 'text-orange-400',
  'auth-refreshed': 'text-[var(--accent)]',
  statechange: 'text-slate-400',
  reconnecting: 'text-orange-300',
  error: 'text-red-400',
  info: 'text-[var(--muted)]',
};

interface MessageLogProps {
  entries: LogEntry[];
  className?: string;
}

export function MessageLog({ entries, className = '' }: MessageLogProps) {
  return (
    <div className={`message-log flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}>
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        <span className="ml-2 panel-label">Output</span>
      </div>
      <div className="terminal flex-1 overflow-y-auto p-4 text-xs leading-relaxed">
        {entries.length === 0 ? (
          <p className="text-[var(--muted)]">Waiting for events…</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="mb-1.5 hover:bg-white/[0.02]">
              <span className="text-[var(--muted)]">
                {new Date(entry.ts).toLocaleTimeString()}.
                {String(entry.ts % 1000).padStart(3, '0')}
              </span>{' '}
              <span className={`font-medium ${TYPE_COLORS[entry.type]}`}>[{entry.type}]</span>{' '}
              <span className="text-[var(--text)]">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
