'use client';

import { useState } from 'react';
import type { Activity } from '@/lib/airtable';
import { readPref, writePref } from '@/lib/progress';

/*
 * « Ma phrase et ma comptine » (it was « Chanson »), on one screen:
 *
 * 1. Ma phrase: the child invents a sentence with the word (the example
 *    sentence is there for inspiration), the parent writes it down, the app
 *    can read it back. Kept on the device (`mounas_phrases`, one per word).
 * 2. La comptine, right under it: recited (default) or sung; from level 3,
 *    « Par cœur » hides more and more words so the child learns it. A word
 *    with no poem in Airtable gets « Dis ta phrase » instead, sung or recited.
 */

type Say = (text: string, rate?: number) => void;

const LS_PHRASES = 'mounas_phrases';

function savedPhrase(id: string): string {
  try {
    const all = JSON.parse(readPref(LS_PHRASES) ?? '{}');
    return typeof all?.[id] === 'string' ? all[id] : '';
  } catch {
    return '';
  }
}

function savePhrase(id: string, text: string): void {
  try {
    const all = JSON.parse(readPref(LS_PHRASES) ?? '{}');
    writePref(LS_PHRASES, JSON.stringify({ ...(all && typeof all === 'object' ? all : {}), [id]: text }));
  } catch {
    writePref(LS_PHRASES, JSON.stringify({ [id]: text }));
  }
}

const HOW = {
  reciter: { label: '🗣️ La réciter', tip: 'Dis-la bien fort, lentement, comme un vrai poète.' },
  chanter: { label: '🎵 La chanter', tip: 'Invente un petit air et tape dans tes mains à chaque syllabe.' },
} as const;

