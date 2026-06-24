import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HEARTBEAT_CLOSE_CODE, HeartbeatManager } from '../heartbeat.js';

describe('HeartbeatManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends ping on interval', () => {
    const pings: number[] = [];
    const manager = new HeartbeatManager(1000, 500, {
      onPing: (msg) => pings.push(msg.ts),
      onTimeout: () => {},
    });

    manager.start();
    expect(pings).toHaveLength(1);

    vi.advanceTimersByTime(1000);
    expect(pings).toHaveLength(2);

    manager.stop();
  });

  it('clears timeout on pong', () => {
    const onTimeout = vi.fn();
    let lastTs = 0;
    const manager = new HeartbeatManager(1000, 500, {
      onPing: (msg) => {
        lastTs = msg.ts;
      },
      onTimeout,
    });

    manager.start();
    manager.handlePong({ type: 'tether:pong', ts: lastTs });

    vi.advanceTimersByTime(600);
    expect(onTimeout).not.toHaveBeenCalled();

    manager.stop();
  });

  it('triggers timeout when no pong arrives', () => {
    const onTimeout = vi.fn();
    const manager = new HeartbeatManager(1000, 500, {
      onPing: () => {},
      onTimeout,
    });

    manager.start();
    vi.advanceTimersByTime(500);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    manager.stop();
  });

  it('exports heartbeat close code 4000', () => {
    expect(HEARTBEAT_CLOSE_CODE).toBe(4000);
  });
});
