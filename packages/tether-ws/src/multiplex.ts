import type { ChannelEnvelope, EnvelopeType } from './types.js';
import { generateId } from './types.js';

export type ChannelHandler = (payload: unknown) => void;

export class Multiplexer {
  private handlers = new Map<string, Set<ChannelHandler>>();

  subscribe(channel: string, handler: ChannelHandler): () => void {
    let set = this.handlers.get(channel);
    if (!set) {
      set = new Set();
      this.handlers.set(channel, set);
    }
    set.add(handler);

    return () => {
      set?.delete(handler);
      if (set?.size === 0) {
        this.handlers.delete(channel);
      }
    };
  }

  createEnvelope(
    channel: string,
    type: EnvelopeType,
    payload?: unknown,
    id?: string,
  ): ChannelEnvelope {
    return { channel, type, payload, id: id ?? generateId() };
  }

  route(envelope: ChannelEnvelope): void {
    if (envelope.type !== 'data') return;
    const set = this.handlers.get(envelope.channel);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(envelope.payload);
      } catch {
        // Swallow handler errors
      }
    }
  }

  hasSubscribers(channel: string): boolean {
    return (this.handlers.get(channel)?.size ?? 0) > 0;
  }

  clear(): void {
    this.handlers.clear();
  }
}

export function parseEnvelope(raw: unknown): ChannelEnvelope | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.channel !== 'string' || typeof obj.type !== 'string') return null;
  if (obj.type !== 'data' && obj.type !== 'subscribe' && obj.type !== 'unsubscribe') return null;
  return {
    channel: obj.channel,
    type: obj.type,
    payload: obj.payload,
    id: typeof obj.id === 'string' ? obj.id : undefined,
  };
}

export function serializeEnvelope(envelope: ChannelEnvelope): string {
  return JSON.stringify(envelope);
}
