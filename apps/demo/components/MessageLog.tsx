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
  sent: 'text-sky-300',
  received: 'text-emerald-300',
  queued: 'text-amber-300',
  flushed: 'text-lime-300',
  heartbeat: 'text-violet-300',
  backpressure: 'text-orange-300',
  'auth-refreshed': 'text-cyan-300',
  statechange: 'text-slate-300',
  reconnecting: 'text-orange-200',
  error: 'text-red-300',
  info: 'text-[var(--muted)]',
};

interface MessageLogProps {
  entries: LogEntry[];
}

export function MessageLog({ entries }: MessageLogProps) {
  return (
    <div className="flex h-96 flex-col rounded-lg border border-[var(--border)] bg-[var(--panel)]">
      <div className="border-b border-[var(--border)] px-4 py-2">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Event log</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-5">
        {entries.length === 0 ? (
          <p className="text-[var(--muted)]">Waiting for events…</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="mb-1">
              <span className="text-[var(--muted)]">
                {new Date(entry.ts).toLocaleTimeString()}.
                {String(entry.ts % 1000).padStart(3, '0')}
              </span>{' '}
              <span className={TYPE_COLORS[entry.type]}>[{entry.type}]</span>{' '}
              <span>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
