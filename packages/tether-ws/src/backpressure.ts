import type { BackpressureEvent, InboundOverflowStrategy, ResolvedBackpressureOptions } from './types.js';

export interface OutboundBackpressureCallbacks {
  onBackpressure: (event: BackpressureEvent) => void;
}

export class OutboundBackpressure {
  constructor(
    private readonly highWaterMark: number,
    private readonly callbacks: OutboundBackpressureCallbacks,
  ) {}

  async waitForDrain(socket: WebSocket, pollMs = 50): Promise<void> {
    while (socket.bufferedAmount > this.highWaterMark) {
      this.callbacks.onBackpressure({
        depth: socket.bufferedAmount,
        direction: 'outbound',
      });
      await sleep(pollMs);
    }
  }
}

export interface InboundBackpressureCallbacks {
  onBackpressure: (event: BackpressureEvent) => void;
  onMessage: (payload: unknown) => void | Promise<void>;
}

export class InboundBackpressure {
  private buffer: unknown[] = [];
  private processing = false;

  constructor(
    private readonly options: ResolvedBackpressureOptions,
    private readonly callbacks: InboundBackpressureCallbacks,
  ) {}

  get depth(): number {
    return this.buffer.length;
  }

  push(payload: unknown): void {
    if (this.buffer.length >= this.options.inboundBufferSize) {
      this.applyOverflow();
      this.callbacks.onBackpressure({
        depth: this.buffer.length,
        direction: 'inbound',
      });
    }
    this.buffer.push(payload);
    void this.process();
  }

  clear(): void {
    this.buffer = [];
  }

  private applyOverflow(): void {
    const strategy: InboundOverflowStrategy = this.options.inboundOverflow;
    if (strategy === 'drop-oldest') {
      this.buffer.shift();
    } else if (strategy === 'sample-oldest') {
      this.buffer.shift();
      this.buffer.shift();
    }
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.buffer.length > 0) {
      const payload = this.buffer.shift();
      if (payload === undefined) break;
      try {
        await this.callbacks.onMessage(payload);
      } catch {
        // Continue processing remaining messages
      }
    }

    this.processing = false;

    if (this.buffer.length > 0) {
      void this.process();
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createBackpressureManagers(
  options: ResolvedBackpressureOptions,
  callbacks: {
    onOutboundBackpressure: (event: BackpressureEvent) => void;
    onInboundBackpressure: (event: BackpressureEvent) => void;
    onInboundMessage: (payload: unknown) => void | Promise<void>;
  },
): { outbound: OutboundBackpressure; inbound: InboundBackpressure } {
  return {
    outbound: new OutboundBackpressure(options.bufferedAmountHighWaterMark, {
      onBackpressure: callbacks.onOutboundBackpressure,
    }),
    inbound: new InboundBackpressure(options, {
      onBackpressure: callbacks.onInboundBackpressure,
      onMessage: callbacks.onInboundMessage,
    }),
  };
}
