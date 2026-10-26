/**
 * « Le calcul » : daily drills in the spirit of the Kumon method. A long,
 * gentle ladder of small levels (+1, +2… then within 20, then two digits; the
 * same for subtraction; then the tables one by one). No limit per day: the
 * child does 2, 10 or 50 calculations, and the app adapts from the answers.
 *
 * - A level opens the next one once it is mastered: 18 of the last 20 right
 *   the first time, and done without searching too long (median time under
 *   the level's target, as Kumon asks for both accuracy and ease).
 * - Many mistakes in a row (5 or more of the last 10) bring back the
 *   previous level of the same operation for a while, to consolidate.
 * - A calculation missed comes back a little later in the same level.
 * - Single-fact levels (+3, ×4…) start in order (×4: 4×1, 4×2…) for the
 *   first ten, like a Kumon sheet, then go random.
 *
 * Kept in localStorage under `mounas_calcul` (follows the parent between
 * devices through src/lib/progress-snapshot.ts). Every access is wrapped:
 * without storage the drills still work, progress just isn't kept.
 */

import { localDate } from '@/lib/progress';

export type Op = 'addition' | 'soustraction' | 'multiplication';

export const OPS: { op: Op; label: string; symbol: string; said: string }[] = [
  { op: 'addition', label: 'Additions', symbol: '+', said: 'plus' },
  { op: 'soustraction', label: 'Soustractions', symbol: '−', said: 'moins' },
  { op: 'multiplication', label: 'Multiplications', symbol: '×', said: 'fois' },
];

export const opInfo = (op: Op) => OPS.find((o) => o.op === op)!;

type Pair = [number, number];

export type CalcLevel = {
  id: string;
  op: Op;
  /** Shown to the parent (« Ajouter 3 », « La table de 4 »…). */
  label: string;
  /** Shown on the child's screen (« +3 », « ×4 »). */
  short: string;
  /** Target median time per calculation, in seconds. */
  target: number;
  /** `i` is the position in the first, ordered round; null once random. */
  make: (i: number | null) => Pair;
  /** The first ten go in order (single-fact levels). */
  ordered?: boolean;
};

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

/** Add a fixed n: 1+n, 2+n… 10+n. */
const addN = (n: number): CalcLevel => ({
  id: `add-${n}`,
  op: 'addition',
  label: `Ajouter ${n}`,
  short: `+${n}`,
  target: 4,
  ordered: true,
  make: (i) => [i === null ? rand(1, 10) : (i % 10) + 1, n],
});

/** Take away a fixed n: the answers go 1…10. */
const subN = (n: number): CalcLevel => ({
  id: `sub-${n}`,
  op: 'soustraction',
  label: `Enlever ${n}`,
  short: `−${n}`,
  target: 5,
  ordered: true,
  make: (i) => [(i === null ? rand(1, 10) : (i % 10) + 1) + n, n],
});

/** The table of n: n×1 … n×10. */
const table = (n: number): CalcLevel => ({
  id: `mul-${n}`,
  op: 'multiplication',
  label: `La table de ${n}`,
  short: `×${n}`,
  target: 5,
  ordered: true,
  make: (i) => [n, i === null ? rand(1, 10) : (i % 10) + 1],
});

/** Two numbers of 2 digits (or 2 and 1) whose units do / don't carry. */
function twoDigits(bDigits: 1 | 2, carry: boolean): Pair {
  for (;;) {
    const a = rand(11, 89);
    const b = bDigits === 1 ? rand(1, 9) : rand(11, 89);
    if (a + b > 99) continue;
    if (carry === (a % 10) + (b % 10) >= 10) return [a, b];
  }
}

/** A 2-digit number minus 1 or 2 digits, with or without borrowing. */
function twoDigitsMinus(bDigits: 1 | 2, borrow: boolean): Pair {
  for (;;) {
    const a = rand(bDigits === 1 ? 11 : 21, 99);
    const b = bDigits === 1 ? rand(1, 9) : rand(11, a - 1);
    if (b >= a) continue;
    if (borrow === a % 10 < b % 10) return [a, b];
  }
}

