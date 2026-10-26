'use client';

import { useState } from 'react';
import { playChime } from '@/lib/chime';
import { findWord } from '@/lib/games';
import { TRY_AGAIN } from '@/lib/prompts';
import KidIcon, { HintHand } from '@/components/app/kid/KidIcon';
import { useTries } from '@/components/app/kid/useTries';
import type { GameProps } from '@/components/app/games/types';

/**
 * « Trouve le mot »: the app says the word, the child touches it among words
 * that look like it (mirror letters, swapped letters, a letter more or less,
 * a close real word — see findWord in src/lib/games.ts). At level 1 the word
 * is also shown as a model; from level 2 it is only heard.
 */
export default function FindWord({ activity: a, library, canSpeak, speak, onSuccess, accent }: GameProps) {
  const game = findWord(a, library);
  const [found, setFound] = useState(false);
  const tries = useTries();
  if (!game) return null;
  const hand = !found && tries.hand('mot');

  const pick = (w: string, i: number) => {
    if (found) return;
    if (w === game.word) {
      setFound(true);
      playChime();
      if (canSpeak) speak(a.frenchWord);
      onSuccess(true);
    } else {
      tries.miss('mot', i);
      if (canSpeak) speak(TRY_AGAIN, 0.85);
    }
  };

  return (
    <>
      {game.level <= 1 && (
        <p className="mb-4 text-4xl font-bold text-ink" style={{ fontFamily: 'var(--font-read)' }} aria-label={`Le modèle : ${game.word}`}>
          {game.word}
        </p>
      )}
      {canSpeak && (
        <button
          type="button"
          onClick={() => speak(a.frenchWord, 0.7)}
          className="mx-auto flex min-h-14 items-center gap-2 rounded-full px-6 font-extrabold text-cream shadow-md active:scale-95"
          style={{ backgroundColor: accent }}
        >
          <KidIcon name="ecouter" className="h-7 w-7" /> Écouter le mot
        </button>
      )}
      <div className={`mt-6 grid gap-3 ${game.choices.length > 4 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
        {game.choices.map((w, i) => {
          const right = found && w === game.word;
          return (
            <button
              key={`${w}-${tries.shake(i)}`}
              type="button"
              onClick={() => pick(w, i)}
              style={{ fontFamily: 'var(--font-read)' }}
              className={`relative min-h-16 rounded-2xl bg-white px-3 py-3 text-3xl font-bold text-ink shadow-[0_4px_0_rgba(26,26,26,0.15)] ring-1 ring-ink/10 active:translate-y-1 active:shadow-none ${
                tries.shake(i) ? 'animate-shake ring-2 ring-mred' : ''
              } ${right ? 'animate-pop ring-4 ring-[#2D9B6F]' : ''} ${found && !right ? 'opacity-30' : ''}`}
            >
              {w}
              {hand && w === game.word && <HintHand />}
            </button>
          );
        })}
      </div>
      {found && (
        <p className="animate-rise mt-6 font-display text-2xl font-bold text-[#2D9B6F]" aria-live="polite">
          Tu as regardé chaque lettre, bravo ! 🎉
        </p>
      )}
    </>
  );
}
