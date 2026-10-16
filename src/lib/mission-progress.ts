/**
 * Missions progress, kept in localStorage like the words (src/lib/progress.ts)
 * but under its own key, so the existing keys are never touched:
 *
 * - `mounas_missions` — { [missionId]: MissionRecord }
 *
 * Every access is wrapped: storage can be missing or throw (private mode) and
 * the missions must still work without it.
 */

import { localDate } from '@/lib/progress';

const LS_MISSIONS = 'mounas_missions';

export type MissionRecord = {
  /** Found it (or the parent confirmed it) at least once. */
  solved: boolean;
  /** First day it was solved (YYYY-MM-DD). */
  date?: string;
  /** Last day it was tried. */
  lastDate: string;
  /** Tries before finding it, last time. */
  tries: number;
  /** Hints used, last time. */
  hints: number;
  /** The harder variant was done too. */
  harder?: boolean;
};

export function missionProgress(): Record<string, MissionRecord> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LS_MISSIONS) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveMission(id: string, patch: Partial<MissionRecord>): void {
  try {
    const all = missionProgress();
    const prev = all[id];
    const today = localDate();
    const blank: MissionRecord = { solved: false, tries: 0, hints: 0, lastDate: today };
    const next: MissionRecord = { ...blank, ...prev, ...patch, lastDate: today };
    if (next.solved && !next.date) next.date = today;
    if (prev?.solved) next.solved = true; // once found, stays found
    all[id] = next;
    window.localStorage.setItem(LS_MISSIONS, JSON.stringify(all));
    window.dispatchEvent(new Event('mounas-missions'));
  } catch {
    // storage unavailable: progress just won't persist
  }
}

/** For useSyncExternalStore: re-read when a mission is saved (here or in another tab). */
export function subscribeMissions(onChange: () => void): () => void {
  window.addEventListener('mounas-missions', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('mounas-missions', onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Stable snapshot string for useSyncExternalStore. */
export function missionSnapshot(): string {
  try {
    return window.localStorage.getItem(LS_MISSIONS) ?? '{}';
  } catch {
    return '{}';
  }
}
