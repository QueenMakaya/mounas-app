'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Activity } from '@/lib/airtable';

type Props = {
  themes: string[];
  allActivities: Activity[];
};

const DIFFICULTY_OPTIONS = [
  { value: '1', label: '1 · Tout-petit (1-3 ans)' },
  { value: '2', label: '2 · Petit (3-4 ans)' },
  { value: '3', label: '3 · Grand (4-5 ans)' },
  { value: '4', label: '4 · Pré-scolaire (5+ ans)' },
];

const LS_SEEN = 'mounas_seen_words';
const LS_LAST_THEME = 'mounas_last_theme';
const LS_LAST_DIFFICULTY = 'mounas_last_difficulty';

export default function SelectorClient({ themes, allActivities }: Props) {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [noMatchFound, setNoMatchFound] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rawSeen = localStorage.getItem(LS_SEEN);
    if (rawSeen) {
      try {
        const parsed = JSON.parse(rawSeen);
        if (Array.isArray(parsed)) {
          setSeenIds(parsed.filter((x): x is string => typeof x === 'string'));
        }
      } catch {
        // corrupt entry — ignore
      }
    }
    const lastTheme = localStorage.getItem(LS_LAST_THEME);
    if (lastTheme !== null) setSelectedTheme(lastTheme);
    const lastDifficulty = localStorage.getItem(LS_LAST_DIFFICULTY);
    if (lastDifficulty !== null) setSelectedDifficulty(lastDifficulty);
  }, []);

  useEffect(() => {
    if (currentActivity && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentActivity]);

  const generateWord = () => {
    const filtered = allActivities.filter((a) => {
      if (selectedTheme && a.theme !== selectedTheme) return false;
      if (selectedDifficulty && a.difficulty !== selectedDifficulty) return false;
      return true;
    });

    if (filtered.length === 0) {
      setCurrentActivity(null);
      setNoMatchFound(true);
      return;
    }

    const unseen = filtered.filter((a) => !seenIds.includes(a.id));
    const pool = unseen.length > 0 ? unseen : filtered;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    setCurrentActivity(picked);
    setNoMatchFound(false);

    localStorage.setItem(LS_LAST_THEME, selectedTheme);
    localStorage.setItem(LS_LAST_DIFFICULTY, selectedDifficulty);
  };

  const handleStartActivity = (activityId: string) => {
    const newSeenIds = seenIds.includes(activityId)
      ? seenIds
      : [...seenIds, activityId];
    setSeenIds(newSeenIds);
    localStorage.setItem(LS_SEEN, JSON.stringify(newSeenIds));
    router.push(`/activity?id=${activityId}`);
  };

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: '#FDF6EC', fontFamily: 'var(--font-nunito)' }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        {/* A. HEADER */}
        <div className="mb-8">
          <a
            href="/"
            className="text-sm font-semibold"
            style={{ color: '#1A1A1A' }}
          >
            ← Retour
          </a>
          <h1
            className="text-4xl font-bold text-center mt-6"
            style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}
          >
            Choisis un nouveau mot
          </h1>
          <p className="text-center mt-3" style={{ color: '#5F5E5A' }}>
            Sélectionne thème + niveau de difficulté
          </p>
        </div>

        {/* B. FILTER CARD */}
        <div
          className="rounded-3xl p-8"
          style={{
            backgroundColor: '#FDF6EC',
            border: '1px solid rgba(26,26,26,0.15)',
          }}
        >
          <label
            htmlFor="theme-select"
            className="block text-xs uppercase tracking-widest mb-2 font-bold"
            style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}
          >
            Thème
          </label>
          <select
            id="theme-select"
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#E63946]"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1A1A1A',
              border: '1px solid rgba(26,26,26,0.2)',
            }}
          >
            <option value="">Tous les thèmes</option>
            {themes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <label
            htmlFor="difficulty-select"
            className="block text-xs uppercase tracking-widest mb-2 mt-6 font-bold"
            style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}
          >
            Difficulté
          </label>
          <select
            id="difficulty-select"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#E63946]"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1A1A1A',
              border: '1px solid rgba(26,26,26,0.2)',
            }}
          >
            <option value="">Toutes les difficultés</option>
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <div className="mt-8 flex justify-center">
            <button
              onClick={generateWord}
              className="rounded-full py-4 px-8 text-lg font-bold shadow-lg transition-colors duration-200 bg-[#E63946] hover:bg-red-700"
              style={{ color: '#FDF6EC' }}
            >
              ✨ Générer un mot
            </button>
          </div>
        </div>

        {/* C. RESULT CARD */}
        {currentActivity && (
          <div
            ref={resultRef}
            className="mt-8 rounded-3xl p-8 text-center"
            style={{
              backgroundColor: '#FDF6EC',
              border: '2px dashed #F4A340',
            }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: 'rgba(26,26,26,0.6)' }}
            >
              Mot proposé
            </p>
            <h2
              className="text-7xl sm:text-8xl font-bold mb-4 leading-none"
              style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}
            >
              {currentActivity.frenchWord}
            </h2>
            <span
              className="inline-block rounded-full px-4 py-2 text-sm mb-2"
              style={{ backgroundColor: '#CCFBF1', color: '#115E59' }}
            >
              {currentActivity.theme} · Niveau {currentActivity.difficulty}
            </span>
            {seenIds.includes(currentActivity.id) && (
              <p
                className="text-xs italic mt-2"
                style={{ color: '#6B7280' }}
              >
                ✓ déjà découvert
              </p>
            )}

            <div className="flex flex-wrap gap-3 justify-center mt-8">
              <button
                onClick={() => handleStartActivity(currentActivity.id)}
                className="rounded-full py-3 px-6 font-bold shadow-md transition-colors duration-200 bg-[#E63946] hover:bg-red-700"
                style={{ color: '#FDF6EC' }}
              >
                Commencer l'activité →
              </button>
              <button
                onClick={generateWord}
                className="rounded-full py-3 px-6 font-bold shadow-md transition-colors duration-200 bg-[#F4A340] hover:bg-yellow-500"
                style={{ color: '#1A1A1A' }}
              >
                🎲 Un autre mot
              </button>
            </div>
          </div>
        )}

        {/* D. NO MATCH */}
        {noMatchFound && !currentActivity && (
          <div
            className="mt-8 text-center italic"
            style={{ color: '#6B7280' }}
          >
            <p>Aucun mot trouvé avec ces filtres.</p>
            <p className="text-sm mt-1">Essaie d&apos;autres combinaisons !</p>
          </div>
        )}

        {/* E. FOOTER */}
        <footer className="mt-16 text-center">
          <a
            href="/"
            className="text-sm underline"
            style={{ color: '#5B1F8C' }}
          >
            ← Retour à l&apos;accueil
          </a>
        </footer>
      </div>
    </main>
  );
}
