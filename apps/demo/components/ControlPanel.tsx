'use client';

import { useState } from 'react';
import { getTetherClient, sendControl } from '@/lib/tether-client';

interface ControlPanelProps {
  onLog: (type: 'info' | 'sent', message: string) => void;
  slowNetwork: boolean;
  onSlowNetworkChange: (enabled: boolean) => void;
}

export function ControlPanel({ onLog, slowNetwork, onSlowNetworkChange }: ControlPanelProps) {
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
    sendControl('flood', { count: 500 });
    onLog('sent', 'Requested server flood (500 inbound messages)');
  };

  const handleAuthRefresh = async () => {
    await getTetherClient().refreshAuth();
    onLog('sent', 'Forced token refresh over open socket');
  };

  const handleQueueWhileDown = () => {
    const client = getTetherClient();
    for (let i = 0; i < 5; i++) {
      client.send({ demo: `offline-${i}` }, { channel: 'demo' });
    }
    onLog('sent', 'Queued 5 demo messages (send while disconnected to see queue drain)');
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <p className="mb-3 text-xs uppercase tracking-wide text-[var(--muted)]">Control panel</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleKill}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium hover:bg-red-500"
        >
          Kill connection now
        </button>
        <button
          type="button"
          onClick={handleSlowToggle}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            slowNetwork ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          {slowNetwork ? 'Disable slow network' : 'Simulate slow network'}
        </button>
        <label className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm">
          Latency ms
          <input
            type="number"
            min={0}
            max={2000}
            step={100}
            value={latencyMs}
            onChange={(e) => setLatencyMs(Number(e.target.value))}
            className="w-20 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1"
          />
        </label>
        <button
          type="button"
          onClick={handleFlood}
          className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium hover:bg-orange-500"
        >
          Flood 500 messages
        </button>
        <button
          type="button"
          onClick={handleAuthRefresh}
          className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-medium hover:bg-cyan-600"
        >
          Force token refresh now
        </button>
        <button
          type="button"
          onClick={handleQueueWhileDown}
          className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-600"
        >
          Queue 5 messages
        </button>
      </div>
    </div>
  );
}
