'use client';

import { useEffect, useRef, useState } from 'react';
import { playChime } from '@/lib/chime';
import { SOUNDS, wordSounds } from '@/lib/phonics';
import { themeEmoji } from '@/lib/themes';
import MysteryTiles from '@/components/app/MysteryTiles';
import { coloredLetters, syllableParts } from '@/components/app/SyllableWord';

/*
 * The first seconds of the activity: the word is a row of face-down cards.
 * The child can ask for hints (theme, syllables, first sound, first letter),
 * then taps to reveal — the cards flip one by one with a chime and sparks.
 *
 * Two ways to discover it:
 * - "Je lis": nothing is read aloud, the child tries to read the word alone.
 * - "J'écoute": the child hears the word, spells it with the sounds, then
 *   turns the cards to check (for words already met: spelling from hearing
 *   comes after reading).
 */

export type DiscoverMode = 'lire' | 'ecoute';

type Props = {
  word: string;
  syllables: string;
  theme: string;
  graphemes: string;
  revealed: boolean;
  onReveal: () => void;
  canSpeak: boolean;
  speak: (text: string, rate?: number) => void;
  mode: DiscoverMode;
  /** Shows the "Je lis / J'écoute" switch (not at level 1). */
  onModeChange?: (mode: DiscoverMode) => void;
  /** Extra tools under the listen controls (the sound tiles). */
  extra?: React.ReactNode;
};

// Sparks fly out in a ring around the word (fixed angles: same on every render).
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const dist = 110 + (i % 3) * 30;
  return {
    dx: Math.round(Math.cos(angle) * dist * 1.4),
    dy: Math.round(Math.sin(angle) * dist * 0.7),
    color: ['#E63946', '#F4A340', '#2EC4B6', '#5B1F8C'][i % 4],
    size: 8 + (i % 3) * 3,
  };
});

