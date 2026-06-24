'use client';

import { useState } from 'react';
import { getTetherClient, sendControl } from '@/lib/tether-client';

interface ControlPanelProps {
  onLog: (type: 'info' | 'sent', message: string) => void;
  onFloodStart: (count: number) => void;
  slowNetwork: boolean;
  onSlowNetworkChange: (enabled: boolean) => void;
}

export function ControlPanel({
  onLog,
  onFloodStart,
  slowNetwork,
  onSlowNetworkChange,
}: ControlPanelProps) {
  const [latencyMs, setLatencyMs] = useState(1000);

  const handleKill = () => {
    sendControl('force-close');
    onLog('sent', 'Requested server force-close (simulate network drop)');
  };

  const handleSlowToggle = () => {
    const next = !slowNetwork;
    const ms = next ? latencyMs : 0;
    sendControl('set-latency', { ms });
    onSlowNetworkChange(next);
    onLog('sent', `Set server latency to ${ms}ms`);
  };

  const handleFlood = () => {
    const count = 500;
    const client = getTetherClient();
    onFloodStart(count);

    if (client.state !== 'open') {
      onLog(
        'info',
        `Connection is ${client.state} — flood command queued; will run after reconnect`,
      );
    } else {
      onLog(
        'info',
        `Sending flood command — server will push ${count} messages (watch Inbound flood counter, not 500 log lines)`,
      );
    }

    sendControl('flood', { count });
  };

  const handleAuthRefresh = async () => {
    await getTetherClient().refreshAuth();
    onLog('sent', 'Forced token refresh over open socket');
  };

  const handleQueueWhileDown = () => {
    const client = getTetherClient();
    if (client.state === 'open') {
      onLog(
        'info',
        'Connection is open — messages send immediately. Kill the connection first to see them queue.',
      );
    }
    for (let i = 0; i < 5; i++) {
      client.send({ demo: `offline-${i}` }, { channel: 'demo' });
    }
    if (client.state !== 'open') {
      onLog('sent', 'Queued 5 demo messages — will replay in order on reconnect');
    } else {
      onLog('sent', 'Sent 5 demo messages on open connection');
    }
  };

  return (
    <div className="panel flex h-full min-h-[28rem] flex-1 flex-col p-5 lg:min-h-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs font-medium text-[var(--muted)]">Connection</span>
          <button type="button" onClick={handleKill} className="btn btn-danger">
            Kill connection
          </button>
          <button
            type="button"
            onClick={handleSlowToggle}
            className={`btn btn-warn ${slowNetwork ? 'btn-warn-active' : ''}`}
          >
            {slowNetwork ? 'Disable slow network' : 'Simulate slow network'}
          </button>
          <label className="btn btn-ghost flex cursor-pointer items-center gap-2">
            Latency
            <input
              type="number"
              min={0}
              max={2000}
              step={100}
              value={latencyMs}
              onChange={(e) => setLatencyMs(Number(e.target.value))}
              className="w-16 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-center text-sm tabular-nums"
            />
            <span className="text-[var(--muted)]">ms</span>
          </label>
        </div>

        <div className="h-px bg-[var(--border)]" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs font-medium text-[var(--muted)]">Stress test</span>
          <button type="button" onClick={handleFlood} className="btn btn-orange">
            Flood 500 messages
          </button>
          <button type="button" onClick={handleQueueWhileDown} className="btn btn-ghost">
            Queue 5 messages
          </button>
        </div>

        <div className="h-px bg-[var(--border)]" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs font-medium text-[var(--muted)]">Auth</span>
          <button type="button" onClick={handleAuthRefresh} className="btn btn-accent">
            Force token refresh
          </button>
        </div>
      </div>
    </div>
  );
}
