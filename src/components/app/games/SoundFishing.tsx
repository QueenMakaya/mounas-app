'use client';

import { useState } from 'react';
import { playChime } from '@/lib/chime';
import { fishingPond } from '@/lib/games';
import { SOUNDS } from '@/lib/phonics';
import { TRY_AGAIN } from '@/lib/prompts';
import KidIcon, { HintHand } from '@/components/app/kid/KidIcon';
import { useTries } from '@/components/app/kid/useTries';
import type { GameProps } from '@/components/app/games/types';

/**
 * « La pêche aux sons »: words of the app swim in the pond; the child fishes
 * out the ones with today's sound. Once caught, the sound lights up in the
 * word.
 */
export default function SoundFishing({ activity: a, library, canSpeak, speak, onSuccess }: GameProps) {
  const pond = fishingPond(a, library);
  const [caught, setCaught] = useState<string[]>([]);
  const tries = useTries();
  if (!pond) return null;
  const { sound, fish } = pond;
  const toCatch = fish.filter((f) => f.has);
  const done = toCatch.every((f) => caught.includes(f.card.id));
  const handOn = !done && tries.hand('pond') ? toCatch.find((f) => !caught.includes(f.card.id))?.card.id : undefined;
  const hint = SOUNDS[sound.key]?.hint ?? sound.text;

  const fishOut = (id: string, has: boolean, word: string) => {
    if (done || caught.includes(id)) return;
    if (has) {
      const next = [...caught, id];
      setCaught(next);
      tries.reset();
      if (canSpeak) speak(word);
      if (toCatch.every((f) => next.includes(f.card.id))) {
        playChime();
        onSuccess(true);
      }
    } else {
      tries.miss('pond', id);
      if (canSpeak) speak(TRY_AGAIN, 0.85);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <p className="font-bold text-ink">Le son</p>
        <button
          type="button"
          onClick={() => canSpeak && speak(SOUNDS[sound.key].say, 0.6, sound.key)}
          aria-label={`Écouter le son ${hint}`}
          className="flex min-h-14 min-w-16 flex-col items-center justify-center rounded-2xl bg-white px-3 shadow-[0_3px_0_rgba(26,26,26,0.15)] ring-1 ring-ink/10 active:scale-95"
        >
          <span className={`font-display text-3xl font-bold leading-none ${sound.kind === 'vowel' ? 'text-mred' : 'text-ink'}`}>
            {sound.text.toLocaleLowerCase('fr')}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-extrabold text-ink-soft">
            <KidIcon name="ecouter" className="h-3.5 w-3.5" strokeWidth={2.6} /> « {hint} »
          </span>
        </button>
      </div>

      {/* The pond */}
      <div className="relative mt-5 rounded-[2rem] bg-gradient-to-b from-[#8FD9EA] to-[#2E8FB8] px-3 pb-6 pt-5">
        <div className="flex flex-wrap justify-center gap-3">
          {fish.map((f, i) => {
            const isCaught = caught.includes(f.card.id);
            const word = f.card.word.toLocaleLowerCase('fr');
            return (
              <button
                key={`${f.card.id}-${tries.shake(f.card.id)}`}
                type="button"
                onClick={() => fishOut(f.card.id, f.has, f.card.word)}
                aria-label={isCaught ? `${word}, pêché` : word}
                aria-pressed={isCaught}
                className={`relative flex min-h-14 items-center gap-1.5 rounded-full py-2 pl-3 pr-5 font-display text-2xl font-bold shadow-[0_4px_0_rgba(26,26,26,0.2)] transition-transform active:scale-95 ${
                  isCaught ? 'animate-pop bg-mamber text-ink' : 'bg-white text-ink'
                } ${tries.shake(f.card.id) ? 'animate-shake ring-2 ring-mred' : ''}`}
                style={{ transform: isCaught ? undefined : `rotate(${i % 2 ? 2 : -2}deg)` }}
              >
                <span aria-hidden="true" className="text-xl">{isCaught ? '✓' : '🐟'}</span>
                {isCaught && f.text ? <Highlight word={word} text={f.text} /> : word}
                {handOn === f.card.id && <HintHand />}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-4 font-display text-xl font-bold text-ink" aria-live="polite">
        {done ? 'Belle pêche, tu as bien cherché ! 🎉' : `🎣 ${caught.length} / ${toCatch.length}`}
      </p>
    </>
  );
}

function Highlight({ word, text }: { word: string; text: string }) {
  const at = word.indexOf(text);
  if (at < 0) return <span>{word}</span>;
  // One element: the button is a flex row, loose text would be spaced out.
  return (
    <span>
      {word.slice(0, at)}
      <span className="text-mred underline decoration-2 underline-offset-4">{word.slice(at, at + text.length)}</span>
      {word.slice(at + text.length)}
    </span>
  );
}
