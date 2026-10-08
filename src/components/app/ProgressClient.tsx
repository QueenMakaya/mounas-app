'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { LEVELS, levelLabel } from '@/lib/levels';
import { SOUNDS } from '@/lib/phonics';
import { completedDays, currentStreak, learnedWords, localDate, type LearnedWord } from '@/lib/progress';

/*
 * "Nos progrès": what the family has done, from this device's history.
 * Numbers first (words, streak, days, time), then words per level against
 * what each level offers, the last 8 weeks, the sounds met, and the words.
 */

const MINUTES_PER_ACTIVITY = 10;
const WEEKS = 8;

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener('focus', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('focus', onChange);
  };
}
// A string snapshot so React can compare it cheaply between renders.
const snapshot = () => JSON.stringify({ learned: learnedWords(), days: [...completedDays()] });

const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export default function ProgressClient({ levelTotals, allSounds }: { levelTotals: Record<string, number>; allSounds: string[] }) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <Link href="/app" className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-ink hover:bg-ink/5">
          <span aria-hidden="true">←</span> Accueil
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">📊 Nos progrès</h1>
        <p className="mt-1 text-ink-soft">Tout ce que vous avez appris ensemble, sur ce téléphone.</p>
        {raw === null ? <div className="h-96" aria-hidden="true" /> : <Stats raw={raw} levelTotals={levelTotals} allSounds={allSounds} />}
      </div>
    </main>
  );
}

