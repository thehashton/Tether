'use client';

import Image from 'next/image';
import type { SVGProps } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TetherState } from 'tether-ws';
import { BackoffMeter } from '@/components/BackoffMeter';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { ControlPanel } from '@/components/ControlPanel';
import { FeaturePill } from '@/components/FeaturePill';
import { FloodMeter } from '@/components/FloodMeter';
import { MessageLog, type LogEntry, type LogEntryType } from '@/components/MessageLog';
import { QueueDepth } from '@/components/QueueDepth';
import { getTetherClient } from '@/lib/tether-client';

const FEATURES = [
  {
    label: 'Reconnection',
    tooltip: 'Automatic reconnect with exponential backoff and jitter after a drop.',
  },
  {
    label: 'Backpressure',
    tooltip: 'Pauses outbound sends when socket.bufferedAmount crosses a threshold.',
  },
  {
    label: 'Multiplexing',
    tooltip: 'Route messages across named channels over a single WebSocket.',
  },
  {
    label: 'Auth refresh',
    tooltip: 'Refresh credentials in-band without tearing down the connection.',
  },
] as const;
const GITHUB_REPO_URL = 'https://github.com/thehashton/Tether';

function IconGithub(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68.01 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

let logId = 0;

export function DemoDashboard() {
  const [state, setState] = useState<TetherState>('idle');
  const [attempt, setAttempt] = useState(0);
  const [delayMs, setDelayMs] = useState<number | null>(null);
  const [queueDepth, setQueueDepth] = useState(0);
  const [bufferedAmount, setBufferedAmount] = useState(0);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [floodReceived, setFloodReceived] = useState(0);
  const [floodTarget, setFloodTarget] = useState<number | null>(null);
  const [floodBackpressure, setFloodBackpressure] = useState(0);
  const floodTargetRef = useRef<number | null>(null);

  const handleFloodStart = useCallback((count: number) => {
    floodTargetRef.current = count;
    setFloodReceived(0);
    setFloodTarget(count);
    setFloodBackpressure(0);
  }, []);

  const pushLog = useCallback((type: LogEntryType, message: string, detail?: unknown) => {
    setEntries((prev) => [
      { id: String(++logId), ts: Date.now(), type, message, detail },
      ...prev.slice(0, 199),
    ]);
  }, []);

  useEffect(() => {
    const client = getTetherClient();
    setState(client.state);

    const unsubs = [
      client.on('statechange', ({ from, to }) => {
        setState(to);
        pushLog('statechange', `${from} → ${to}`);
      }),
      client.on('open', () => {
        pushLog('info', 'Connection open');
        client.send({ hello: 'demo' }, { channel: 'demo' });
      }),
      client.on('close', (event) => {
        pushLog('info', `Connection closed (code ${event.code})`);
      }),
      client.on('reconnecting', ({ attempt: a, delayMs: d }) => {
        setAttempt(a);
        setDelayMs(d);
        pushLog('reconnecting', `Attempt ${a}, next retry in ${d}ms`);
      }),
      client.on('queued', (msg) => {
        setQueueDepth(client.queueDepth);
        pushLog('queued', `Message ${msg.id} queued`, msg);
      }),
      client.on('flushed', (msg) => {
        setQueueDepth(client.queueDepth);
        pushLog('flushed', `Replayed ${msg.id} from queue`, msg);
      }),
      client.on('backpressure', ({ depth, direction }) => {
        if (direction === 'inbound') {
          setFloodBackpressure((n) => n + 1);
        }
        pushLog('backpressure', `${direction} depth ${depth}`);
      }),
      client.on('auth-refreshed', ({ token }) => {
        pushLog('auth-refreshed', `Token refreshed (${token.slice(0, 12)}…)`);
      }),
      client.on('error', (err) => {
        pushLog('error', err.message);
      }),
      client.on('message', (payload) => {
        if (typeof payload === 'object' && payload !== null && 'type' in payload) {
          const wire = payload as { type: string; action?: string; count?: number };
          if (wire.type === 'tether:ping' || wire.type === 'tether:pong') {
            pushLog('heartbeat', JSON.stringify(payload));
            return;
          }
          if (wire.type === 'tether:control-ack' && wire.action === 'flood' && wire.count) {
            floodTargetRef.current = wire.count;
            setFloodTarget(wire.count);
            setFloodReceived(0);
            pushLog('info', `Server acknowledged flood — sending ${wire.count} messages`);
            return;
          }
        }
        pushLog('received', JSON.stringify(payload));
      }),
    ];

    client.subscribe('demo', (payload) => {
      pushLog('received', `[demo] ${JSON.stringify(payload)}`);
    });

    client.subscribe('flood', (payload) => {
      if (typeof payload === 'object' && payload !== null && 'index' in payload) {
        const index = (payload as { index: number }).index;
        const target = floodTargetRef.current;
        setFloodReceived((prev) => prev + 1);
        if (index === 0) {
          pushLog('received', `[flood] started (index 0)`);
        } else if (index % 100 === 0) {
          pushLog('received', `[flood] milestone index ${index}`);
        }
        if (target !== null && index === target - 1) {
          pushLog('info', `[flood] complete — ${target} messages received`);
        }
      }
    });

    client.connect();

    const metricsTimer = setInterval(() => {
      setQueueDepth(client.queueDepth);
      setBufferedAmount(client.bufferedAmount);
    }, 250);

    return () => {
      clearInterval(metricsTimer);
      unsubs.forEach((u) => u());
      client.disconnect();
    };
  }, [pushLog]);

  return (
    <div id="main-content" className="page-shell mx-auto flex max-w-7xl flex-col gap-7 px-4 py-8 sm:px-6 sm:py-10">
      <header className="hero">
        <div className="hero-glow" aria-hidden />
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hero-github-btn"
          aria-label="View Tether on GitHub"
        >
          <IconGithub className="h-6 w-6" />
        </a>
        <div className="relative flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Tether"
            width={280}
            height={72}
            priority
            className="h-auto w-[min(280px,85vw)] drop-shadow-[0_0_24px_rgba(61,214,198,0.25)]"
          />
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
            Watch reconnection, backoff, queue drain,{' '}
            <span className="text-[var(--text)]">bufferedAmount</span> backpressure, multiplexing,
            and auth refresh — in real time.
          </p>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {FEATURES.map((feature) => (
              <FeaturePill key={feature.label} label={feature.label} tooltip={feature.tooltip} />
            ))}
          </ul>
        </div>
      </header>

      <section>
        <div className="metrics-panel-body panel">
          <h2 className="dashboard-split-title">Live metrics</h2>
          <div className="metrics-grid">
            <ConnectionBadge state={state} />
            <BackoffMeter attempt={attempt} delayMs={delayMs} />
            <QueueDepth queueDepth={queueDepth} bufferedAmount={bufferedAmount} />
            <FloodMeter
              received={floodReceived}
              target={floodTarget}
              backpressureEvents={floodBackpressure}
            />
          </div>
        </div>
      </section>

      <section className="dashboard-split">
        <div className="dashboard-split-body panel">
          <div className="dashboard-split-pane">
            <h2 className="dashboard-split-title">Controls</h2>
            <ControlPanel
              onLog={(type, message) => pushLog(type, message)}
              onFloodStart={handleFloodStart}
              slowNetwork={slowNetwork}
              onSlowNetworkChange={setSlowNetwork}
            />
          </div>
          <div className="dashboard-split-pane">
            <MessageLog entries={entries} className="flex-1" />
          </div>
        </div>
      </section>
    </div>
  );
}
