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

const TYPE_CLASS: Record<LogEntryType, string> = {
  sent: 'log-type-sent',
  received: 'log-type-received',
  queued: 'log-type-queued',
  flushed: 'log-type-flushed',
  heartbeat: 'log-type-heartbeat',
  backpressure: 'log-type-backpressure',
  'auth-refreshed': 'log-type-auth-refreshed',
  statechange: 'log-type-statechange',
  reconnecting: 'log-type-reconnecting',
  error: 'log-type-error',
  info: 'log-type-info',
};

interface MessageLogProps {
  entries: LogEntry[];
  className?: string;
}

export function MessageLog({ entries, className = '' }: MessageLogProps) {
  return (
    <div className={`message-log flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}>
      <div className="message-log-header">
        <div className="message-log-dots" aria-hidden>
          <span className="message-log-dot message-log-dot-red" />
          <span className="message-log-dot message-log-dot-amber" />
          <span className="message-log-dot message-log-dot-green" />
        </div>
        <h2 className="message-log-title">Event log</h2>
      </div>
      <div
        className="terminal p-5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="WebSocket event log"
      >
        {entries.length === 0 ? (
          <p className="log-entry log-type-info">Waiting for events…</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="log-entry mb-2 hover:bg-white/[0.02]">
              <span className="log-entry-timestamp">
                {new Date(entry.ts).toLocaleTimeString()}.
                {String(entry.ts % 1000).padStart(3, '0')}
              </span>{' '}
              <span className={`font-semibold ${TYPE_CLASS[entry.type]}`}>[{entry.type}]</span>{' '}
              <span className="log-entry-message">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
