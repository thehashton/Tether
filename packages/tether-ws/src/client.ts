import { AuthManager } from './auth.js';
import { BackoffCalculator } from './backoff.js';
import { createBackpressureManagers } from './backpressure.js';
import { Emitter } from './emitter.js';
import { HEARTBEAT_CLOSE_CODE, HeartbeatManager } from './heartbeat.js';
import { Multiplexer, serializeEnvelope } from './multiplex.js';
import { OutboundQueue } from './queue.js';
import { StateMachine } from './state-machine.js';
import type {
  ChannelEnvelope,
  QueuedMessage,
  TetherClientOptions,
  TetherEventName,
  TetherEvents,
  TetherPongMessage,
  TetherState,
  TetherWireMessage,
} from './types.js';
import { isChannelEnvelope, isTetherWireMessage, resolveOptions } from './types.js';

export class TetherClient {
  private readonly options: ReturnType<typeof resolveOptions>;
  private readonly emitter = new Emitter();
  private readonly stateMachine = new StateMachine();
  private readonly backoff: BackoffCalculator;
  private readonly queue: OutboundQueue;
  private readonly multiplexer = new Multiplexer();
  private readonly backpressure: ReturnType<typeof createBackpressureManagers>;

  private socket: WebSocket | null = null;
  private heartbeat: HeartbeatManager | null = null;
  private auth: AuthManager | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private explicitDisconnect = false;
  private flushing = false;

  constructor(rawOptions: TetherClientOptions) {
    this.options = resolveOptions(rawOptions);
    this.backoff = new BackoffCalculator(this.options.reconnect);
    this.queue = new OutboundQueue(this.options.queue);
    this.backpressure = createBackpressureManagers(this.options.backpressure, {
      onOutboundBackpressure: (event) => this.emitter.emit('backpressure', event),
      onInboundBackpressure: (event) => this.emitter.emit('backpressure', event),
      onInboundMessage: (payload) => {
        this.emitter.emit('message', payload);
      },
    });

    if (this.options.auth) {
      this.auth = new AuthManager(this.options.auth, {
        onAuthRefreshed: (token) => this.emitter.emit('auth-refreshed', { token }),
        onError: (error) => this.emitter.emit('error', error),
        sendAuth: (message) => this.sendRaw(JSON.stringify(message)),
      });
    }
  }

  get state(): TetherState {
    return this.stateMachine.state;
  }

  get bufferedAmount(): number {
    return this.socket?.bufferedAmount ?? 0;
  }

  get queueDepth(): number {
    return this.queue.size;
  }

  get reconnectAttempt(): number {
    return this.backoff.currentAttempt;
  }

  on<K extends TetherEventName>(event: K, handler: (payload: TetherEvents[K]) => void): () => void {
    return this.emitter.on(event, handler);
  }

  connect(): void {
    if (this.state === 'closed') {
      this.stateMachine.reset();
    }
    if (this.state === 'open' || this.state === 'connecting') {
      return;
    }
    this.explicitDisconnect = false;
    this.openSocket();
  }

  disconnect(): void {
    this.explicitDisconnect = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.auth?.stop();

    if (this.socket) {
      const ws = this.socket;
      this.socket = null;
      ws.close(1000, 'Client disconnect');
    }

    this.transitionTo('closed');
  }

  send(payload: unknown, options?: { channel?: string }): void {
    const channel = options?.channel ?? 'default';

    if (this.state === 'open' && this.socket?.readyState === WebSocket.OPEN) {
      const envelope = this.multiplexer.createEnvelope(channel, 'data', payload);
      this.sendRaw(serializeEnvelope(envelope));
      return;
    }

    if (!this.options.queue.enabled) {
      return;
    }

    const result = this.queue.enqueue(payload, channel);
    if (result.ok) {
      this.emitter.emit('queued', result.message);
    }
  }

  subscribe(channel: string, handler: (payload: unknown) => void): () => void {
    const unsubscribe = this.multiplexer.subscribe(channel, handler);

    if (this.state === 'open') {
      const envelope = this.multiplexer.createEnvelope(channel, 'subscribe');
      this.sendRaw(serializeEnvelope(envelope));
    }

    return () => {
      unsubscribe();
      if (this.state === 'open') {
        const envelope = this.multiplexer.createEnvelope(channel, 'unsubscribe');
        this.sendRaw(serializeEnvelope(envelope));
      }
    };
  }

