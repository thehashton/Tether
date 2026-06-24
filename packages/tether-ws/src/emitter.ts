import type { TetherEventName, TetherEvents } from './types.js';

type Handler<T> = (event: T) => void;

export class Emitter {
  private listeners = new Map<TetherEventName, Set<Handler<unknown>>>();

  on<K extends TetherEventName>(event: K, handler: Handler<TetherEvents[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as Handler<unknown>);

    return () => {
      set?.delete(handler as Handler<unknown>);
    };
  }

  emit<K extends TetherEventName>(event: K, payload: TetherEvents[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(payload);
      } catch {
        // Swallow handler errors to avoid breaking the client
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
