'use client';

import { useState } from 'react';

/**
 * Wrong taps, without failure: which tile shakes (a new key each time, so the
 * animation plays again), and how many misses on the current item. After two,
 * the helping hand shows the right answer.
 */
export function useTries() {
  const [state, setState] = useState({ item: '', misses: 0, tile: '', n: 0 });
  return {
    miss: (item: string, tile: string | number) =>
      setState((s) => ({ item, tile: String(tile), misses: s.item === item ? s.misses + 1 : 1, n: s.n + 1 })),
    reset: () => setState((s) => ({ ...s, item: '', misses: 0, tile: '' })),
    /** 0 when this tile isn't shaking, else a key that changes on each miss. */
    shake: (tile: string | number) => (state.tile === String(tile) ? state.n : 0),
    hand: (item: string) => state.item === item && state.misses >= 2,
  };
}