  async refreshAuth(): Promise<void> {
    await this.auth?.refreshNow();
  }

  private openSocket(): void {
    this.clearReconnectTimer();
    this.transitionTo('connecting');

    const { WebSocketImpl, url, protocols } = this.options;
    const ws =
      protocols.length > 0
        ? new WebSocketImpl(url, protocols)
        : new WebSocketImpl(url);

    this.socket = ws;

    ws.addEventListener('open', () => this.handleOpen());
    ws.addEventListener('message', (event) => this.handleMessage(event));
    ws.addEventListener('close', (event) => this.handleClose(event));
    ws.addEventListener('error', () => {
      this.emitter.emit('error', new Error('WebSocket error'));
    });
  }

  private async handleOpen(): Promise<void> {
    this.backoff.reset();
    this.transitionTo('open');
    this.emitter.emit('open', undefined);

    if (this.auth) {
      await this.auth.authenticate();
    }

    this.startHeartbeat();
    await this.flushQueue();
  }

  private handleMessage(event: MessageEvent): void {
    let parsed: unknown;
    try {
      parsed = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch {
      this.backpressure.inbound.push(event.data);
      return;
    }

    if (isTetherWireMessage(parsed)) {
      if (this.handleTetherMessage(parsed)) {
        return;
      }
    }

    if (isChannelEnvelope(parsed)) {
      this.multiplexer.route(parsed);
      this.backpressure.inbound.push(parsed);
      return;
    }

    this.backpressure.inbound.push(parsed);
  }

  private handleTetherMessage(message: TetherWireMessage): boolean {
    if (message.type === 'tether:pong') {
      this.heartbeat?.handlePong(message as TetherPongMessage);
      return true;
    }
    if (message.type === 'tether:ping') {
      this.sendRaw(JSON.stringify({ type: 'tether:pong', ts: message.ts }));
      return true;
    }
    return false;
  }

  private handleClose(event: CloseEvent): void {
    this.stopHeartbeat();
    this.socket = null;

    this.emitter.emit('close', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });

    if (this.explicitDisconnect) {
      this.transitionTo('closed');
      return;
    }

    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.options.reconnect.enabled) {
      this.transitionTo('closed');
      return;
    }

    if (!this.backoff.hasAttemptsRemaining()) {
      this.transitionTo('closed');
      return;
    }

    const attempt = this.backoff.increment();
    const delayMs = this.backoff.nextDelay();

    this.transitionTo('reconnecting');
    this.emitter.emit('reconnecting', { attempt, delayMs });

    this.reconnectTimer = setTimeout(() => {
      this.openSocket();
    }, delayMs);
  }

  private async flushQueue(): Promise<void> {
    if (this.flushing || !this.options.queue.enabled) return;
    this.flushing = true;

    try {
      while (this.queue.size > 0 && this.socket?.readyState === WebSocket.OPEN) {
        const item = this.queue.shift();
        if (!item) break;

        await this.backpressure.outbound.waitForDrain(this.socket);
        const envelope = this.multiplexer.createEnvelope(
          item.channel ?? 'default',
          'data',
          item.payload,
          item.id,
        );
        this.sendRaw(serializeEnvelope(envelope));
        this.emitter.emit('flushed', item);
      }
    } finally {
      this.flushing = false;
    }
  }

  private startHeartbeat(): void {
    if (!this.options.heartbeat.enabled) return;

    this.stopHeartbeat();
    this.heartbeat = new HeartbeatManager(
      this.options.heartbeat.intervalMs,
      this.options.heartbeat.timeoutMs,
      {
        onPing: (message) => this.sendRaw(JSON.stringify(message)),
        onTimeout: () => {
          this.socket?.close(HEARTBEAT_CLOSE_CODE, 'Heartbeat timeout');
        },
      },
    );
    this.heartbeat.start();
  }

  private stopHeartbeat(): void {
    this.heartbeat?.stop();
    this.heartbeat = null;
  }

  private sendRaw(data: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private transitionTo(to: TetherState): void {
    const change = this.stateMachine.transition(to);
    if (change) {
      this.emitter.emit('statechange', change);
    }
  }
}

export type { ChannelEnvelope, QueuedMessage, TetherClientOptions, TetherEvents, TetherState };
