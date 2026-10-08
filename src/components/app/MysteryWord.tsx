'use client';

import { useState } from 'react';
import { playChime } from '@/lib/chime';
import { SOUNDS, wordSounds } from '@/lib/phonics';
import { themeEmoji } from '@/lib/themes';
import MysteryTiles from '@/components/app/MysteryTiles';
import { coloredLetters, syllableParts } from '@/components/app/SyllableWord';

/*
 * The first seconds of the activity: the word is a row of face-down cards.
 * The child can ask for hints (theme, syllables, first sound, first letter),
 * then taps to reveal — the cards flip one by one with a chime and sparks.
 * Nothing is read aloud: the child tries to read the word alone.
 */

type Props = {
  word: string;
  syllables: string;
  theme: string;
  graphemes: string;
  revealed: boolean;
  onReveal: () => void;
  canSpeak: boolean;
  speak: (text: string, rate?: number) => void;
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

export default function MysteryWord({ word, syllables, theme, graphemes, revealed, onReveal, canSpeak, speak }: Props) {
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
    <div className="relative">
      <button
        type="button"
        onClick={reveal}
        disabled={revealed}
        aria-label={revealed ? `Le mot : ${word}` : 'Découvrir le mot mystère'}
        className="relative block w-full rounded-3xl py-2 outline-none focus-visible:ring-4 focus-visible:ring-mamber"
      >
        <MysteryTiles letters={letters} flipped={flipped} stagger={revealed} invite={!revealed} />
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

      {!revealed && (
        <>
          <p className="mt-5 animate-pulse text-center font-display text-lg font-bold text-ink">👆 Touche les cartes pour découvrir le mot !</p>
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