/** Easiest first: the whole ladder, operation after operation. */
export const LEVELS: CalcLevel[] = [
  addN(1),
  addN(2),
  addN(3),
  addN(4),
  addN(5),
  { id: 'add-6-9', op: 'addition', label: 'Ajouter 6, 7, 8 ou 9', short: '+6 à +9', target: 5, make: () => [rand(1, 10), rand(6, 9)] },
  {
    id: 'add-10',
    op: 'addition',
    label: 'Additions jusqu’à 10',
    short: '≤ 10',
    target: 5,
    make: () => {
      const a = rand(0, 9);
      return [a, rand(1, 10 - a)];
    },
  },
  { id: 'add-20', op: 'addition', label: 'Additions jusqu’à 20', short: '≤ 20', target: 6, make: () => [rand(2, 10), rand(2, 10)] },
  { id: 'add-2c1', op: 'addition', label: '2 chiffres + 1 chiffre, sans retenue', short: '23 + 4', target: 8, make: () => twoDigits(1, false) },
  { id: 'add-2c1r', op: 'addition', label: '2 chiffres + 1 chiffre, avec retenue', short: '27 + 5', target: 10, make: () => twoDigits(1, true) },
  { id: 'add-2c2', op: 'addition', label: '2 chiffres + 2 chiffres, sans retenue', short: '23 + 14', target: 12, make: () => twoDigits(2, false) },
  { id: 'add-2c2r', op: 'addition', label: '2 chiffres + 2 chiffres, avec retenue', short: '28 + 15', target: 15, make: () => twoDigits(2, true) },

  subN(1),
  subN(2),
  subN(3),
  { id: 'sub-4-5', op: 'soustraction', label: 'Enlever 4 ou 5', short: '−4, −5', target: 5, make: () => { const b = rand(4, 5); return [b + rand(0, 10), b]; } },
  {
    id: 'sub-10',
    op: 'soustraction',
    label: 'Soustractions jusqu’à 10',
    short: '≤ 10',
    target: 5,
    make: () => {
      const a = rand(2, 10);
      return [a, rand(1, a)];
    },
  },
  { id: 'sub-20', op: 'soustraction', label: 'Soustractions jusqu’à 20', short: '≤ 20', target: 7, make: () => { const a = rand(11, 20); return [a, rand(a - 10, 10)]; } },
  { id: 'sub-2c1', op: 'soustraction', label: '2 chiffres − 1 chiffre, sans retenue', short: '27 − 4', target: 8, make: () => twoDigitsMinus(1, false) },
  { id: 'sub-2c1r', op: 'soustraction', label: '2 chiffres − 1 chiffre, avec retenue', short: '23 − 5', target: 10, make: () => twoDigitsMinus(1, true) },
  { id: 'sub-2c2', op: 'soustraction', label: '2 chiffres − 2 chiffres, sans retenue', short: '47 − 23', target: 12, make: () => twoDigitsMinus(2, false) },
  { id: 'sub-2c2r', op: 'soustraction', label: '2 chiffres − 2 chiffres, avec retenue', short: '42 − 17', target: 15, make: () => twoDigitsMinus(2, true) },

  table(2),
  table(3),
  table(4),
  table(5),
  table(6),
  table(7),
  table(8),
  table(9),
  table(10),
  { id: 'mul-mix', op: 'multiplication', label: 'Toutes les tables mélangées', short: 'mélange', target: 6, make: () => [rand(2, 9), rand(2, 10)] },
];

export const levelById = (id: string) => LEVELS.find((l) => l.id === id) ?? LEVELS[0];

export type Problem = { level: string; op: Op; a: number; b: number; answer: number };

export const answerOf = (op: Op, a: number, b: number) => (op === 'addition' ? a + b : op === 'soustraction' ? a - b : a * b);

export const problemText = (p: Pick<Problem, 'op' | 'a' | 'b'>) => `${p.a} ${opInfo(p.op).symbol} ${p.b}`;
export const problemSaid = (p: Pick<Problem, 'op' | 'a' | 'b'>) => `${p.a} ${opInfo(p.op).said} ${p.b}`;
const keyOf = (p: Pick<Problem, 'a' | 'b'>) => `${p.a},${p.b}`;

