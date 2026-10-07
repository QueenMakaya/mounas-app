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

const pickRandom = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
const LS_LAST_DIFFICULTY = 'mounas_last_difficulty';

/**
 * Word picker. The parent picks the child's level first; only then do the
 * words of that level (and the themes they cover) appear, so nobody starts
 * in front of the whole library. Filters are tap-friendly chips, the count
 * updates live, and "Surprends-moi" picks a word the child hasn't seen yet.
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
    // Only restore a real level — older visits could have saved "all levels".
    const lastLevel = readPref(LS_LAST_DIFFICULTY) ?? '';
    setDifficulty(LEVELS.some((l) => l.value === lastLevel) ? lastLevel : '');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (surprise) surpriseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [surprise]);

  const atLevel = difficulty ? allActivities.filter((a) => a.difficulty === difficulty) : [];
  const levelThemes = themes.filter((t) => atLevel.some((a) => a.theme === t));
  // A theme remembered from another level may not exist here — ignore it.
  const activeTheme = levelThemes.includes(theme) ? theme : '';
  const filtered = atLevel.filter((a) => !activeTheme || a.theme === activeTheme);
  const countAt = (level: string) => allActivities.filter((a) => a.difficulty === level).length;
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
    setSurprise(pickRandom(list));
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
        <p className="mt-1 text-ink-soft">Commence par le niveau de ton enfant.</p>

        {/* ── Filters ── */}
        <section className="mt-6 rounded-[28px] bg-white p-5 ring-1 ring-ink/5 sm:p-6">
          <fieldset>
            <legend className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">1 · Le niveau</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LEVELS.map((l) => (
                <Chip key={l.value} on={difficulty === l.value} onClick={() => choose(setDifficulty, LS_LAST_DIFFICULTY, l.value)}>
                  <span aria-hidden="true">{l.emoji}</span> {l.short}
                  <span className="block text-[11px] font-semibold opacity-70">{l.label}</span>
                  <span className="block text-[11px] font-semibold opacity-50">{countAt(l.value)} mot{countAt(l.value) > 1 ? 's' : ''}</span>
                </Chip>
              ))}
            </div>
          </fieldset>

          {!difficulty && (
            <p className="mt-5 rounded-2xl bg-cream p-4 text-center font-bold text-ink-soft">
              <span aria-hidden="true">👆 </span>Choisis un niveau pour voir ses mots.
            </p>
          )}

          {difficulty && levelThemes.length > 1 && (
            <fieldset className="mt-6">
              <legend className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">2 · Le thème (si tu veux)</legend>
              <div className="flex flex-wrap gap-2">
                <Chip on={activeTheme === ''} onClick={() => choose(setTheme, LS_LAST_THEME, '')} pill>
                  Tous
                </Chip>
                {levelThemes.map((t) => (
                  <Chip key={t} on={activeTheme === t} onClick={() => choose(setTheme, LS_LAST_THEME, t)} pill>
                    {t}
                  </Chip>
                ))}
              </div>
            </fieldset>
          )}

          {difficulty && (
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
          )}
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
        {!difficulty ? null : filtered.length > 0 ? (
          <section className="mt-8" aria-labelledby="all-words">
            <h2 id="all-words" className="mb-3 font-display text-xl font-bold text-ink">
              Les mots du {LEVELS.find((l) => l.value === difficulty)?.short}
            </h2>
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
                      <span className={`max-w-full break-words font-display font-bold leading-tight ${a.frenchWord.length > 7 ? 'text-xl sm:text-2xl' : 'text-3xl'}`}>
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
            <p className="mt-2 font-bold text-ink">Pas encore de mot prêt pour ce niveau.</p>
            <button
              type="button"
              onClick={() => choose(setDifficulty, LS_LAST_DIFFICULTY, '')}
              className="mt-3 font-bold text-mpurple underline underline-offset-4"
            >
              Choisir un autre niveau
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