export default function PhrasePoem({
  activity: a,
  accent,
  tint,
  canSpeak,
  speak,
  onSuccess,
}: {
  activity: Activity;
  accent: string;
  tint: string;
  canSpeak: boolean;
  speak: Say;
  onSuccess: () => void;
}) {
  const level = parseInt(a.difficulty, 10) || 1;
  const word = a.frenchWord.toLocaleLowerCase('fr');
  // Read once, when the step opens (client only: the flow renders after hydration).
  const [phrase, setPhrase] = useState(() => (typeof window === 'undefined' ? '' : savedPhrase(a.id)));
  const [how, setHow] = useState<keyof typeof HOW>('reciter');
  const [done, setDone] = useState(false);
  const poem = a.songLyrics.trim();

  return (
    <>
      <div className="rounded-3xl p-4 text-left sm:p-5" style={{ backgroundColor: tint }}>
        <h3 className="font-display text-xl font-bold text-ink">✍️ Ma phrase</h3>
        <p className="mt-1 text-ink">
          Invente une phrase avec le mot <strong className="font-display text-lg">{word}</strong>.
          {a.exampleSentence && (
            <span className="block text-sm text-ink-soft">
              Par exemple : « {a.exampleSentence} »{' '}
              {canSpeak && (
                <button type="button" onClick={() => speak(a.exampleSentence, 0.8)} aria-label="Écouter l’exemple" className="align-middle">
                  🔈
                </button>
              )}
            </span>
          )}
        </p>
        <div className="mt-3 flex items-start gap-2">
          <textarea
            id="ma-phrase"
            aria-label="La phrase de l’enfant (le parent l’écrit)"
            value={phrase}
            onChange={(e) => {
              setPhrase(e.target.value);
              savePhrase(a.id, e.target.value);
            }}
            rows={2}
            placeholder={`Le parent écrit la phrase de l’enfant : « Mon ${word}… »`}
            className="min-w-0 flex-1 rounded-2xl bg-white p-3 font-display text-lg text-ink ring-1 ring-ink/15 placeholder:font-body placeholder:text-sm focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as string]: accent }}
          />
          {canSpeak && phrase.trim() && (
            <button
              type="button"
              onClick={() => speak(phrase, 0.8)}
              aria-label="Écouter ma phrase"
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-xl ring-1 ring-ink/15"
            >
              🔈
            </button>
          )}
        </div>
      </div>

      {poem ? (
        <Poem title={a.songTitle} text={poem} level={level} accent={accent} canSpeak={canSpeak} speak={speak} />
      ) : (
        <div className="mt-4 rounded-3xl bg-white p-4 text-left ring-1 ring-ink/10 sm:p-5">
          <h3 className="font-display text-xl font-bold text-ink">🗣️ Dis ta phrase</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(HOW) as (keyof typeof HOW)[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setHow(k)}
                aria-pressed={how === k}
                className={`min-h-11 rounded-full px-4 text-sm font-bold ring-1 ${how === k ? 'text-cream ring-transparent' : 'bg-cream text-ink ring-ink/10'}`}
                style={how === k ? { backgroundColor: accent } : undefined}
              >
                {HOW[k].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-soft">{HOW[how].tip}</p>
        </div>
      )}

      <div className="mt-4 text-center">
        {!done ? (
          <button
            type="button"
            onClick={() => {
              setDone(true);
              onSuccess();
            }}
            className="min-h-12 rounded-full bg-[#2D9B6F] px-6 font-extrabold text-cream shadow-md active:scale-95"
          >
            {poem ? '✓ Ma phrase est faite, la comptine est dite !' : '✓ J’ai dit ma phrase !'}
          </button>
        ) : (
          <p className="font-display text-xl font-bold text-[#2D9B6F]" aria-live="polite">
            Bravo, quel beau travail ! 🌟
          </p>
        )}
      </div>
    </>
  );
}

/** The word's little poem: read, sung or recited; « Par cœur » from level 3. */
function Poem({ title, text, level, accent, canSpeak, speak }: { title: string; text: string; level: number; accent: string; canSpeak: boolean; speak: Say }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const [how, setHow] = useState<'reciter' | 'chanson' | 'coeur'>('reciter');
  // « Par cœur »: 0 = everything shown, then more and more words hidden.
  const [hide, setHide] = useState(0);
  const advanced = level >= 3;

  // Hidden: every third word, then all but the first word of each line, then everything.
  const shown = (i: number, j: number) => {
    if (how !== 'coeur' || hide === 0) return true;
    if (hide >= 3) return false;
    if (hide === 2) return j === 0;
    return (j + i) % 3 !== 2;
  };

  type How = 'reciter' | 'chanson' | 'coeur';
  const modes: [How, string][] = [
    ['reciter', '🗣️ La réciter'],
    ['chanson', '🎵 La chanter'],
    ...(advanced ? ([['coeur', '🧠 Par cœur']] as [How, string][]) : []),
  ];

  return (
    <div className="mt-4 rounded-3xl bg-white p-4 text-left ring-1 ring-ink/10 sm:p-5">
      <h3 className="font-display text-xl font-bold text-ink">📜 La comptine{title ? ` · ${title}` : ''}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {modes.map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setHow(k);
              setHide(k === 'coeur' ? 1 : 0);
            }}
            aria-pressed={how === k}
            className={`min-h-11 rounded-full px-4 text-sm font-bold ring-1 ${how === k ? 'text-cream ring-transparent' : 'bg-cream text-ink ring-ink/10'}`}
            style={how === k ? { backgroundColor: accent } : undefined}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {how === 'chanson' && 'Chantez-la ensemble en tapant dans les mains. Inventez des gestes pour chaque ligne !'}
        {how === 'reciter' && 'Lisez-la ensemble, puis récite-la bien fort, comme au spectacle. Touche une ligne pour l’entendre.'}
        {how === 'coeur' && 'Les mots se cachent petit à petit : redis la comptine de mémoire, puis cache-en encore plus.'}
      </p>
      <ol className="mt-4 space-y-2">
        {lines.map((line, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => canSpeak && speak(line, 0.8)}
              className="w-full rounded-2xl px-3 py-2 text-left font-display text-lg italic leading-relaxed text-ink hover:bg-cream sm:text-xl"
            >
              {line.split(/\s+/).map((w, j) => (
                <span key={j}>
                  {shown(i, j) ? w : <span className="inline-block min-w-10 border-b-2 border-dashed border-ink/40 align-baseline text-transparent">{w}</span>}{' '}
                </span>
              ))}
            </button>
          </li>
        ))}
      </ol>
      {how === 'coeur' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hide < 3 && (
            <button type="button" onClick={() => setHide(hide + 1)} className="min-h-11 rounded-full bg-ink px-5 font-bold text-cream">
              Cacher plus de mots
            </button>
          )}
          <button type="button" onClick={() => setHide(hide === 0 ? 1 : 0)} className="min-h-11 rounded-full bg-white px-5 font-bold text-ink ring-1 ring-ink/15">
            {hide === 0 ? 'Cacher des mots' : 'Tout montrer'}
          </button>
        </div>
      )}
    </div>
  );
}
