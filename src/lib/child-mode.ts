'use client';

import { useSyncExternalStore } from 'react';
import { localDate, readPref, writePref } from '@/lib/progress';

/**
 * "Mode enfant": the child goes through the words alone. Kept on the device,
 * in its own keys (the progress keys of src/lib/progress.ts are untouched):
 *
 * - `mounas_mode` — "enfant" while child mode is on, "parent" once left.
 * - `mounas_words_per_day` — how many words the child may chain in a day
 *   (1 to 5, 3 by default), set by the parent behind the parent lock.
 * - `mounas_child_day` — {date, ids}: the words finished today, to know when
 *   « Un autre mot ? » stops.
 */

const LS_MODE = 'mounas_mode';
const LS_WORDS_PER_DAY = 'mounas_words_per_day';
const LS_CHILD_DAY = 'mounas_child_day';
const CHANGE = 'mounas-child-mode';

export const DEFAULT_WORDS_PER_DAY = 3;
export const MAX_WORDS_PER_DAY = 5;

// Same-tab updates go through a custom event; other tabs through "storage".
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener('storage', onChange);
  };
}
const notify = () => window.dispatchEvent(new Event(CHANGE));

const isChildMode = () => readPref(LS_MODE) === 'enfant';

export function setChildMode(on: boolean): void {
  writePref(LS_MODE, on ? 'enfant' : 'parent');
  notify();
}

/** False on the server and until hydrated: parent mode is the safe default. */
export function useChildMode(): boolean {
  return useSyncExternalStore(subscribe, isChildMode, () => false);
}

export function wordsPerDay(): number {
  const n = parseInt(readPref(LS_WORDS_PER_DAY) ?? '', 10);
  return n >= 1 && n <= MAX_WORDS_PER_DAY ? n : DEFAULT_WORDS_PER_DAY;
}

export function setWordsPerDay(n: number): void {
  writePref(LS_WORDS_PER_DAY, String(Math.min(MAX_WORDS_PER_DAY, Math.max(1, Math.round(n)))));
  notify();
}

export function useWordsPerDay(): number {
  return useSyncExternalStore(subscribe, wordsPerDay, () => DEFAULT_WORDS_PER_DAY);
}

/** Ids of the words finished today (any mode), most recent last. */
export function wordsDoneToday(): string[] {
  try {
    const saved = JSON.parse(readPref(LS_CHILD_DAY) ?? 'null');
    if (saved && saved.date === localDate() && Array.isArray(saved.ids)) {
      return saved.ids.filter((x: unknown): x is string => typeof x === 'string');
    }
  } catch {
    // unreadable: start the day again
  }
  return [];
}

export function markWordDoneToday(id: string): void {
  const ids = wordsDoneToday();
  if (!ids.includes(id)) ids.push(id);
  writePref(LS_CHILD_DAY, JSON.stringify({ date: localDate(), ids }));
  notify();
}

// A string snapshot so React can compare it between renders.
const doneTodaySnapshot = () => wordsDoneToday().join(',');

export function useWordsDoneToday(): string[] {
  const raw = useSyncExternalStore(subscribe, doneTodaySnapshot, () => '');
  return raw ? raw.split(',') : [];
}
