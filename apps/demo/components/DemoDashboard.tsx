'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TetherState } from 'tether-ws';
import { BackoffMeter } from '@/components/BackoffMeter';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { ControlPanel } from '@/components/ControlPanel';
import { MessageLog, type LogEntry, type LogEntryType } from '@/components/MessageLog';
import { QueueDepth } from '@/components/QueueDepth';
import { getTetherClient } from '@/lib/tether-client';

let logId = 0;

export function DemoDashboard() {
  const [state, setState] = useState<TetherState>('idle');
  const [attempt, setAttempt] = useState(0);
  const [delayMs, setDelayMs] = useState<number | null>(null);
  const [queueDepth, setQueueDepth] = useState(0);
  const [bufferedAmount, setBufferedAmount] = useState(0);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [slowNetwork, setSlowNetwork] = useState(false);

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
        pushLog('backpressure', `${direction} depth ${depth}`);
      }),
      client.on('auth-refreshed', ({ token }) => {
        pushLog('auth-refreshed', `Token refreshed (${token.slice(0, 12)}…)`);
      }),
      client.on('error', (err) => {
        pushLog('error', err.message);
      }),
      client.on('message', (payload) => {
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'type' in payload &&
          ((payload as { type: string }).type === 'tether:ping' ||
            (payload as { type: string }).type === 'tether:pong')
        ) {
          pushLog('heartbeat', JSON.stringify(payload));
          return;
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
        if (index % 100 === 0) {
          pushLog('received', `[flood] index ${index}`);
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
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <header className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight">tether-ws demo</h1>
        <p className="mt-1 text-[var(--muted)]">
          Watch reconnection, backoff, queue drain, bufferedAmount backpressure, multiplexing, and
          auth refresh in real time.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <ConnectionBadge state={state} />
        <BackoffMeter attempt={attempt} delayMs={delayMs} />
        <QueueDepth queueDepth={queueDepth} bufferedAmount={bufferedAmount} />
      </div>

      <ControlPanel
        onLog={(type, message) => pushLog(type, message)}
        slowNetwork={slowNetwork}
        onSlowNetworkChange={setSlowNetwork}
      />

      <MessageLog entries={entries} />
    </div>
  );
}
