import type { TetherState } from './types.js';

const VALID_TRANSITIONS: Record<TetherState, TetherState[]> = {
  idle: ['connecting', 'closed'],
  connecting: ['open', 'reconnecting', 'closed'],
  open: ['reconnecting', 'closed'],
  reconnecting: ['connecting', 'closed'],
  closed: [],
};

export class StateMachine {
  private _state: TetherState = 'idle';

  get state(): TetherState {
    return this._state;
  }

  canTransition(to: TetherState): boolean {
    return VALID_TRANSITIONS[this._state].includes(to);
  }

  transition(to: TetherState): { from: TetherState; to: TetherState } | null {
    if (!this.canTransition(to)) {
      return null;
    }
    const from = this._state;
    this._state = to;
    return { from, to };
  }

  force(to: TetherState): { from: TetherState; to: TetherState } {
    const from = this._state;
    this._state = to;
    return { from, to };
  }

  reset(): void {
    this._state = 'idle';
  }
}
