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
        `Sending flood command — server will push ${count} messages (watch Inbound flood counter)`,
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
    <div className="control-panel panel">
      <section className="control-group">
        <header className="control-group-header">
          <h3 className="control-group-title">Connection</h3>
          <p className="control-group-desc">Force a drop or add server-side latency</p>
        </header>
        <div className="control-actions control-actions-2">
          <button type="button" onClick={handleKill} className="btn btn-danger">
            Kill connection
          </button>
          <button
            type="button"
            onClick={handleSlowToggle}
            className={`btn btn-warn ${slowNetwork ? 'btn-warn-active' : ''}`}
          >
            {slowNetwork ? 'Slow network on' : 'Slow network'}
          </button>
        </div>
        <div className={`control-field ${slowNetwork ? 'control-field-active' : ''}`}>
          <label className="control-field-label" htmlFor="latency-ms">
            Response latency
          </label>
          <div className="control-field-input">
            <input
              id="latency-ms"
              type="number"
              min={0}
              max={2000}
              step={100}
              value={latencyMs}
              onChange={(e) => setLatencyMs(Number(e.target.value))}
              className="control-input"
            />
            <span className="control-field-suffix">ms</span>
          </div>
        </div>
      </section>

      <section className="control-group">
        <header className="control-group-header">
          <h3 className="control-group-title">Stress test</h3>
          <p className="control-group-desc">Exercise backpressure and outbound queueing</p>
        </header>
        <div className="control-actions control-actions-2">
          <button type="button" onClick={handleFlood} className="btn btn-orange">
            Flood 500 msgs
          </button>
          <button type="button" onClick={handleQueueWhileDown} className="btn btn-ghost">
            Queue 5 msgs
          </button>
        </div>
      </section>

      <section className="control-group">
        <header className="control-group-header">
          <h3 className="control-group-title">Auth</h3>
          <p className="control-group-desc">Refresh token over the open socket</p>
        </header>
        <div className="control-actions">
          <button type="button" onClick={handleAuthRefresh} className="btn btn-accent">
            Force token refresh
          </button>
        </div>
      </section>
    </div>
  );
}
