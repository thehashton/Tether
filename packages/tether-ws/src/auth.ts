import type { AuthOptions, TetherAuthMessage } from './types.js';

export interface AuthCallbacks {
  onAuthRefreshed: (token: string) => void;
  onError: (error: Error) => void;
  sendAuth: (message: TetherAuthMessage) => void;
}

export class AuthManager {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private tokenExpiry: number | null = null;

  constructor(
    private readonly options: AuthOptions,
    private readonly callbacks: AuthCallbacks,
  ) {}

  async authenticate(): Promise<void> {
    try {
      const token = await this.options.getToken();
      this.scheduleRefresh(token);
      this.callbacks.sendAuth({ type: 'tether:auth', token });
    } catch (err) {
      this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async refreshNow(): Promise<void> {
    try {
      const token = await this.options.getToken();
      this.scheduleRefresh(token);
      this.callbacks.sendAuth({ type: 'tether:auth', token });
      this.callbacks.onAuthRefreshed(token);
    } catch (err) {
      this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  stop(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.tokenExpiry = null;
  }

  private scheduleRefresh(token: string): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const expiry = this.parseExpiry(token) ?? Date.now() + (this.options.tokenTtlMs ?? 300_000);
    this.tokenExpiry = expiry;

    const refreshBefore = this.options.refreshBeforeExpiryMs ?? 60_000;
    const delay = Math.max(0, expiry - refreshBefore - Date.now());

    this.refreshTimer = setTimeout(() => {
      void this.refreshNow();
    }, delay);
  }

  private parseExpiry(token: string): number | null {
    try {
      const decoded = JSON.parse(atob(token));
      if (typeof decoded.exp === 'number') {
        return decoded.exp;
      }
    } catch {
      // Not a base64 JSON token
    }
    return null;
  }

  get expiry(): number | null {
    return this.tokenExpiry;
  }
}

function atob(value: string): string {
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(value);
  }
  return Buffer.from(value, 'base64').toString('utf-8');
}
