/**
 * The whole progress of a family as one JSON value, so it can follow a parent
 * from one device to another (saved per parent in Airtable, see
 * src/lib/family-progress.ts). Used on both sides: the browser builds it from
 * localStorage (src/components/app/ProgressSync.tsx), the server merges it.
 *
 * Merging never loses anything: lists are joined, a word or a mission keeps
 * the best of both sides (first date, most times, "read alone" once true
 * stays true…). The same merge runs on the server, so two devices syncing
 * at once can't wipe each other's progress.
 *
 * Everything coming in is parsed field by field: whatever the browser sends,
 * only well-formed entries are kept.
 */

import type { LearnedWord } from '@/lib/progress';
import type { MissionRecord } from '@/lib/mission-progress';
import { emptyCalcul, mergeCalcul, parseCalcul, type CalculState } from '@/lib/calcul';

export type Snapshot = {
  /** Days with at least one finished activity (YYYY-MM-DD). */
  days: string[];
  /** Activity ids started (selector). */
  seen: string[];
  learned: LearnedWord[];
  missions: Record<string, MissionRecord>;
  /** `${activityId}_${YYYY-MM-DD}` for the `mounas_completed_…` keys. */
  completed: string[];
  /** « Les mots qui reviennent »: returns done per word. */
  review: Record<string, number>;
  /** « Le calcul »: level, stats per level and per day (src/lib/calcul.ts). */
  calcul: CalculState;
};

/** Something finished since the last sync, for the Journal table. */
export type ProgressEvent =
  | { kind: 'mot'; id: string; label: string; date: string; readAlone: boolean; spelledAlone: boolean }
  | { kind: 'mission'; id: string; date: string; solved: boolean; tries: number; hints: number };

export const emptySnapshot = (): Snapshot => ({ days: [], seen: [], learned: [], missions: {}, completed: [], review: {}, calcul: emptyCalcul() });

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ITEMS = 2000;

const isObject = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
const dateOr = (v: unknown, fallback = '') => (typeof v === 'string' && DATE.test(v) ? v : fallback);
const strings = (v: unknown, test: (s: string) => boolean = Boolean) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length <= 200 && test(x)).slice(0, MAX_ITEMS) : [];

function parseWord(v: unknown): LearnedWord | null {
  if (!isObject(v) || !str(v.id) || !str(v.word)) return null;
  return {
    id: str(v.id),
    word: str(v.word),
    level: str(v.level),
    theme: str(v.theme),
    sounds: strings(v.sounds).slice(0, 30),
    date: dateOr(v.date),
    times: Math.max(1, num(v.times)),
    readAlone: v.readAlone === true,
    spelledAlone: v.spelledAlone === true,
  };
}

function parseMission(v: unknown): MissionRecord | null {
  if (!isObject(v)) return null;
  const lastDate = dateOr(v.lastDate);
  if (!lastDate) return null;
  const date = dateOr(v.date);
  return {
    solved: v.solved === true,
    ...(date ? { date } : {}),
    lastDate,
    tries: num(v.tries),
    hints: num(v.hints),
    ...(v.harder === true ? { harder: true } : {}),
  };
}

export function parseSnapshot(v: unknown): Snapshot {
  if (!isObject(v)) return emptySnapshot();
  const missions: Record<string, MissionRecord> = {};
  if (isObject(v.missions)) {
    for (const [id, m] of Object.entries(v.missions).slice(0, MAX_ITEMS)) {
      const parsed = parseMission(m);
      if (parsed && id.length <= 200) missions[id] = parsed;
    }
  }
  const review: Record<string, number> = {};
  if (isObject(v.review)) {
    for (const [id, n] of Object.entries(v.review).slice(0, MAX_ITEMS)) if (id.length <= 200) review[id] = Math.min(num(n), 10);
  }
  return {
    days: strings(v.days, (s) => DATE.test(s)),
    seen: strings(v.seen),
    learned: (Array.isArray(v.learned) ? v.learned.slice(0, MAX_ITEMS) : []).map(parseWord).filter((w): w is LearnedWord => w !== null),
    missions,
    completed: strings(v.completed, (s) => /_\d{4}-\d{2}-\d{2}$/.test(s)),
    review,
    calcul: parseCalcul(v.calcul),
  };
}

const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];
const earliest = (a = '', b = '') => (!a ? b : !b ? a : a < b ? a : b);

function mergeWord(a: LearnedWord, b: LearnedWord): LearnedWord {
  return {
    ...a,
    sounds: a.sounds.length ? a.sounds : b.sounds,
    date: earliest(a.date, b.date),
    times: Math.max(a.times, b.times),
    readAlone: Boolean(a.readAlone || b.readAlone),
    spelledAlone: Boolean(a.spelledAlone || b.spelledAlone),
  };
}

function mergeMission(a: MissionRecord, b: MissionRecord): MissionRecord {
  const latest = a.lastDate >= b.lastDate ? a : b;
  const date = earliest(a.date, b.date);
  return {
    ...latest,
    solved: a.solved || b.solved,
    ...(date ? { date } : {}),
    ...(a.harder || b.harder ? { harder: true } : {}),
  };
}

export function mergeSnapshots(a: Snapshot, b: Snapshot): Snapshot {
  const learned = new Map(a.learned.map((w) => [w.id, w]));
  for (const w of b.learned) {
    const prev = learned.get(w.id);
    learned.set(w.id, prev ? mergeWord(prev, w) : w);
  }
  const missions = { ...a.missions };
  for (const [id, m] of Object.entries(b.missions)) missions[id] = missions[id] ? mergeMission(missions[id], m) : m;
  const review = { ...a.review };
  for (const [id, n] of Object.entries(b.review)) review[id] = Math.max(review[id] ?? 0, n);
  return {
    days: union(a.days, b.days).sort(),
    seen: union(a.seen, b.seen),
    learned: [...learned.values()],
    missions,
    completed: union(a.completed, b.completed),
    review,
    calcul: mergeCalcul(a.calcul, b.calcul),
  };
}

/** Consecutive days ending on the latest day if it is today or yesterday. */
export function streakOf(days: string[], today: string): number {
  const set = new Set(days);
  const cursor = new Date(`${today}T12:00:00Z`);
  const iso = () => cursor.toISOString().slice(0, 10);
  if (!set.has(iso())) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (set.has(iso())) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