function Stats({ raw, levelTotals, allSounds }: { raw: string; levelTotals: Record<string, number>; allSounds: string[] }) {
  const { learned, days: dayList } = JSON.parse(raw) as { learned: LearnedWord[]; days: string[] };
  const days = new Set(dayList);
  const streak = currentStreak(days);
  const sessions = learned.reduce((t, l) => t + (l.times || 1), 0);
  const minutes = sessions * MINUTES_PER_ACTIVITY;
  const readAlone = learned.filter((l) => l.readAlone).length;

  if (learned.length === 0 && days.size === 0) {
    return (
      <div className="mt-8 rounded-[28px] bg-white p-8 text-center ring-1 ring-ink/5">
        <p className="text-5xl" aria-hidden="true">🌱</p>
        <h2 className="mt-3 font-display text-2xl font-bold text-ink">Votre aventure commence ici</h2>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">
          Terminez une première activité : chaque mot appris viendra s’ajouter à vos progrès.
        </p>
        <Link href="/app" className="mt-6 inline-flex min-h-14 items-center rounded-full bg-mred px-8 text-lg font-extrabold text-cream shadow-lg hover:bg-mred-dark">
          Le mot du jour →
        </Link>
      </div>
    );
  }

  const soundsMet = new Set(learned.flatMap((l) => l.sounds ?? []));
  const soundPool = allSounds.length ? allSounds : Object.keys(SOUNDS);

  return (
    <>
      {/* ── Headline numbers ── */}
      <section aria-label="En chiffres" className="mt-6 grid grid-cols-2 gap-3">
        <Tile value={learned.length} label={learned.length > 1 ? 'mots appris' : 'mot appris'} emoji="⭐" />
        <Tile value={streak} label={streak > 1 ? 'jours de suite' : 'jour de suite'} emoji="🔥" />
        <Tile value={readAlone} label={readAlone > 1 ? 'lus tout seul' : 'lu tout seul'} emoji="🎉" />
        <Tile value={minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}` : `${minutes} min`} label="ensemble (environ)" emoji="⏱" />
      </section>

      {/* ── Per level ── */}
      <section aria-labelledby="levels-title" className="mt-6 rounded-[28px] bg-white p-5 ring-1 ring-ink/5">
        <h2 id="levels-title" className="font-display text-xl font-bold text-ink">Mots appris par niveau</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {LEVELS.map((l) => {
            const done = learned.filter((w) => w.level === l.value).length;
            const total = Math.max(levelTotals[l.value] ?? 0, done);
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <li key={l.value}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-extrabold text-ink">
                    <span aria-hidden="true">{l.emoji}</span> {l.short} <span className="font-semibold text-ink-soft">· {l.label}</span>
                  </span>
                  <span className="font-bold tabular-nums text-ink-soft">
                    {done} / {total}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${l.short} : ${done} mots appris sur ${total}`}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={done}
                  className="h-3 overflow-hidden rounded-full bg-sand"
                >
                  <div className="h-full rounded-full bg-mteal-ink transition-[width] duration-700" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Last weeks ── */}
      <Calendar days={days} />

      {/* ── Sounds ── */}
      <section aria-labelledby="sounds-title" className="mt-6 rounded-[28px] bg-white p-5 ring-1 ring-ink/5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="sounds-title" className="font-display text-xl font-bold text-ink">Les sons rencontrés</h2>
          <span className="text-sm font-bold tabular-nums text-ink-soft">
            {soundsMet.size} / {soundPool.length}
          </span>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {soundPool
            .slice()
            .sort((a, b) => Number(soundsMet.has(b)) - Number(soundsMet.has(a)))
            .map((k) => {
              const met = soundsMet.has(k);
              return (
                <li
                  key={k}
                  className={`rounded-xl px-3 py-1.5 text-center ${met ? 'bg-[#FEF3E2] text-ink ring-1 ring-mamber/50' : 'bg-sand/50 text-ink/35'}`}
                  aria-label={`Son ${SOUNDS[k]?.hint ?? k} : ${met ? 'déjà rencontré' : 'pas encore'}`}
                >
                  <span className="block font-display text-lg font-bold leading-tight">{k}</span>
                  <span className="block text-[10px] font-extrabold">{SOUNDS[k]?.hint}</span>
                </li>
              );
            })}
        </ul>
      </section>

      {/* ── Words ── */}
      {learned.length > 0 && (
        <section aria-labelledby="words-title" className="mt-6 rounded-[28px] bg-white p-5 ring-1 ring-ink/5">
          <h2 id="words-title" className="font-display text-xl font-bold text-ink">Nos mots</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="py-2 font-extrabold">Mot</th>
                <th className="py-2 font-extrabold">Niveau</th>
                <th className="py-2 text-right font-extrabold">Appris le</th>
              </tr>
            </thead>
            <tbody>
              {[...learned].reverse().map((w) => (
                <tr key={w.id} className="border-t border-ink/5">
                  <td className="py-2.5">
                    <Link href={`/app/activity?id=${w.id}`} className="font-display text-base font-bold text-ink hover:underline">
                      {w.word.toLocaleLowerCase('fr')}
                    </Link>
                    {w.readAlone && (
                      <span className="ml-2 rounded-full bg-[#E5F4EC] px-2 py-0.5 text-[11px] font-extrabold text-[#2D9B6F]">lu seul</span>
                    )}
                    {w.times > 1 && <span className="ml-2 text-xs font-bold text-ink-soft">×{w.times}</span>}
                  </td>
                  <td className="py-2.5 text-ink-soft">{levelLabel(w.level)}</td>
                  <td className="py-2.5 text-right tabular-nums text-ink-soft">
                    {new Date(`${w.date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}

function Tile({ value, label, emoji }: { value: number | string; label: string; emoji: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 ring-1 ring-ink/5">
      <p className="text-sm font-bold text-ink-soft">
        <span aria-hidden="true">{emoji} </span>
        {label}
      </p>
      <p className="mt-1 font-display text-4xl font-bold tabular-nums text-ink">{value}</p>
    </div>
  );
}

/** The last 8 weeks, Monday to Sunday; a filled square = an activity that day. */
function Calendar({ days }: { days: Set<string> }) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - (WEEKS - 1) * 7);
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + w * 7 + d);
      const key = localDate(date);
      return { key, done: days.has(key), future: date > today };
    }),
  );
  const inRange = weeks.flat().filter((d) => d.done).length;
  return (
    <section aria-labelledby="cal-title" className="mt-6 rounded-[28px] bg-white p-5 ring-1 ring-ink/5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="cal-title" className="font-display text-xl font-bold text-ink">Les 8 dernières semaines</h2>
        <span className="text-sm font-bold tabular-nums text-ink-soft">
          {inRange} jour{inRange > 1 ? 's' : ''} d’activité
        </span>
      </div>
      <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-2">
        <div className="grid grid-rows-7 gap-1 text-[10px] font-bold text-ink-soft" aria-hidden="true">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((l, i) => (
            <span key={i} className="flex h-full items-center">{l}</span>
          ))}
        </div>
        <div className="grid grid-flow-col grid-cols-8 grid-rows-7 gap-1">
          {weeks.flat().map((d) => (
            <span
              key={d.key}
              title={`${longDate(d.key)} : ${d.done ? 'activité faite' : d.future ? 'à venir' : 'pas d’activité'}`}
              aria-label={`${longDate(d.key)} : ${d.done ? 'activité faite' : d.future ? 'à venir' : 'pas d’activité'}`}
              role="img"
              className={`aspect-square rounded-[4px] ${d.done ? 'bg-mamber' : d.future ? 'bg-transparent ring-1 ring-ink/5' : 'bg-sand'} ${d.key === localDate(today) ? 'ring-2 ring-mred' : ''}`}
            />
          ))}
        </div>
      </div>
      <p className="mt-3 flex items-center gap-3 text-xs font-bold text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-[3px] bg-mamber" /> activité faite
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-[3px] bg-sand" /> pas d’activité
        </span>
      </p>
    </section>
  );
}
