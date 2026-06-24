import type { OverflowStrategy, QueuedMessage, ResolvedQueueOptions } from './types.js';
import { generateId } from './types.js';

export type EnqueueResult =
  | { ok: true; message: QueuedMessage }
  | { ok: false; reason: 'reject' | 'disabled' };

export class OutboundQueue {
  private items: QueuedMessage[] = [];

  constructor(private readonly options: ResolvedQueueOptions) {}

  get size(): number {
    return this.items.length;
  }

  peekAll(): readonly QueuedMessage[] {
    return this.items;
  }

  enqueue(payload: unknown, channel?: string): EnqueueResult {
    if (!this.options.enabled) {
      return { ok: false, reason: 'disabled' };
    }

    const message: QueuedMessage = {
      id: generateId(),
      payload,
      channel,
      enqueuedAt: Date.now(),
    };

    if (this.items.length >= this.options.maxSize) {
      const handled = this.applyOverflow(message);
      if (!handled) {
        return { ok: false, reason: 'reject' };
      }
    } else {
      this.items.push(message);
    }

    return { ok: true, message };
  }

  shift(): QueuedMessage | undefined {
    return this.items.shift();
  }

  clear(): void {
    this.items = [];
  }

  private applyOverflow(incoming: QueuedMessage): boolean {
    const strategy: OverflowStrategy = this.options.overflow;
    switch (strategy) {
      case 'drop-oldest':
        this.items.shift();
        this.items.push(incoming);
        return true;
      case 'drop-newest':
        return false;
      case 'reject':
        return false;
      default:
        return false;
    }
  }
}
