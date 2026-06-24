'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TetherState } from 'tether-ws';
import { BackoffMeter } from '@/components/BackoffMeter';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { ControlPanel } from '@/components/ControlPanel';
import { FloodMeter } from '@/components/FloodMeter';
import { MessageLog, type LogEntry, type LogEntryType } from '@/components/MessageLog';
import { QueueDepth } from '@/components/QueueDepth';
import { getTetherClient } from '@/lib/tether-client';

const FEATURES = ['Reconnection', 'Backpressure', 'Multiplexing', 'Auth refresh'] as const;

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
    <div className="page-shell mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="hero">
        <div className="hero-glow" aria-hidden />
        <div className="relative flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Tether"
            width={280}
            height={72}
            priority
            className="h-auto w-[min(280px,85vw)] drop-shadow-[0_0_24px_rgba(61,214,198,0.25)]"
          />
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--muted)]">
            Watch reconnection, backoff, queue drain,{' '}
            <span className="text-[var(--text)]">bufferedAmount</span> backpressure, multiplexing,
            and auth refresh — in real time.
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="feature-pill">
                <span className="feature-pill-dot" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <section>
        <h2 className="section-title">Live metrics</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <ConnectionBadge state={state} />
          <BackoffMeter attempt={attempt} delayMs={delayMs} />
          <QueueDepth queueDepth={queueDepth} bufferedAmount={bufferedAmount} />
          <FloodMeter
            received={floodReceived}
            target={floodTarget}
            backpressureEvents={floodBackpressure}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <div className="flex min-h-0 flex-col">
          <h2 className="section-title">Controls</h2>
          <ControlPanel
            onLog={(type, message) => pushLog(type, message)}
            onFloodStart={handleFloodStart}
            slowNetwork={slowNetwork}
            onSlowNetworkChange={setSlowNetwork}
          />
        </div>

        <div className="flex min-h-0 flex-col">
          <h2 className="section-title">Event log</h2>
          <MessageLog entries={entries} className="min-h-[28rem] flex-1 lg:min-h-0" />
        </div>
      </section>
    </div>
  );
}
