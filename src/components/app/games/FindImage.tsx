'use client';

import { useState } from 'react';
import { playChime } from '@/lib/chime';
import { imageChoices } from '@/lib/games';
import { TRY_AGAIN } from '@/lib/prompts';
import KidIcon, { HintHand } from '@/components/app/kid/KidIcon';
import { useTries } from '@/components/app/kid/useTries';
import type { GameProps } from '@/components/app/games/types';

/**
 * « Trouve l'image »: the child hears the word and touches its picture among
 * three. The pictures are emoji (src/lib/word-pictures.ts): Airtable has no
 * image per word.
 */
export default function FindImage({ activity: a, library, canSpeak, speak, onSuccess, accent }: GameProps) {
  const choices = imageChoices(a, library) ?? [];
  const [found, setFound] = useState(false);
  const tries = useTries();
  const hand = !found && tries.hand('image');

  const pick = (id: string) => {
    if (found) return;
    if (id === a.id) {
      setFound(true);
      playChime();
      if (canSpeak) speak(a.frenchWord);
      onSuccess(true);
    } else {
      tries.miss('image', id);
      if (canSpeak) speak(TRY_AGAIN, 0.85);
    }
  };

  return (
    <>
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
      <div className="mt-6 grid grid-cols-3 gap-3">
        {choices.map((c) => {
          const right = found && c.id === a.id;
          return (
            <button
              key={`${c.id}-${tries.shake(c.id)}`}
              type="button"
              onClick={() => pick(c.id)}
              aria-label={c.word}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-3xl bg-white shadow-[0_4px_0_rgba(26,26,26,0.12)] ring-1 ring-ink/10 transition-transform active:translate-y-1 ${
                tries.shake(c.id) ? 'animate-shake ring-2 ring-mred' : ''
              } ${right ? 'animate-pop ring-4 ring-[#2D9B6F]' : ''} ${found && !right ? 'opacity-40' : ''}`}
            >
              <span aria-hidden="true" className="text-5xl leading-none sm:text-6xl">{c.picture}</span>
              {right && <span className="mt-2 font-display text-lg font-bold text-ink">{c.word.toLocaleLowerCase('fr')}</span>}
              {hand && c.id === a.id && <HintHand />}
            </button>
          );
        })}
      </div>
      {found && (
        <p className="animate-rise mt-6 font-display text-2xl font-bold text-[#2D9B6F]" aria-live="polite">
          Tu as bien écouté ! 🎉
        </p>
      )}
    </>
  );
}
