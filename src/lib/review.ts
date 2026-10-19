'use client';

import { useSyncExternalStore } from 'react';
import { learnedWords, localDate, readPref, writePref, type LearnedWord } from '@/lib/progress';

/**
 * « Les mots qui reviennent »: a word comes back 1, 3, 7 and 14 days after it
 * was first learned, as a one-minute warm-up at the start of the flow (two
 * words at most). `mounas_review` keeps, per word, how many of these returns
 * are done; `mounas_learned` is only read.
 */

const LS_REVIEW = 'mounas_review';
export const REVIEW_DAYS = [1, 3, 7, 14];
export const MAX_REVIEW = 2;

function readStages(): Record<string, number> {
  try {
    const parsed = JSON.parse(readPref(LS_REVIEW) ?? '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const daysSince = (iso: string, today: string) =>
  Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${iso}T12:00:00`).getTime()) / 86_400_000);

/** The words due today (the longest-waiting first), except `excludeId`. */
export function dueReviews(excludeId: string, today = localDate()): LearnedWord[] {
  const stages = readStages();
  return learnedWords()
    .filter((w) => w.id !== excludeId && w.date)
    .map((w) => ({ w, days: daysSince(w.date, today), stage: stages[w.id] ?? 0 }))
    .filter(({ days, stage }) => stage < REVIEW_DAYS.length && days >= REVIEW_DAYS[stage])
    .sort((a, b) => b.days - REVIEW_DAYS[b.stage] - (a.days - REVIEW_DAYS[a.stage]))
    .slice(0, MAX_REVIEW)
    .map(({ w }) => w);
}

/** Done for today: a long gap counts once, it doesn't bring the word back day after day. */
export function markReviewed(words: LearnedWord[], today = localDate()): void {
  const stages = readStages();
  for (const w of words) stages[w.id] = REVIEW_DAYS.filter((d) => daysSince(w.date, today) >= d).length;
  writePref(LS_REVIEW, JSON.stringify(stages));
}

// Read once per word and day, so the step stays put while the child plays
// (marking the words as reviewed must not make it vanish mid-flow).
let cache: { key: string; json: string } | null = null;
const subscribeNoop = () => () => {};

export function useDueReviews(excludeId: string): LearnedWord[] {
  const json = useSyncExternalStore(
    subscribeNoop,
    () => {
      const key = `${localDate()}:${excludeId}`;
      if (cache?.key !== key) cache = { key, json: JSON.stringify(dueReviews(excludeId)) };
      return cache.json;
    },
    () => '[]',
  );
  return JSON.parse(json) as LearnedWord[];
}
