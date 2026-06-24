import type { WebSocket } from 'ws';
import { isDemoTokenValid } from './mock-auth';

export type WsLike = Pick<WebSocket, 'send' | 'close' | 'on'>;

export interface ConnectionState {
  latencyMs: number;
  authenticated: boolean;
}

type TetherControlAction = 'force-close' | 'set-latency' | 'flood';

interface TetherControlMessage {
  type: 'tether:control';
  action: TetherControlAction;
  ms?: number;
  count?: number;
}

interface TetherPingMessage {
  type: 'tether:ping';
  ts: number;
}

interface TetherAuthMessage {
  type: 'tether:auth';
  token: string;
}

interface ChannelEnvelope {
  channel: string;
  type: 'data' | 'subscribe' | 'unsubscribe';
  payload?: unknown;
  id?: string;
}

type IncomingMessage = TetherControlMessage | TetherPingMessage | TetherAuthMessage | ChannelEnvelope;

function parseMessage(data: unknown): IncomingMessage | null {
  try {
    const raw = typeof data === 'string' ? data : data?.toString();
    if (!raw) return null;
    return JSON.parse(raw) as IncomingMessage;
  } catch {
    return null;
  }
}

function sendJson(ws: WsLike, payload: unknown, latencyMs: number): void {
  const send = () => ws.send(JSON.stringify(payload));
  if (latencyMs > 0) {
    setTimeout(send, latencyMs);
  } else {
    send();
  }
}

function handleControl(ws: WsLike, state: ConnectionState, message: TetherControlMessage): void {
  switch (message.action) {
    case 'force-close':
      ws.close(1000, 'Server forced close');
      break;
    case 'set-latency':
      state.latencyMs = Math.max(0, Math.min(2000, message.ms ?? 0));
      sendJson(ws, { type: 'tether:control-ack', action: 'set-latency', ms: state.latencyMs }, 0);
      break;
    case 'flood': {
      const count = Math.max(1, Math.min(1000, message.count ?? 500));
      sendJson(ws, { type: 'tether:control-ack', action: 'flood', count }, 0);
      for (let i = 0; i < count; i++) {
        sendJson(
          ws,
          {
            channel: 'flood',
            type: 'data',
            payload: { index: i, ts: Date.now() },
            id: `flood-${i}`,
          },
          0,
        );
      }
      break;
    }
    default:
      break;
  }
}

export function attachWsHandler(ws: WsLike): ConnectionState {
  const state: ConnectionState = { latencyMs: 0, authenticated: false };

  ws.on('message', (data: unknown) => {
    const message = parseMessage(data);
    if (!message || typeof message !== 'object' || !('type' in message)) return;

    if (message.type === 'tether:ping') {
      sendJson(ws, { type: 'tether:pong', ts: message.ts }, state.latencyMs);
      return;
    }

    if (message.type === 'tether:auth') {
      state.authenticated = isDemoTokenValid(message.token);
      sendJson(
        ws,
        {
          type: 'tether:auth-ok',
          ok: state.authenticated,
        },
        state.latencyMs,
      );
      return;
    }

    if (message.type === 'tether:control') {
      handleControl(ws, state, message);
      return;
    }

    if ('channel' in message && message.type === 'data') {
      const payload = message.payload;
      if (
        payload &&
        typeof payload === 'object' &&
        'type' in payload &&
        (payload as { type: string }).type === 'tether:control'
      ) {
        handleControl(ws, state, payload as TetherControlMessage);
        return;
      }

      sendJson(
        ws,
        {
          channel: message.channel,
          type: 'data',
          payload: message.payload,
          id: message.id,
        },
        state.latencyMs,
      );
    }
  });

  return state;
}
