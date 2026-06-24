import { describe, expect, it } from 'vitest';
import { OutboundQueue } from '../queue.js';
import { DEFAULT_QUEUE } from '../types.js';

describe('OutboundQueue', () => {
  it('enqueues messages in FIFO order', () => {
    const queue = new OutboundQueue(DEFAULT_QUEUE);
    queue.enqueue('first');
    queue.enqueue('second');
    queue.enqueue('third');

    expect(queue.shift()?.payload).toBe('first');
    expect(queue.shift()?.payload).toBe('second');
    expect(queue.shift()?.payload).toBe('third');
  });

  it('drop-oldest overflow strategy', () => {
    const queue = new OutboundQueue({ ...DEFAULT_QUEUE, maxSize: 2, overflow: 'drop-oldest' });
    queue.enqueue('a');
    queue.enqueue('b');
    const result = queue.enqueue('c');

    expect(result.ok).toBe(true);
    expect(queue.size).toBe(2);
    expect(queue.shift()?.payload).toBe('b');
    expect(queue.shift()?.payload).toBe('c');
  });

  it('drop-newest overflow strategy rejects newest', () => {
    const queue = new OutboundQueue({ ...DEFAULT_QUEUE, maxSize: 2, overflow: 'drop-newest' });
    queue.enqueue('a');
    queue.enqueue('b');
    const result = queue.enqueue('c');

    expect(result.ok).toBe(false);
    expect(queue.size).toBe(2);
  });

  it('reject overflow strategy', () => {
    const queue = new OutboundQueue({ ...DEFAULT_QUEUE, maxSize: 1, overflow: 'reject' });
    queue.enqueue('a');
    const result = queue.enqueue('b');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('reject');
    }
  });

  it('stores channel on queued messages', () => {
    const queue = new OutboundQueue(DEFAULT_QUEUE);
    const result = queue.enqueue({ foo: 1 }, 'metrics');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message.channel).toBe('metrics');
    }
  });
});
