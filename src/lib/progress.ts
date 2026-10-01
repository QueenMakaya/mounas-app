'use client';

/**
 * The child's progress on this device: stars earned, words learned and the
 * daily streak. Kept in localStorage until we have parent accounts.
 */

export type Progress = {
  stars: number;
  words: Record<string, { word: string; date: string; stars: number }>;
  days: string[]; // ISO dates with at least one finished lesson
};

export const PROGRESS_KEY = 'mounas_progress_v1';

const today = () => new Date().toISOString().slice(0, 10);

export function parseProgress(text: string): Progress {
  try {
    const raw = JSON.parse(text || 'null');
    if (raw && typeof raw === 'object') {
      return { stars: Number(raw.stars) || 0, words: raw.words ?? {}, days: Array.isArray(raw.days) ? raw.days : [] };
    }
  } catch {
    /* ignore */
  }
  return { stars: 0, words: {}, days: [] };
}

export function readProgress(): Progress {
  try {
    return parseProgress(localStorage.getItem(PROGRESS_KEY) ?? '');
  } catch {
    return parseProgress('');
  }
}

export function recordLesson(id: string, word: string, stars: number): Progress {
  const p = readProgress();
  const prev = p.words[id]?.stars ?? 0;
  p.stars += stars;
  p.words[id] = { word, date: today(), stars: Math.max(prev, stars) };
  if (!p.days.includes(today())) p.days.push(today());
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    // keep the old "completed today" flag used by the parent guide page
    localStorage.setItem(`mounas_completed_${id}_${today()}`, 'true');
  } catch {
    /* ignore */
  }
  return p;
}

/** Consecutive days (ending today or yesterday) with a finished lesson. */
export function streak(p: Progress): number {
  const set = new Set(p.days);
  const d = new Date();
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