/* ───────────── Progress ───────────── */

export type LevelStats = {
  /** Calculations answered at this level, in total. */
  answered: number;
  /** Right the first time. */
  firstTry: number;
  /** Sum of the times to the first answer, in ms (average = ms / answered). */
  ms: number;
  /** Day the level was mastered (YYYY-MM-DD). */
  mastered?: string;
};

export type CalculState = {
  level: string;
  /** Since entering the current level: how many, and the last 20 answers. */
  since: number;
  recent: { ok: boolean; ms: number }[];
  stats: Record<string, LevelStats>;
  /** Per day: calculations done and right the first time. */
  days: Record<string, { done: number; ok: number }>;
  /** Calculations missed, to bring back (`a,b` of the current level). */
  retry: string[];
  /** Ms timestamp of the last change (the newest wins between devices). */
  updated: number;
};

export const WINDOW = 20;
export const MASTER_OK = 18;
const BACK_WINDOW = 10;
const BACK_MISSES = 5;
const MAX_RETRY = 10;

export const emptyCalcul = (): CalculState => ({ level: LEVELS[0].id, since: 0, recent: [], stats: {}, days: {}, retry: [], updated: 0 });

const LS_CALCUL = 'mounas_calcul';
const EVENT = 'mounas-calcul';

const isObject = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Field by field: only well-formed entries are kept (also used on the server). */
export function parseCalcul(v: unknown): CalculState {
  if (!isObject(v)) return emptyCalcul();
  const level = typeof v.level === 'string' && LEVELS.some((l) => l.id === v.level) ? v.level : LEVELS[0].id;
  const stats: Record<string, LevelStats> = {};
  if (isObject(v.stats)) {
    for (const l of LEVELS) {
      const s = v.stats[l.id];
      if (!isObject(s)) continue;
      const answered = num(s.answered);
      stats[l.id] = {
        answered,
        firstTry: Math.min(num(s.firstTry), answered),
        ms: num(s.ms),
        ...(typeof s.mastered === 'string' && DATE.test(s.mastered) ? { mastered: s.mastered } : {}),
      };
    }
  }
  const days: CalculState['days'] = {};
  if (isObject(v.days)) {
    for (const [d, x] of Object.entries(v.days).slice(-400)) {
      if (DATE.test(d) && isObject(x)) days[d] = { done: num(x.done), ok: Math.min(num(x.ok), num(x.done)) };
    }
  }
  return {
    level,
    since: num(v.since),
    recent: (Array.isArray(v.recent) ? v.recent : [])
      .filter(isObject)
      .slice(-WINDOW)
      .map((r) => ({ ok: r.ok === true, ms: num(r.ms) })),
    stats,
    days,
    retry: (Array.isArray(v.retry) ? v.retry : []).filter((x): x is string => typeof x === 'string' && /^\d+,\d+$/.test(x)).slice(-MAX_RETRY),
    updated: num(v.updated),
  };
}

/** Between two devices: the newest state, with the best of both per level and per day. */
export function mergeCalcul(a: CalculState, b: CalculState): CalculState {
  const newest = a.updated >= b.updated ? a : b;
  const stats = { ...a.stats };
  for (const [id, s] of Object.entries(b.stats)) {
    const prev = stats[id];
    if (!prev || s.answered > prev.answered) stats[id] = { ...s, ...(prev?.mastered && !s.mastered ? { mastered: prev.mastered } : {}) };
    else if (s.mastered && !prev.mastered) stats[id] = { ...prev, mastered: s.mastered };
  }
  const days = { ...a.days };
  for (const [d, x] of Object.entries(b.days)) if (!days[d] || x.done > days[d].done) days[d] = x;
  return { ...newest, stats, days };
}

export function readCalcul(): CalculState {
  try {
    return parseCalcul(JSON.parse(window.localStorage.getItem(LS_CALCUL) ?? 'null'));
  } catch {
    return emptyCalcul();
  }
}

export function saveCalcul(state: CalculState): void {
  try {
    window.localStorage.setItem(LS_CALCUL, JSON.stringify(state));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // storage unavailable: progress just won't persist
  }
}