export default function MysteryWord({ word, syllables, theme, graphemes, revealed, onReveal, canSpeak, speak, mode, onModeChange, extra }: Props) {
  const listen = mode === 'ecoute';
  const rootRef = useRef<HTMLDivElement>(null);
  // In listen mode the child checks after spelling, further down the page:
  // bring the turning cards back into view.
  useEffect(() => {
    if (revealed && listen) rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [revealed, listen]);
  const letters = coloredLetters(word, syllables);
  const [hints, setHints] = useState(0);

  const syllableCount = Math.max(syllableParts(syllables).length, 1);
  const firstSound = wordSounds(word, graphemes).find((s) => s.kind !== 'silent' && s.kind !== 'separator' && s.key);
  const firstLetterIndex = letters.findIndex((l) => !/[\s'’-]/.test(l.char));

  const allHints = [
    theme && { icon: themeEmoji(theme), text: <>C’est un mot du thème <strong>{theme}</strong>.</> },
    {
      icon: '👏',
      text: (
        <>
          Il a <strong>{syllableCount} syllabe{syllableCount > 1 ? 's' : ''}</strong> : {'👏'.repeat(syllableCount)}
        </>
      ),
    },
    firstSound && {
      icon: '👂',
      text: (
        <>
          Il commence par le son <strong>« {SOUNDS[firstSound.key].hint} »</strong>
          {canSpeak && (
            <button
              type="button"
              onClick={() => speak(SOUNDS[firstSound.key].say, 0.6)}
              className="ml-2 rounded-full bg-white px-2 py-0.5 text-sm ring-1 ring-ink/10"
              aria-label="Écouter le premier son"
            >
              🔈
            </button>
          )}
        </>
      ),
    },
    { icon: '🔤', text: <>La première lettre se retourne !</> },
  ].filter(Boolean) as { icon: string; text: React.ReactNode }[];

  const firstLetterShown = !revealed && hints >= allHints.length;
  const flipped = letters.map((_, i) => revealed || (firstLetterShown && i === firstLetterIndex));

  const reveal = () => {
    if (revealed) return;
    playChime();
    try {
      navigator.vibrate?.(25);
    } catch {
      /* not supported */
    }
    onReveal();
  };

  return (
    <div ref={rootRef} className="relative scroll-mt-40">
      {onModeChange && !revealed && (
        <div role="radiogroup" aria-label="Comment découvrir le mot" className="mx-auto mb-5 flex w-fit rounded-full bg-white p-1 ring-1 ring-ink/10">
          {(
            [
              ['lire', '👀 Je lis'],
              ['ecoute', '👂 J’écoute'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => onModeChange(value)}
              className={`min-h-11 rounded-full px-5 text-sm font-extrabold transition-colors ${mode === value ? 'bg-ink text-cream shadow-sm' : 'text-ink-soft hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {/* In listen mode the cards only turn from the "check" button, so a stray tap doesn't give the answer away. */}
      <button
        type="button"
        onClick={reveal}
        disabled={revealed || listen}
        aria-label={revealed ? `Le mot : ${word}` : listen ? 'Le mot caché' : 'Découvrir le mot mystère'}
        className="relative block w-full rounded-3xl py-2 outline-none focus-visible:ring-4 focus-visible:ring-mamber"
      >
        <MysteryTiles letters={letters} flipped={flipped} stagger={revealed} invite={!revealed && !listen} />
        {revealed && (
          <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2">
            {SPARKS.map((p, i) => (
              <span
                key={i}
                className="spark absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  ['--dx' as string]: `${p.dx}px`,
                  ['--dy' as string]: `${p.dy}px`,
                  animationDelay: `${letters.length * 90}ms`,
                }}
              />
            ))}
          </span>
        )}
        <span className="sr-only" aria-live="polite">
          {revealed ? `Le mot est ${word}` : ''}
        </span>
      </button>

      {!revealed && listen && (
        <div className="mt-5 text-center">
          {canSpeak ? (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => speak(word, 0.8)}
                className="inline-flex min-h-14 items-center gap-2 rounded-full bg-mred px-7 text-lg font-extrabold text-cream shadow-lg active:scale-95"
              >
                🔈 Écoute le mot
              </button>
              <button
                type="button"
                onClick={() => speak(word, 0.45)}
                className="min-h-14 rounded-full bg-white px-5 font-bold text-ink ring-1 ring-ink/15 active:scale-95"
              >
                🐢 Lentement
              </button>
            </div>
          ) : (
            <p className="font-display text-lg font-bold text-ink">🗣️ Papa ou maman dit le mot à voix haute.</p>
          )}
          <p className="mx-auto mt-4 max-w-sm font-bold text-ink-soft">Épelle-le avec les sons, ou écris-le sur une feuille… puis vérifie !</p>
          {extra}
          <button
            type="button"
            onClick={reveal}
            className="mt-5 inline-flex min-h-14 items-center gap-2 rounded-full bg-ink px-7 text-lg font-extrabold text-cream shadow-md active:scale-95"
          >
            ✅ Je vérifie
          </button>
        </div>
      )}

      {!revealed && (
        <>
          {!listen && (
            <p className="mt-5 animate-pulse text-center font-display text-lg font-bold text-ink">👆 Touche les cartes pour découvrir le mot !</p>
          )}
          {hints > 0 && (
            <ul className="mx-auto mt-4 flex max-w-md flex-col gap-2 text-left">
              {allHints.slice(0, hints).map((h, i) => (
                <li key={i} className="animate-rise flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-ink ring-1 ring-ink/10">
                  <span className="text-2xl" aria-hidden="true">{h.icon}</span>
                  <span className="leading-snug">{h.text}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex justify-center">
            {hints < allHints.length ? (
              <button
                type="button"
                onClick={() => setHints((h) => h + 1)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-mamber/90 px-5 font-extrabold text-ink shadow-sm active:scale-95"
              >
                💡 {hints === 0 ? 'Un indice ?' : 'Encore un indice'}
                <span className="rounded-full bg-white/70 px-2 text-xs">{hints}/{allHints.length}</span>
              </button>
            ) : (
              <p className="text-sm font-bold text-ink-soft">Plus d’indice : à toi de deviner !</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
