import { TetherClient } from 'tether-ws';
import { getDemoToken } from './mock-auth';

function resolveWsUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001';
  }
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl) return envUrl;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/ws`;
}

let client: TetherClient | null = null;

export function getTetherClient(): TetherClient {
  if (!client) {
    client = new TetherClient({
      url: resolveWsUrl(),
      reconnect: {
        enabled: true,
        baseDelayMs: 300,
        maxDelayMs: 30_000,
        maxAttempts: Infinity,
      },
      heartbeat: {
        enabled: true,
        intervalMs: 15_000,
        timeoutMs: 5_000,
      },
      queue: {
        enabled: true,
        maxSize: 1000,
        overflow: 'drop-oldest',
      },
      backpressure: {
        bufferedAmountHighWaterMark: 64_000,
        inboundBufferSize: 50,
        inboundOverflow: 'drop-oldest',
      },
      auth: {
        getToken: getDemoToken,
        refreshBeforeExpiryMs: 60_000,
      },
    });
  }
  return client;
}

export function sendControl(
  action: 'force-close' | 'set-latency' | 'flood',
  options?: { ms?: number; count?: number },
): void {
  getTetherClient().send(
    {
      type: 'tether:control',
      action,
      ms: options?.ms,
      count: options?.count,
    },
    { channel: 'control' },
  );
}
