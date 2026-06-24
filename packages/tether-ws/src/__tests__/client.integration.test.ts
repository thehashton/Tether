import { WebSocket, WebSocketServer } from 'ws';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TetherClient } from '../client.js';

let wss: WebSocketServer;
let port: number;
const serverSockets: InstanceType<typeof WebSocket>[] = [];

function makeToken(exp: number): string {
  return Buffer.from(JSON.stringify({ exp })).toString('base64');
}

function waitForState(client: TetherClient, state: string, timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (client.state === state) {
      resolve();
      return;
    }
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for state ${state}`)), timeoutMs);
    const unsub = client.on('statechange', ({ to }) => {
      if (to === state) {
        clearTimeout(timer);
        unsub();
        resolve();
      }
    });
  });
}

beforeAll(async () => {
  wss = new WebSocketServer({ port: 0 });
  await new Promise<void>((resolve) => wss.on('listening', resolve));
  const address = wss.address();
  if (typeof address === 'object' && address) {
    port = address.port;
  } else {
    throw new Error('Failed to get server port');
  }

  wss.on('connection', (ws) => {
    serverSockets.push(ws);
    ws.on('close', () => {
      const idx = serverSockets.indexOf(ws);
      if (idx >= 0) serverSockets.splice(idx, 1);
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'tether:ping') {
          ws.send(JSON.stringify({ type: 'tether:pong', ts: msg.ts }));
          return;
        }
        if (msg.type === 'tether:auth') {
          const decoded = JSON.parse(Buffer.from(msg.token, 'base64').toString());
          if (decoded.exp > Date.now()) {
            ws.send(JSON.stringify({ type: 'tether:auth-ok' }));
          }
          return;
        }
        if (msg.channel && msg.type === 'data') {
          ws.send(JSON.stringify(msg));
        }
      } catch {
        // ignore
      }
    });
  });
});

afterAll(async () => {
  for (const client of wss.clients) {
    client.terminate();
  }
  await new Promise<void>((resolve, reject) => {
    wss.close((err) => (err ? reject(err) : resolve()));
  });
}, 15000);

beforeEach(() => {
  vi.useRealTimers();
  for (const ws of [...serverSockets]) {
    ws.close();
  }
});

describe('TetherClient integration', () => {
  it(
    'flushes queue in order after server-side close',
    async () => {
      const received: unknown[] = [];
      const client = new TetherClient({
        url: `ws://127.0.0.1:${port}`,
        WebSocketImpl: WebSocket as unknown as typeof globalThis.WebSocket,
        reconnect: { enabled: true, baseDelayMs: 50, maxDelayMs: 200 },
        heartbeat: { enabled: false },
        auth: undefined,
      });

      client.subscribe('default', (payload) => received.push(payload));

      try {
        client.connect();
        await waitForState(client, 'open');

        const socket = serverSockets[serverSockets.length - 1];
        expect(socket).toBeDefined();
        socket?.close();

        await new Promise<void>((resolve) => {
          const unsub = client.on('close', () => {
            unsub();
            resolve();
          });
        });

        client.send('queued-1');
        client.send('queued-2');

        await waitForState(client, 'open', 10000);

        await vi.waitFor(
          () => {
            expect(received).toContain('queued-1');
            expect(received).toContain('queued-2');
            expect(received.indexOf('queued-1')).toBeLessThan(received.indexOf('queued-2'));
          },
          { timeout: 10000 },
        );
      } finally {
        client.disconnect();
      }
    },
    15000,
  );

  it('routes multiplexed messages to correct channel', async () => {
    const chat: unknown[] = [];
    const metrics: unknown[] = [];

    const client = new TetherClient({
      url: `ws://127.0.0.1:${port}`,
      WebSocketImpl: WebSocket as unknown as typeof globalThis.WebSocket,
      heartbeat: { enabled: false },
    });

    client.subscribe('chat', (p) => chat.push(p));
    client.subscribe('metrics', (p) => metrics.push(p));

    try {
      client.connect();
      await waitForState(client, 'open');

      client.send('hello', { channel: 'chat' });
      client.send({ cpu: 90 }, { channel: 'metrics' });

      await vi.waitFor(
        () => {
          expect(chat).toContain('hello');
          expect(metrics).toEqual(expect.arrayContaining([{ cpu: 90 }]));
        },
        { timeout: 5000 },
      );
    } finally {
      client.disconnect();
    }
  });

  it('sends auth refresh without close event', async () => {
    const authRefreshed: string[] = [];
    const closeEvents: unknown[] = [];
    let callCount = 0;

    const client = new TetherClient({
      url: `ws://127.0.0.1:${port}`,
      WebSocketImpl: WebSocket as unknown as typeof globalThis.WebSocket,
      heartbeat: { enabled: false },
      auth: {
        getToken: async () => {
          callCount++;
          return makeToken(Date.now() + 300_000);
        },
        refreshBeforeExpiryMs: 60_000,
        tokenTtlMs: 300_000,
      },
    });

    client.on('auth-refreshed', ({ token }) => authRefreshed.push(token));
    client.on('close', (e) => closeEvents.push(e));

    try {
      client.connect();
      await waitForState(client, 'open');

      await client.refreshAuth();

      expect(callCount).toBeGreaterThanOrEqual(2);
      expect(authRefreshed.length).toBeGreaterThanOrEqual(1);
      expect(closeEvents).toHaveLength(0);
    } finally {
      client.disconnect();
    }
  });

  it('heartbeat timeout triggers reconnect', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const reconnecting: number[] = [];
    const client = new TetherClient({
      url: `ws://127.0.0.1:${port}`,
      WebSocketImpl: WebSocket as unknown as typeof globalThis.WebSocket,
      heartbeat: { enabled: true, intervalMs: 100, timeoutMs: 50 },
      reconnect: { enabled: true, baseDelayMs: 50, maxDelayMs: 200 },
    });

    client.on('reconnecting', ({ attempt }) => reconnecting.push(attempt));

    try {
      client.connect();
      await waitForState(client, 'open');

      await vi.advanceTimersByTimeAsync(200);

      await vi.waitFor(
        () => {
          expect(reconnecting.length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
    } finally {
      client.disconnect();
      vi.useRealTimers();
    }
  });
});