/** For useSyncExternalStore: re-read when the drills save (here or in another tab). */
export function subscribeCalcul(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function calculSnapshot(): string {
  try {
    return window.localStorage.getItem(LS_CALCUL) ?? '';
  } catch {
    return '';
  }
}

/** The parent picks the level (where the Kumon book is): a fresh start there. */
export function setLevel(state: CalculState, id: string): CalculState {
  return { ...state, level: levelById(id).id, since: 0, recent: [], retry: [], updated: Date.now() };
}

/** The next calculation: a missed one now and then, else a new one (never the same twice in a row). */
export function nextProblem(state: CalculState, previous?: Problem | null): Problem {
  const level = levelById(state.level);
  const make = (): Pair => {
    const due = state.retry.filter((k) => !previous || k !== keyOf(previous));
    if (due.length > 0 && Math.random() < 0.3) {
      const [a, b] = due[0].split(',').map(Number);
      return [a, b];
    }
    return level.make(level.ordered && state.since < 10 ? state.since : null);
  };
  let pair = make();
  for (let i = 0; i < 6 && previous && pair[0] === previous.a && pair[1] === previous.b; i++) pair = level.make(null);
  const [a, b] = pair;
  return { level: level.id, op: level.op, a, b, answer: answerOf(level.op, a, b) };
}

const median = (xs: number[]) => {
  const s = [...xs].sort((x, y) => x - y);
  return s.length === 0 ? 0 : s[Math.floor(s.length / 2)];
};

/** Where the current level stands, for the parent. */
export function levelProgress(state: CalculState) {
  const level = levelById(state.level);
  const ok = state.recent.filter((r) => r.ok).length;
  const time = median(state.recent.map((r) => r.ms)) / 1000;
  return { level, count: state.recent.length, ok, time, fastEnough: time <= level.target };
}

export type Change = 'up' | 'down' | null;

/**
 * One answer (the first one given to a calculation): updates the stats, then
 * moves to the next level once mastered, or back one when it is too hard.
 */
export function recordAnswer(state: CalculState, p: Problem, ok: boolean, ms: number): { state: CalculState; change: Change } {
  const today = localDate();
  const clipped = Math.round(Math.min(ms, 60_000));
  const prev = state.stats[p.level] ?? { answered: 0, firstTry: 0, ms: 0 };
  const stats = { ...state.stats, [p.level]: { ...prev, answered: prev.answered + 1, firstTry: prev.firstTry + (ok ? 1 : 0), ms: prev.ms + clipped } };
  const day = state.days[today] ?? { done: 0, ok: 0 };
  const days = { ...state.days, [today]: { done: day.done + 1, ok: day.ok + (ok ? 1 : 0) } };
  const key = keyOf(p);
  const retry = ok ? state.retry.filter((k) => k !== key) : [...state.retry.filter((k) => k !== key), key].slice(-MAX_RETRY);
  const recent = [...state.recent, { ok, ms: clipped }].slice(-WINDOW);
  let next: CalculState = { ...state, stats, days, retry, recent, since: state.since + 1, updated: Date.now() };

  const level = levelById(state.level);
  const index = LEVELS.indexOf(level);
  const okCount = recent.filter((r) => r.ok).length;
  if (recent.length >= WINDOW && okCount >= MASTER_OK && median(recent.map((r) => r.ms)) <= level.target * 1000) {
    next.stats[level.id] = { ...next.stats[level.id], mastered: next.stats[level.id].mastered ?? today };
    if (index < LEVELS.length - 1) {
      next = { ...next, level: LEVELS[index + 1].id, since: 0, recent: [], retry: [] };
      return { state: next, change: 'up' };
    }
  }
  const last = recent.slice(-BACK_WINDOW);
  const before = LEVELS[index - 1];
  if (last.length >= BACK_WINDOW && last.filter((r) => !r.ok).length >= BACK_MISSES && before && before.op === level.op) {
    next = { ...next, level: before.id, since: 0, recent: [], retry: [] };
    return { state: next, change: 'down' };
  }
  return { state: next, change: null };
}
