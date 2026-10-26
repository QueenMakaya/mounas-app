'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { localDate } from '@/lib/progress';
import { mergeSnapshots, parseSnapshot, type Snapshot } from '@/lib/progress-snapshot';

/**
 * Keeps a signed-in parent's progress in step with their Airtable row
 * (src/app/app/api/progression/route.ts), so it follows them to a new phone
 * and Pam sees who uses the app. Rendered only for members (app layout).
 *
 * - On arrival: the saved progress is merged into this device (nothing is
 *   ever removed), then whatever this device had on top is sent back. That
 *   is also how a word done before logging in reaches the account.
 * - Then: the device's progress is sent whenever it changed, checked on
 *   every page change, every 20 s while the app is open, when a mission is
 *   saved and when the app goes to the background.
 *
 * The localStorage keys are the ones of src/lib/progress.ts,
 * src/lib/mission-progress.ts, src/lib/review.ts and src/lib/calcul.ts; their own code is left
 * untouched. Without network or storage, the app works exactly as before.
 */

const ENDPOINT = '/app/api/progression';
const COMPLETED = /^mounas_completed_(.+)_(\d{4}-\d{2}-\d{2})$/;
const KEEP_COMPLETED_DAYS = 45;

function readJson(key: string): unknown {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

/** First day still kept day by day (the server drops older ones too). */
function keepFrom(): string {
  const since = new Date();
  since.setDate(since.getDate() - KEEP_COMPLETED_DAYS);
  return localDate(since);
}

function readLocal(): Snapshot {
  const completed: string[] = [];
  const from = keepFrom();
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const m = window.localStorage.key(i)?.match(COMPLETED);
      if (m && m[2] >= from && window.localStorage.getItem(m[0]) === 'true') completed.push(`${m[1]}_${m[2]}`);
    }
  } catch {
    // storage unavailable
  }
  return parseSnapshot({
    days: readJson('mounas_days'),
    seen: readJson('mounas_seen_words'),
    learned: readJson('mounas_learned'),
    missions: readJson('mounas_missions'),
    completed,
    review: readJson('mounas_review'),
    calcul: readJson('mounas_calcul'),
  });
}

function writeLocal(s: Snapshot): void {
  try {
    const ls = window.localStorage;
    ls.setItem('mounas_days', JSON.stringify(s.days));
    ls.setItem('mounas_seen_words', JSON.stringify(s.seen));
    ls.setItem('mounas_learned', JSON.stringify(s.learned));
    ls.setItem('mounas_missions', JSON.stringify(s.missions));
    ls.setItem('mounas_review', JSON.stringify(s.review));
    if (s.calcul.updated > 0) ls.setItem('mounas_calcul', JSON.stringify(s.calcul));
    const from = keepFrom();
    for (const key of s.completed) {
      const cut = key.lastIndexOf('_');
      if (key.slice(cut + 1) >= from) ls.setItem(`mounas_completed_${key.slice(0, cut)}_${key.slice(cut + 1)}`, 'true');
    }
    window.dispatchEvent(new Event('mounas-missions'));
    window.dispatchEvent(new Event('mounas-calcul'));
  } catch {
    // storage unavailable: this device keeps its own progress
  }
}

/** Order-independent form, to tell whether anything changed. */
function fingerprint(s: Snapshot): string {
  return JSON.stringify({
    ...s,
    days: [...s.days].sort(),
    seen: [...s.seen].sort(),
    completed: [...s.completed].sort(),
    learned: [...s.learned].sort((a, b) => a.id.localeCompare(b.id)),
    missions: Object.fromEntries(Object.entries(s.missions).sort(([a], [b]) => a.localeCompare(b))),
    review: Object.fromEntries(Object.entries(s.review).sort(([a], [b]) => a.localeCompare(b))),
  });
}

async function call(init?: RequestInit): Promise<Snapshot | null> {
  try {
    const res = await fetch(ENDPOINT, { cache: 'no-store', ...init });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    const { snapshot } = (await res.json()) as { snapshot?: unknown };
    return snapshot ? parseSnapshot(snapshot) : null;
  } catch {
    return null;
  }
}

export default function ProgressSync() {
  const pathname = usePathname();
  // What the server is known to hold; null until the first read succeeds.
  const synced = useRef<string | null>(null);
  const busy = useRef(false);
  const push = useRef<(keepalive?: boolean) => void>(() => {});

  useEffect(() => {
    let alive = true;

    push.current = (keepalive = false) => {
      if (synced.current === null || busy.current) return;
      const local = readLocal();
      const print = fingerprint(local);
      if (print === synced.current) return;
      busy.current = true;
      void call({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: local, today: localDate() }),
        keepalive,
      }).then((saved) => {
        busy.current = false;
        if (!alive || !saved) return;
        // Another device may have added something meanwhile: bring it here.
        const merged = mergeSnapshots(saved, readLocal());
        if (fingerprint(merged) !== fingerprint(readLocal())) writeLocal(merged);
        synced.current = fingerprint(saved);
      });
    };

    void call().then((saved) => {
      if (!alive || !saved) return;
      const merged = mergeSnapshots(saved, readLocal());
      if (fingerprint(merged) !== fingerprint(readLocal())) writeLocal(merged);
      synced.current = fingerprint(saved);
      push.current();
    });

    const tick = () => {
      if (document.visibilityState === 'visible') push.current();
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') push.current(true);
    };
    const onMission = () => setTimeout(() => push.current(), 500);
    const timer = window.setInterval(tick, 20_000);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('mounas-missions', onMission);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('mounas-missions', onMission);
    };
  }, []);

  useEffect(() => {
    push.current();
  }, [pathname]);

  return null;
}
