export type TetherState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

export type OverflowStrategy = 'drop-oldest' | 'drop-newest' | 'reject';

export type InboundOverflowStrategy = 'drop-oldest' | 'sample-oldest';

export interface ReconnectOptions {
  enabled?: boolean;
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxAttempts?: number;
}

export interface HeartbeatOptions {
  enabled?: boolean;
  intervalMs?: number;
  timeoutMs?: number;
}

export interface QueueOptions {
  enabled?: boolean;
  maxSize?: number;
  overflow?: OverflowStrategy;
}

export interface BackpressureOptions {
  bufferedAmountHighWaterMark?: number;
  inboundBufferSize?: number;
  inboundOverflow?: InboundOverflowStrategy;
}

export interface AuthOptions {
  getToken: () => Promise<string>;
  refreshBeforeExpiryMs?: number;
  /** Milliseconds until token expiry; used when getToken does not embed expiry. */
  tokenTtlMs?: number;
}

export interface TetherClientOptions {
  url: string;
  protocols?: string | string[];
  WebSocketImpl?: typeof WebSocket;
  reconnect?: ReconnectOptions;
  heartbeat?: HeartbeatOptions;
  queue?: QueueOptions;
  backpressure?: BackpressureOptions;
  auth?: AuthOptions;
}

export interface QueuedMessage {
  id: string;
  payload: unknown;
  channel?: string;
  enqueuedAt: number;
}

export type EnvelopeType = 'data' | 'subscribe' | 'unsubscribe';

export interface ChannelEnvelope {
  channel: string;
  type: EnvelopeType;
  payload?: unknown;
  id?: string;
}

export interface TetherPingMessage {
  type: 'tether:ping';
  ts: number;
}

export interface TetherPongMessage {
  type: 'tether:pong';
  ts: number;
}

export interface TetherAuthMessage {
  type: 'tether:auth';
  token: string;
}

export type TetherWireMessage =
  | TetherPingMessage
  | TetherPongMessage
  | TetherAuthMessage
  | ChannelEnvelope;

export interface ReconnectingEvent {
  attempt: number;
  delayMs: number;
}

export interface StateChangeEvent {
  from: TetherState;
  to: TetherState;
}

export interface BackpressureEvent {
  depth: number;
  direction: 'inbound' | 'outbound';
}

export interface TetherEvents {
  open: void;
  close: CloseEvent | { code: number; reason: string; wasClean: boolean };
  message: unknown;
  reconnecting: ReconnectingEvent;
  queued: QueuedMessage;
  flushed: QueuedMessage;
  backpressure: BackpressureEvent;
  statechange: StateChangeEvent;
  'auth-refreshed': { token: string };
  error: Error;
}

export type TetherEventName = keyof TetherEvents;

export interface ResolvedReconnectOptions {
  enabled: boolean;
  baseDelayMs: number;
  maxDelayMs: number;
  maxAttempts: number;
}

export interface ResolvedHeartbeatOptions {
  enabled: boolean;
  intervalMs: number;
  timeoutMs: number;
}

export interface ResolvedQueueOptions {
  enabled: boolean;
  maxSize: number;
  overflow: OverflowStrategy;
}

export interface ResolvedBackpressureOptions {
  bufferedAmountHighWaterMark: number;
  inboundBufferSize: number;
  inboundOverflow: InboundOverflowStrategy;
}

export interface ResolvedOptions {
  url: string;
  protocols: string | string[];
  WebSocketImpl: typeof WebSocket;
  reconnect: ResolvedReconnectOptions;
  heartbeat: ResolvedHeartbeatOptions;
  queue: ResolvedQueueOptions;
  backpressure: ResolvedBackpressureOptions;
  auth?: AuthOptions;
}

export const DEFAULT_RECONNECT: ResolvedReconnectOptions = {
  enabled: true,
  baseDelayMs: 300,
  maxDelayMs: 30_000,
  maxAttempts: Infinity,
};

export const DEFAULT_HEARTBEAT: ResolvedHeartbeatOptions = {
  enabled: true,
  intervalMs: 15_000,
  timeoutMs: 5_000,
};

export const DEFAULT_QUEUE: ResolvedQueueOptions = {
  enabled: true,
  maxSize: 1000,
  overflow: 'drop-oldest',
};

export const DEFAULT_BACKPRESSURE: ResolvedBackpressureOptions = {
  bufferedAmountHighWaterMark: 1_000_000,
  inboundBufferSize: 100,
  inboundOverflow: 'drop-oldest',
};

export function resolveOptions(options: TetherClientOptions): ResolvedOptions {
  return {
    url: options.url,
    protocols: options.protocols ?? [],
    WebSocketImpl: options.WebSocketImpl ?? WebSocket,
    reconnect: { ...DEFAULT_RECONNECT, ...options.reconnect },
    heartbeat: { ...DEFAULT_HEARTBEAT, ...options.heartbeat },
    queue: { ...DEFAULT_QUEUE, ...options.queue },
    backpressure: { ...DEFAULT_BACKPRESSURE, ...options.backpressure },
    auth: options.auth,
  };
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function isTetherWireMessage(value: unknown): value is TetherWireMessage {
  return typeof value === 'object' && value !== null && 'type' in value;
}

export function isChannelEnvelope(value: unknown): value is ChannelEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.channel !== 'string' || typeof obj.type !== 'string') return false;
  return obj.type === 'data' || obj.type === 'subscribe' || obj.type === 'unsubscribe';
}
