/**
 * Client-side progress, kept in localStorage (no account needed).
 *
 * - `mounas_completed_<id>_<YYYY-MM-DD>` — kept from the first version so
 *   activities already marked done stay done.
 * - `mounas_days`  — sorted list of local dates (YYYY-MM-DD) with at least one
 *   finished activity; drives the streak and the week dots.
 * - `mounas_seen_words` — activity ids the family has started (selector).
 * - `mounas_learned` — one entry per word finished (first time only): the
 *   word, its level, theme and sounds, and the date. Drives the stats page.
 *
 * Every access is wrapped: storage can be missing or throw (private mode,
 * blocked cookies) and the app must still work without it.
 */

const LS_DAYS = 'mounas_days';
export const LS_SEEN = 'mounas_seen_words';

/** Local calendar date, not UTC — "today" must match the parent's clock. */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable — progress just won't persist
  }
}

function readList(key: string): string[] {
  const raw = read(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

const completedKey = (activityId: string, date: string) => `mounas_completed_${activityId}_${date}`;

export function isCompletedToday(activityId: string): boolean {
  return read(completedKey(activityId, localDate())) === 'true';
}

export type LearnedWord = {
  id: string;
  word: string;
  level: string;
  theme: string;
  /** Sound keys heard in the word (see src/lib/phonics.ts). */
  sounds: string[];
  /** First day it was finished (YYYY-MM-DD). */
  date: string;
  /** How many times it has been done in total. */
  times: number;
  /** The child read it alone at least once, before hearing it. */
  readAlone?: boolean;
  /** The child spelled or wrote it alone at least once, from hearing it. */
  spelledAlone?: boolean;
};

const LS_LEARNED = 'mounas_learned';

export function learnedWords(): LearnedWord[] {
  const raw = read(LS_LEARNED);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => x && typeof x.id === 'string' && typeof x.word === 'string') : [];
  } catch {
    return [];
  }
}

export function markCompleted(entry: Omit<LearnedWord, 'date' | 'times'>): void {
  const today = localDate();
  write(completedKey(entry.id, today), 'true');
  const days = new Set(readList(LS_DAYS));
  days.add(today);
  write(LS_DAYS, JSON.stringify([...days].sort()));

  const learned = learnedWords();
  const existing = learned.find((l) => l.id === entry.id);
  if (existing) {
    existing.times += 1;
    existing.readAlone = Boolean(existing.readAlone || entry.readAlone);
    existing.spelledAlone = Boolean(existing.spelledAlone || entry.spelledAlone);
  } else {
    learned.push({ ...entry, date: today, times: 1 });
  }
  write(LS_LEARNED, JSON.stringify(learned));
}

export function completedDays(): Set<string> {
  return new Set(readList(LS_DAYS));
}

/**
 * Consecutive days with an activity, ending today — or yesterday, so the
 * streak isn't shown as broken in the morning before today's activity.
 */
export function currentStreak(days: Set<string> = completedDays()): number {
  const cursor = new Date();
  if (!days.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function seenWords(): string[] {
  return readList(LS_SEEN);
}

export function markSeen(activityId: string): string[] {
  const seen = seenWords();
  if (seen.includes(activityId)) return seen;
  const next = [...seen, activityId];
  write(LS_SEEN, JSON.stringify(next));
  return next;
}

export function readPref(key: string): string | null {
  return read(key);
}

export function writePref(key: string, value: string): void {
  write(key, value);
}
