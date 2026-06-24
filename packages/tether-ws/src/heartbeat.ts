import type { TetherPingMessage, TetherPongMessage } from './types.js';

export const HEARTBEAT_CLOSE_CODE = 4000;

export interface HeartbeatCallbacks {
  onPing: (message: TetherPingMessage) => void;
  onTimeout: () => void;
}

export class HeartbeatManager {
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingTs: number | null = null;

  constructor(
    private readonly intervalMs: number,
    private readonly timeoutMs: number,
    private readonly callbacks: HeartbeatCallbacks,
  ) {}

  start(): void {
    this.stop();
    this.intervalTimer = setInterval(() => this.sendPing(), this.intervalMs);
    this.sendPing();
  }

  stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.clearTimeout();
    this.pendingTs = null;
  }

  handlePong(message: TetherPongMessage): void {
    if (this.pendingTs !== null && message.ts === this.pendingTs) {
      this.clearTimeout();
      this.pendingTs = null;
    }
  }

  private sendPing(): void {
    const ts = Date.now();
    this.pendingTs = ts;
    this.callbacks.onPing({ type: 'tether:ping', ts });
    this.clearTimeout();
    this.timeoutTimer = setTimeout(() => {
      this.callbacks.onTimeout();
    }, this.timeoutMs);
  }

  private clearTimeout(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }
}
