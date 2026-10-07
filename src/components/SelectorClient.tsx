'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Activity } from '@/lib/airtable';
import { LEVELS, levelLabel } from '@/lib/levels';
import { markSeen, readPref, seenWords, writePref } from '@/lib/progress';
import SyllableWord from '@/components/app/SyllableWord';
import SpeakButton from '@/components/app/SpeakButton';

type Props = {
  themes: string[];
  allActivities: Activity[];
};

const LS_LAST_THEME = 'mounas_last_theme';
const LS_LAST_DIFFICULTY = 'mounas_last_difficulty';

/**
 * Word picker. Filters are tap-friendly chips (no dropdowns to open), the
 * result count updates live so a parent never hits a dead end, and every
 * matching word is visible as a card — pick one, or let "Surprends-moi" do it.
 */
export default function SelectorClient({ themes, allActivities }: Props) {
  const router = useRouter();
  const [theme, setTheme] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [surprise, setSurprise] = useState<Activity | null>(null);
  const surpriseRef = useRef<HTMLDivElement>(null);

  // Restore the family's last filters and seen words (browser-only storage).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from localStorage after hydration */
    setSeenIds(seenWords());
    setTheme(readPref(LS_LAST_THEME) ?? '');
    setDifficulty(readPref(LS_LAST_DIFFICULTY) ?? '');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (surprise) surpriseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [surprise]);

  const filtered = allActivities.filter(
    (a) => (!theme || a.theme === theme) && (!difficulty || a.difficulty === difficulty),
  );
  const unseenCount = filtered.filter((a) => !seenIds.includes(a.id)).length;

  const choose = (setter: (v: string) => void, key: string, value: string) => {
    setter(value);
    writePref(key, value);
    setSurprise(null);
  };

  const surpriseMe = () => {
    if (filtered.length === 0) return;
    const unseen = filtered.filter((a) => !seenIds.includes(a.id) && a.id !== surprise?.id);
    const pool = unseen.length > 0 ? unseen : filtered.filter((a) => a.id !== surprise?.id);
    const list = pool.length > 0 ? pool : filtered;
    setSurprise(list[Math.floor(Math.random() * list.length)]);
  };

  const start = (id: string) => {
    setSeenIds(markSeen(id));
    router.push(`/app/activity?id=${id}`);
  };

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <Link
          href="/app"
          className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-ink hover:bg-ink/5"
        >
          <span aria-hidden="true">←</span> Accueil
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">Choisis un mot</h1>
        <p className="mt-1 text-ink-soft">Pour quel âge, et sur quel thème ?</p>

        {/* ── Filters ── */}
        <section className="mt-6 rounded-[28px] bg-white p-5 ring-1 ring-ink/5 sm:p-6">
          <fieldset>
            <legend className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">Âge de l’enfant</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Chip on={difficulty === ''} onClick={() => choose(setDifficulty, LS_LAST_DIFFICULTY, '')} className="col-span-2 sm:col-span-1">
                Tous les âges
              </Chip>
              {LEVELS.map((l) => (
                <Chip key={l.value} on={difficulty === l.value} onClick={() => choose(setDifficulty, LS_LAST_DIFFICULTY, l.value)}>
                  <span aria-hidden="true">{l.emoji}</span> {l.short}
                  <span className="block text-[11px] font-semibold opacity-70">{l.label}</span>
                </Chip>
              ))}
            </div>
          </fieldset>

          {themes.length > 0 && (
            <fieldset className="mt-6">
              <legend className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">Thème</legend>
              <div className="flex flex-wrap gap-2">
                <Chip on={theme === ''} onClick={() => choose(setTheme, LS_LAST_THEME, '')} pill>
                  Tous
                </Chip>
                {themes.map((t) => (
                  <Chip key={t} on={theme === t} onClick={() => choose(setTheme, LS_LAST_THEME, t)} pill>
                    {t}
                  </Chip>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-6 flex flex-col items-center gap-3 border-t border-ink/5 pt-5 sm:flex-row sm:justify-between">
            <p className="text-sm font-bold text-ink-soft" aria-live="polite">
              {filtered.length === 0
                ? 'Aucun mot avec ces choix'
                : `${filtered.length} mot${filtered.length > 1 ? 's' : ''}${unseenCount < filtered.length ? ` · ${unseenCount} jamais vu${unseenCount > 1 ? 's' : ''}` : ''}`}
            </p>
            <button
              type="button"
              onClick={surpriseMe}
              disabled={filtered.length === 0}
              className="min-h-14 w-full rounded-full bg-mred px-7 text-lg font-extrabold text-cream shadow-lg transition-transform hover:bg-mred-dark active:scale-[0.98] disabled:opacity-40 sm:w-auto"
            >
              🎲 Surprends-moi
            </button>
          </div>
        </section>

        {/* ── Surprise result ── */}
        {surprise && (
          <div
            ref={surpriseRef}
            key={surprise.id}
            className="animate-rise mt-6 overflow-hidden rounded-[28px] bg-white text-center shadow-[0_10px_40px_-12px_rgba(26,26,26,0.2)] ring-1 ring-ink/5"
          >
            <div className="h-2 bg-gradient-to-r from-mred via-mamber to-mteal" />
            <div className="p-6 sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-mred">Et le mot est…</p>
              <p className="mt-3 break-words font-display text-6xl font-bold leading-none sm:text-7xl">
                <SyllableWord word={surprise.frenchWord} syllables={surprise.syllables} />
              </p>
              <div className="mt-4 flex justify-center">
                <SpeakButton text={surprise.frenchWord} tone="soft" />
              </div>
              <p className="mt-4 text-sm font-bold text-ink-soft">
                {[surprise.theme, levelLabel(surprise.difficulty)].filter(Boolean).join(' · ')}
                {seenIds.includes(surprise.id) && ' · ✓ déjà vu'}
              </p>
              <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
                <button
                  type="button"
                  onClick={() => start(surprise.id)}
                  className="min-h-14 rounded-full bg-ink px-6 text-lg font-extrabold text-cream shadow-md active:scale-[0.98]"
                >
                  C’est parti <span aria-hidden="true">→</span>
                </button>
                <button
                  type="button"
                  onClick={surpriseMe}
                  className="min-h-12 rounded-full px-6 font-bold text-ink ring-1 ring-ink/15 hover:bg-sand"
                >
                  🎲 Un autre
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── All matching words ── */}
        {filtered.length > 0 ? (
          <section className="mt-8" aria-labelledby="all-words">
            <h2 id="all-words" className="mb-3 font-display text-xl font-bold text-ink">Tous les mots</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((a) => {
                const seen = seenIds.includes(a.id);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => start(a.id)}
                      className="relative flex h-full w-full flex-col items-center rounded-3xl bg-white px-3 pb-4 pt-6 text-center ring-1 ring-ink/5 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                    >
                      {seen && (
                        <span className="absolute right-3 top-3 rounded-full bg-mteal-light px-2 py-0.5 text-[11px] font-extrabold text-[#115E59]">
                          ✓ vu
                        </span>
                      )}
                      <span className="break-words font-display text-3xl font-bold leading-tight">
                        <SyllableWord word={a.frenchWord} syllables={a.syllables} />
                      </span>
                      <span className="mt-2 text-xs font-bold text-ink-soft">
                        {[a.theme, levelLabel(a.difficulty)].filter(Boolean).join(' · ')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-ink/15 p-8 text-center">
            <p className="text-4xl" aria-hidden="true">🔍</p>
            <p className="mt-2 font-bold text-ink">Pas encore de mot pour ce choix.</p>
            <button
              type="button"
              onClick={() => {
                choose(setTheme, LS_LAST_THEME, '');
                choose(setDifficulty, LS_LAST_DIFFICULTY, '');
              }}
              className="mt-3 font-bold text-mpurple underline underline-offset-4"
            >
              Voir tous les mots
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Chip({ on, onClick, pill = false, className = '', children }: { on: boolean; onClick: () => void; pill?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-12 px-4 py-2 text-sm font-extrabold transition-colors ${className} ${pill ? 'rounded-full' : 'rounded-2xl'} ${
        on ? 'bg-ink text-cream shadow-md' : 'bg-cream text-ink ring-1 ring-ink/10 hover:bg-sand'
      }`}
    >
      {children}
    </button>
  );
}
