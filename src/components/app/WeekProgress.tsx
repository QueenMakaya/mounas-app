'use client';

import { useSyncExternalStore } from 'react';
import { completedDays, currentStreak, localDate } from '@/lib/progress';

const LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener('focus', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('focus', onChange);
  };
}

// Snapshot as a string so React can compare it cheaply between renders.
const snapshot = () => [...completedDays()].sort().join(',');

/**
 * This week at a glance (Mon → Sun) plus the current streak. A small,
 * honest habit loop: parents see the days they showed up, never a "failure".
 */
export default function WeekProgress() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  if (raw === null) return <div className="h-[92px]" aria-hidden="true" />;

  const days = new Set(raw ? raw.split(',') : []);
  const streak = currentStreak(days);
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const week = LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = localDate(d);
    return { label, name: NAMES[i], key, done: days.has(key), isToday: key === localDate(today), future: d > today };
  });
  const doneThisWeek = week.filter((d) => d.done).length;

  return (
    <section aria-label="Ta semaine" className="rounded-3xl bg-white p-4 ring-1 ring-ink/5 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-extrabold text-ink">Ta semaine</p>
        <p className="text-sm font-bold text-morange-ink">
          {streak > 0 ? (
            <><span aria-hidden="true">🔥</span> {streak} jour{streak > 1 ? 's' : ''} de suite</>
          ) : (
            <span className="text-ink-soft">{doneThisWeek}/7 cette semaine</span>
          )}
        </p>
      </div>
      <ol className="flex justify-between gap-1">
        {week.map((d) => (
          <li key={d.key} className="flex flex-col items-center gap-1.5">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold sm:h-10 sm:w-10 ${
                d.done
                  ? 'bg-mamber text-ink'
                  : d.isToday
                    ? 'border-2 border-dashed border-mred bg-white text-ink'
                    : 'bg-sand text-ink/35'
              }`}
              role="img"
              aria-label={`${d.name}${d.isToday ? " (aujourd'hui)" : ''} : ${d.done ? 'fait' : d.future ? 'à venir' : 'pas fait'}`}
            >
              {d.done ? '★' : ''}
            </span>
            <span className={`text-[11px] font-bold ${d.isToday ? 'text-mred' : 'text-ink-soft'}`} aria-hidden="true">
              {d.isToday ? 'auj.' : d.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
