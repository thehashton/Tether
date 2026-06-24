import type { ResolvedReconnectOptions } from './types.js';

export class BackoffCalculator {
  private attempt = 0;

  constructor(private readonly options: ResolvedReconnectOptions) {}

  get currentAttempt(): number {
    return this.attempt;
  }

  /**
   * Full jitter: delay = random(0, min(maxDelayMs, baseDelayMs * 2^attempt))
   */
  nextDelay(): number {
    const cap = Math.min(
      this.options.maxDelayMs,
      this.options.baseDelayMs * 2 ** this.attempt,
    );
    return Math.min(cap, Math.floor(Math.random() * (cap + 1)));
  }

  increment(): number {
    this.attempt += 1;
    return this.attempt;
  }

  reset(): void {
    this.attempt = 0;
  }

  hasAttemptsRemaining(): boolean {
    return this.attempt < this.options.maxAttempts;
  }
}
