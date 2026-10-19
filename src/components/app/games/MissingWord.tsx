'use client';

import { useState } from 'react';
import { playChime } from '@/lib/chime';
import { missingWord } from '@/lib/games';
import { TRY_AGAIN } from '@/lib/prompts';
import KidIcon, { HintHand } from '@/components/app/kid/KidIcon';
import { useTries } from '@/components/app/kid/useTries';
import type { GameProps } from '@/components/app/games/types';

/**
 * « Le mot qui manque »: the word's example sentence with a hole; the child
 * puts the right word in it, from three.
 */
export default function MissingWord({ activity: a, library, canSpeak, speak, onSuccess, accent }: GameProps) {
  const game = missingWord(a, library);
  const [placed, setPlaced] = useState(false);
  const tries = useTries();
  if (!game) return null;
  const hand = !placed && tries.hand('phrase');

  const put = (id: string) => {
    if (placed) return;
    if (id === a.id) {
      setPlaced(true);
      playChime();
      if (canSpeak) speak(a.exampleSentence, 0.8);
      onSuccess(true);
    } else {
      tries.miss('phrase', id);
      if (canSpeak) speak(TRY_AGAIN, 0.85);
    }
  };

  return (
    <>
      <p className="font-display text-2xl leading-relaxed text-ink sm:text-3xl" aria-live="polite">
        {game.before}
        {placed ? (
          <span className="animate-pop inline-block rounded-xl px-2 font-bold text-cream" style={{ backgroundColor: accent }}>
            {game.answer}
          </span>
        ) : (
          <span className="mx-1 inline-block min-w-24 rounded-xl border-2 border-dashed align-middle" style={{ borderColor: accent }}>
            <span className="sr-only">(le mot qui manque)</span>&nbsp;
          </span>
        )}
        {game.after}
      </p>
      {canSpeak && (
        <button
          type="button"
          onClick={() => speak(placed ? a.exampleSentence : `${game.before} … ${game.after}`, 0.8)}
          className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 font-bold text-ink ring-1 ring-ink/15 active:scale-95"
        >
          <KidIcon name="ecouter" className="h-6 w-6" /> Écouter la phrase
        </button>
      )}
      {!placed && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {game.choices.map((c) => (
            <button
              key={`${c.id}-${tries.shake(c.id)}`}
              type="button"
              onClick={() => put(c.id)}
              className={`relative min-h-14 rounded-2xl bg-white px-5 font-display text-2xl font-bold text-ink shadow-[0_4px_0_rgba(26,26,26,0.15)] ring-1 ring-ink/10 active:translate-y-1 active:shadow-none ${
                tries.shake(c.id) ? 'animate-shake ring-2 ring-mred' : ''
              }`}
            >
              {c.word.toLocaleLowerCase('fr')}
              {hand && c.id === a.id && <HintHand />}
            </button>
          ))}
        </div>
      )}
      {placed && (
        <p className="animate-rise mt-5 font-display text-xl font-bold text-[#2D9B6F]">Tu as bien lu la phrase ! 🎉</p>
      )}
    </>
  );
}
