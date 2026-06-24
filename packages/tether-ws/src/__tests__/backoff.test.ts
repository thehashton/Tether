import { describe, expect, it } from 'vitest';
import { BackoffCalculator } from '../backoff.js';
import { DEFAULT_RECONNECT } from '../types.js';

describe('BackoffCalculator', () => {
  it('computes full-jitter delay within bounds', () => {
    const calc = new BackoffCalculator({ ...DEFAULT_RECONNECT, baseDelayMs: 300, maxDelayMs: 30_000 });

    for (let i = 0; i < 5; i++) {
      calc.increment();
      const delay = calc.nextDelay();
      const cap = Math.min(30_000, 300 * 2 ** calc.currentAttempt);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(cap);
    }
  });

  it('increments attempt on each failed reconnect', () => {
    const calc = new BackoffCalculator({ ...DEFAULT_RECONNECT, maxAttempts: 5 });
    expect(calc.currentAttempt).toBe(0);
    expect(calc.increment()).toBe(1);
    expect(calc.increment()).toBe(2);
  });

  it('resets attempt on successful open', () => {
    const calc = new BackoffCalculator({ ...DEFAULT_RECONNECT });
    calc.increment();
    calc.increment();
    calc.reset();
    expect(calc.currentAttempt).toBe(0);
  });

  it('respects maxAttempts', () => {
    const calc = new BackoffCalculator({ ...DEFAULT_RECONNECT, maxAttempts: 3 });
    calc.increment();
    calc.increment();
    calc.increment();
    expect(calc.hasAttemptsRemaining()).toBe(false);
  });

  it('produces exact cap at attempt 0 with mocked random', () => {
    const originalRandom = Math.random;
    Math.random = () => 1;
    const calc = new BackoffCalculator({ ...DEFAULT_RECONNECT, baseDelayMs: 300, maxDelayMs: 30_000 });
    const delay = calc.nextDelay();
    expect(delay).toBe(300);
    Math.random = originalRandom;
  });
});
