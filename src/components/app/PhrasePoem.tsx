'use client';

import { useState } from 'react';
import type { Activity } from '@/lib/airtable';
import { readPref, writePref } from '@/lib/progress';

/*
 * « Ma phrase et ma poésie » (it was « Chanson »; the Airtable texts are
 * really short poems). Two parts:
 *
 * 1. Ma phrase: the child invents a sentence with the word (the example
 *    sentence is there for inspiration), the parent writes it down, the app
 *    can read it back. Then the child says it, sung or recited. The sentence
 *    is kept on the device (`mounas_phrases`, one per word).
 * 2. La poésie (when the word has one): read it, sing it or recite it; from
 *    level 3, « Par cœur » hides more and more words so the child learns it.
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
  chanson: { label: '🎵 En chanson', tip: 'Invente un petit air et tape dans tes mains à chaque syllabe.' },
  reciter: { label: '🗣️ En récitant', tip: 'Dis-la bien fort, lentement, comme un vrai poète.' },
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
  const [how, setHow] = useState<keyof typeof HOW | null>(null);
  const [said, setSaid] = useState(false);

  return (
    <>
      <div className="rounded-3xl p-5 text-left sm:p-6" style={{ backgroundColor: tint }}>
        <h3 className="font-display text-xl font-bold text-ink">✍️ Ma phrase</h3>
        <p className="mt-1 text-ink">
          Invente une phrase avec le mot <strong className="font-display text-lg">{word}</strong>.
        </p>
        {a.exampleSentence && (
          <p className="mt-3 text-sm text-ink-soft">
            Par exemple : « {a.exampleSentence} »{' '}
            {canSpeak && (
              <button type="button" onClick={() => speak(a.exampleSentence, 0.8)} aria-label="Écouter l’exemple" className="align-middle text-lg">
                🔈
              </button>
            )}
          </p>
        )}
        <label htmlFor="ma-phrase" className="mt-4 block text-xs font-extrabold uppercase tracking-widest text-ink-soft">
          Le parent écrit la phrase de l’enfant
        </label>
        <textarea
          id="ma-phrase"
          value={phrase}
          onChange={(e) => {
            setPhrase(e.target.value);
            savePhrase(a.id, e.target.value);
          }}
          rows={2}
          placeholder={`Mon ${word}…`}
          className="mt-1 w-full rounded-2xl bg-white p-3 font-display text-xl text-ink ring-1 ring-ink/15 focus:outline-none focus:ring-2"
          style={{ ['--tw-ring-color' as string]: accent }}
        />
        {canSpeak && phrase.trim() && (
          <button
            type="button"
            onClick={() => speak(phrase, 0.8)}
            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 font-bold text-ink ring-1 ring-ink/15"
          >
            🔈 Écouter ma phrase
          </button>
        )}

        <p className="mt-5 font-bold text-ink">Et maintenant, dis-la :</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(HOW) as (keyof typeof HOW)[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setHow(k)}
              aria-pressed={how === k}
              className={`min-h-12 rounded-full px-5 font-bold ring-1 ${how === k ? 'text-cream ring-transparent' : 'bg-white text-ink ring-ink/15'}`}
              style={how === k ? { backgroundColor: accent } : undefined}
            >
              {HOW[k].label}
            </button>
          ))}
        </div>
        {how && (
          <div className="animate-rise mt-3">
            <p className="text-ink">{HOW[how].tip}</p>
            {!said ? (
              <button
                type="button"
                onClick={() => {
                  setSaid(true);
                  onSuccess();
                }}
                className="mt-3 min-h-12 rounded-full bg-[#2D9B6F] px-6 font-extrabold text-cream shadow-md active:scale-95"
              >
                ✓ Je l’ai dite !
              </button>
            ) : (
              <p className="mt-3 font-display text-xl font-bold text-[#2D9B6F]" aria-live="polite">
                Bravo, c’est ta phrase à toi ! 🌟
              </p>
            )}
          </div>
        )}
      </div>

      {a.songLyrics.trim() && <Poem title={a.songTitle} text={a.songLyrics} level={level} accent={accent} canSpeak={canSpeak} speak={speak} />}
    </>
  );
}

/** The word's little poem: read, sung or recited; « Par cœur » from level 3. */
function Poem({ title, text, level, accent, canSpeak, speak }: { title: string; text: string; level: number; accent: string; canSpeak: boolean; speak: Say }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const [how, setHow] = useState<'lire' | 'chanson' | 'reciter' | 'coeur'>('lire');
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

  type How = 'lire' | 'chanson' | 'reciter' | 'coeur';
  const modes: [How, string][] = [
    ['lire', '📖 La lire'],
    ['chanson', '🎵 La chanter'],
    ['reciter', '🗣️ La réciter'],
    ...(advanced ? ([['coeur', '🧠 Par cœur']] as [How, string][]) : []),
  ];

  return (
    <div className="mt-5 rounded-3xl bg-white p-5 text-left ring-1 ring-ink/10 sm:p-6">
      <h3 className="font-display text-xl font-bold text-ink">📜 La poésie{title ? ` · ${title}` : ''}</h3>
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
        {how === 'lire' && 'Lisez-la ensemble, une ligne à la fois. Touche une ligne pour l’entendre.'}
        {how === 'chanson' && 'Chantez-la ensemble en tapant dans les mains. Inventez des gestes pour chaque ligne !'}
        {how === 'reciter' && 'Récite-la bien fort, en regardant le parent, comme au spectacle.'}
        {how === 'coeur' && 'Les mots se cachent petit à petit : redis la poésie de mémoire, puis cache-en encore plus.'}
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
