'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  IconFlood,
  IconKill,
  IconLatency,
  IconQueue,
  IconRefresh,
  IconSlowNetwork,
} from '@/components/ControlIcons';
import { InfoTooltip } from '@/components/InfoTooltip';
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

function ControlButton({
  tooltip,
  className,
  onClick,
  children,
}: {
  tooltip: string;
  className: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="control-btn">
      <button type="button" onClick={onClick} className={`btn ${className}`}>
        {children}
      </button>
      <InfoTooltip text={tooltip} size="xs" placement="below" />
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
        <div className="control-actions control-actions-2">
          <ControlButton
            tooltip="Server force-closes the WebSocket — simulates a sudden network drop."
            className="btn-danger"
            onClick={handleKill}
          >
            <BtnLabel icon={<IconKill className="h-3.5 w-3.5" />}>Kill connection</BtnLabel>
          </ControlButton>
          <ControlButton
            tooltip="Toggles artificial delay on every server response."
            className={`btn-warn ${slowNetwork ? 'btn-warn-active' : ''}`}
            onClick={handleSlowToggle}
          >
            <BtnLabel icon={<IconSlowNetwork className="h-3.5 w-3.5" />}>
              {slowNetwork ? 'Slow network on' : 'Slow network'}
            </BtnLabel>
          </ControlButton>
        </div>
        <div className={`control-field ${slowNetwork ? 'control-field-active' : ''}`}>
          <label className="control-field-label" htmlFor="latency-ms">
            <IconLatency className="control-field-icon" />
            <span>Response latency</span>
            <InfoTooltip
              text="Milliseconds of delay applied to each server response when slow network is on."
              size="xs"
              placement="above"
            />
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
          <ControlButton
            tooltip="Server pushes 500 rapid messages — watch Inbound flood and backpressure events."
            className="btn-orange"
            onClick={handleFlood}
          >
            <BtnLabel icon={<IconFlood className="h-3.5 w-3.5" />}>Flood 500 msgs</BtnLabel>
          </ControlButton>
          <ControlButton
            tooltip="Sends 5 messages while disconnected — they queue and flush in order on reconnect."
            className="btn-ghost"
            onClick={handleQueueWhileDown}
          >
            <BtnLabel icon={<IconQueue className="h-3.5 w-3.5" />}>Queue 5 msgs</BtnLabel>
          </ControlButton>
        </div>
      </section>

      <section className="control-group">
        <header className="control-group-header">
          <h3 className="control-group-title">Auth</h3>
          <p className="control-group-desc">Refresh token over the open socket</p>
        </header>
        <div className="control-actions">
          <ControlButton
            tooltip="Calls refreshAuth() over the live socket without reconnecting."
            className="btn-accent"
            onClick={handleAuthRefresh}
          >
            <BtnLabel icon={<IconRefresh className="h-3.5 w-3.5" />}>Force token refresh</BtnLabel>
          </ControlButton>
        </div>
      </section>
    </div>
  );
}
