'use client';

import { useSyncExternalStore } from 'react';

/**
 * Remembers, on this device, that the family arrived through the Abidjan
 * page (/abidjan). The demo and the first word then show the launch offer where
 * other visitors see the standard trial, so the price they were promised on
 * the roll-up is the price they meet again. Kept three weeks, then forgotten.
 */

const KEY = 'mounas_expo';
const KEEP_MS = 21 * 24 * 60 * 60 * 1000;

export function markExpoVisit(): void {
  try {
    window.localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Private browsing: the visitor simply sees the standard offer.
  }
}

function isExpoVisit(): boolean {
  try {
    const at = Number(window.localStorage.getItem(KEY));
    return at > 0 && Date.now() - at < KEEP_MS;
  } catch {
    return false;
  }
}

const subscribe = () => () => {};

/** True once mounted in the browser of a family that came through /abidjan. */
export function useExpoVisit(): boolean {
  return useSyncExternalStore(subscribe, isExpoVisit, () => false);
}
