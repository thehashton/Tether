'use client';

import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import {
  IconFlood,
  IconKill,
  IconLatency,
  IconQueue,
  IconRefresh,
  IconSlowNetwork,
} from '@/components/ControlIcons';
import { getTetherClient, sendControl } from '@/lib/tether-client';

interface ControlPanelProps {
  onLog: (type: 'info' | 'sent', message: string) => void;
  onFloodStart: (count: number) => void;
  slowNetwork: boolean;
  onSlowNetworkChange: (enabled: boolean) => void;
}

function BtnLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="btn-label">
      <span className="btn-icon">{icon}</span>
      <span>{children}</span>
    </span>
  );
}

function ControlAction({
  hint,
  className,
  onClick,
  children,
}: {
  hint: string;
  className: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const hintId = useId();
  return (
    <div className="control-action">
      <button
        type="button"
        onClick={onClick}
        className={`btn ${className}`}
        aria-describedby={hintId}
      >
        {children}
      </button>
      <p id={hintId} className="control-action-hint">
        {hint}
      </p>
    </div>
  );
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
    <div className="control-panel">
      <section className="control-group">
        <header className="control-group-header">
          <h3 className="control-group-title">Connection</h3>
          <p className="control-group-desc">Force a drop or add server-side latency</p>
        </header>
        <div className="control-actions">
          <ControlAction
            hint="Server force-closes the WebSocket — simulates a sudden network drop."
            className="btn-danger"
            onClick={handleKill}
          >
            <BtnLabel icon={<IconKill className="h-5 w-5" />}>Kill connection</BtnLabel>
          </ControlAction>
          <ControlAction
            hint="Toggles artificial delay on every server response."
            className={`btn-warn ${slowNetwork ? 'btn-warn-active' : ''}`}
            onClick={handleSlowToggle}
          >
            <BtnLabel icon={<IconSlowNetwork className="h-5 w-5" />}>
              {slowNetwork ? 'Slow network on' : 'Slow network'}
            </BtnLabel>
          </ControlAction>
        </div>
        <div className={`control-field ${slowNetwork ? 'control-field-active' : ''}`}>
          <label className="control-field-label" htmlFor="latency-ms">
            <IconLatency className="control-field-icon" aria-hidden />
            <span>Response latency</span>
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
              aria-describedby="latency-hint"
            />
            <span className="control-field-suffix">ms</span>
          </div>
        </div>
        <p id="latency-hint" className="control-field-hint">
          Milliseconds of delay applied to each server response when slow network is on.
        </p>
      </section>

      <section className="control-group">
        <header className="control-group-header">
          <h3 className="control-group-title">Stress test</h3>
          <p className="control-group-desc">Exercise backpressure and outbound queueing</p>
        </header>
        <div className="control-actions">
          <ControlAction
            hint="Server pushes 500 rapid messages — watch Inbound flood and backpressure events."
            className="btn-orange"
            onClick={handleFlood}
          >
            <BtnLabel icon={<IconFlood className="h-5 w-5" />}>Flood 500 msgs</BtnLabel>
          </ControlAction>
          <ControlAction
            hint="Sends 5 messages while disconnected — they queue and flush in order on reconnect."
            className="btn-ghost"
            onClick={handleQueueWhileDown}
          >
            <BtnLabel icon={<IconQueue className="h-5 w-5" />}>Queue 5 msgs</BtnLabel>
          </ControlAction>
        </div>
      </section>

      <section className="control-group">
        <header className="control-group-header">
          <h3 className="control-group-title">Auth</h3>
          <p className="control-group-desc">Refresh token over the open socket</p>
        </header>
        <div className="control-actions">
          <ControlAction
            hint="Calls refreshAuth() over the live socket without reconnecting."
            className="btn-accent"
            onClick={handleAuthRefresh}
          >
            <BtnLabel icon={<IconRefresh className="h-5 w-5" />}>Force token refresh</BtnLabel>
          </ControlAction>
        </div>
      </section>
    </div>
  );
}
