'use client';

import { useState } from 'react';
import { playChime } from '@/lib/chime';
import type { LearnedWord } from '@/lib/progress';
import type { WordCard } from '@/lib/related';
import { markReviewed } from '@/lib/review';
import { wordPicture } from '@/lib/word-pictures';
import SyllableWord from '@/components/app/SyllableWord';
import KidIcon from '@/components/app/kid/KidIcon';

/**
 * « Les mots qui reviennent »: one minute to warm up with words learned a few
 * days ago. The child reads each word, then touches the speaker to hear it and
 * check. Once all are checked, they count as reviewed for today.
 */
export default function ReviewWords({
  words,
  library,
  canSpeak,
  speak,
  onSuccess,
}: {
  words: LearnedWord[];
  library: WordCard[];
  canSpeak: boolean;
  speak: (text: string, rate?: number) => void;
  onSuccess: (chimed?: boolean) => void;
}) {
  const [checked, setChecked] = useState<string[]>([]);

  const check = (w: LearnedWord) => {
    if (canSpeak) speak(w.word, 0.8);
    if (checked.includes(w.id)) return;
    const now = [...checked, w.id];
    setChecked(now);
    if (words.every((x) => now.includes(x.id))) {
      markReviewed(words);
      playChime();
      onSuccess(true);
    }
  };

  return (
    <ul className="flex flex-col gap-3">
      {words.map((w) => {
        const card = library.find((c) => c.id === w.id);
        const on = checked.includes(w.id);
        const picture = on ? wordPicture(w.word) : null;
        return (
          <li key={w.id} className={`flex items-center gap-3 rounded-3xl bg-white p-4 ring-1 transition-colors ${on ? 'ring-2 ring-[#2D9B6F]' : 'ring-ink/10'}`}>
            <span className="flex-1 text-left">
              <SyllableWord word={w.word.toLocaleLowerCase('fr')} syllables={card?.syllables ?? ''} className="font-display text-4xl font-bold" />
              {picture && <span aria-hidden="true" className="animate-pop ml-3 inline-block text-3xl">{picture}</span>}
            </span>
            <button
              type="button"
              onClick={() => check(w)}
              aria-label={`Vérifier en écoutant : ${w.word}`}
              className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full shadow-[0_3px_0_rgba(26,26,26,0.12)] active:scale-95 ${
                on ? 'bg-[#2D9B6F] text-cream' : 'bg-[#FEF3E2] text-morange-ink'
              }`}
            >
              {on ? <span className="text-2xl font-black">✓</span> : <KidIcon name="ecouter" className="h-9 w-9" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
