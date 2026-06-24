import { describe, expect, it, vi } from 'vitest';
import { Multiplexer, parseEnvelope, serializeEnvelope } from '../multiplex.js';

describe('Multiplexer', () => {
  it('routes data envelopes to channel handlers', () => {
    const mux = new Multiplexer();
    const handler = vi.fn();
    mux.subscribe('chat', handler);

    mux.route({ channel: 'chat', type: 'data', payload: { text: 'hello' } });
    expect(handler).toHaveBeenCalledWith({ text: 'hello' });
  });

  it('supports multiple handlers per channel', () => {
    const mux = new Multiplexer();
    const h1 = vi.fn();
    const h2 = vi.fn();
    mux.subscribe('events', h1);
    mux.subscribe('events', h2);

    mux.route({ channel: 'events', type: 'data', payload: 42 });
    expect(h1).toHaveBeenCalledWith(42);
    expect(h2).toHaveBeenCalledWith(42);
  });

  it('unsubscribe removes handler', () => {
    const mux = new Multiplexer();
    const handler = vi.fn();
    const unsub = mux.subscribe('chat', handler);
    unsub();

    mux.route({ channel: 'chat', type: 'data', payload: 'gone' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not route subscribe/unsubscribe envelopes', () => {
    const mux = new Multiplexer();
    const handler = vi.fn();
    mux.subscribe('chat', handler);

    mux.route({ channel: 'chat', type: 'subscribe' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('parses and serializes envelopes', () => {
    const envelope = { channel: 'demo', type: 'data' as const, payload: { x: 1 } };
    const json = serializeEnvelope(envelope);
    const parsed = parseEnvelope(JSON.parse(json));
    expect(parsed).toEqual(envelope);
  });
});
