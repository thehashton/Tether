import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthManager } from '../auth.js';

function makeToken(exp: number): string {
  return Buffer.from(JSON.stringify({ exp })).toString('base64');
}

describe('AuthManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends auth on authenticate', async () => {
    const sendAuth = vi.fn();
    const exp = Date.now() + 300_000;
    const manager = new AuthManager(
      {
        getToken: async () => makeToken(exp),
        refreshBeforeExpiryMs: 60_000,
      },
      {
        sendAuth,
        onAuthRefreshed: () => {},
        onError: () => {},
      },
    );

    await manager.authenticate();
    expect(sendAuth).toHaveBeenCalledWith({
      type: 'tether:auth',
      token: makeToken(exp),
    });
  });

  it('schedules refresh before expiry', async () => {
    const onAuthRefreshed = vi.fn();
    const getToken = vi
      .fn()
      .mockResolvedValueOnce(makeToken(Date.now() + 120_000))
      .mockResolvedValueOnce(makeToken(Date.now() + 300_000));

    const manager = new AuthManager(
      {
        getToken,
        refreshBeforeExpiryMs: 60_000,
      },
      {
        sendAuth: () => {},
        onAuthRefreshed,
        onError: () => {},
      },
    );

    const now = Date.now();
    vi.setSystemTime(now);

    await manager.authenticate();
    vi.advanceTimersByTime(61_000);
    await Promise.resolve();

    expect(getToken).toHaveBeenCalledTimes(2);
    expect(onAuthRefreshed).toHaveBeenCalled();
    manager.stop();
  });

  it('emits error when getToken rejects', async () => {
    const onError = vi.fn();
    const manager = new AuthManager(
      {
        getToken: async () => {
          throw new Error('auth failed');
        },
      },
      {
        sendAuth: () => {},
        onAuthRefreshed: () => {},
        onError,
      },
    );

    await manager.authenticate();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'auth failed' }));
  });

  it('refreshNow emits auth-refreshed', async () => {
    const onAuthRefreshed = vi.fn();
    const manager = new AuthManager(
      {
        getToken: async () => makeToken(Date.now() + 300_000),
      },
      {
        sendAuth: () => {},
        onAuthRefreshed,
        onError: () => {},
      },
    );

    await manager.refreshNow();
    expect(onAuthRefreshed).toHaveBeenCalled();
  });
});
