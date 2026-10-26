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

/**
 * The review as an option, never a step: a card the family can open at the
 * start of the word (before the mystery word) or at the end (instead of a new
 * word). Closed, it only says how many words are waiting.
 */
export function ReviewOption({
  words,
  due,
  library,
  canSpeak,
  speak,
  where,
}: {
  words: LearnedWord[];
  due: boolean;
  library: WordCard[];
  canSpeak: boolean;
  speak: (text: string, rate?: number) => void;
  where: 'debut' | 'fin';
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  if (words.length === 0) return null;
  const title = due ? 'Les mots qui reviennent' : 'Revoir des mots déjà appris';
  const count = words.length === 1 ? '1 mot' : `${words.length} mots`;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          if (canSpeak) speak('Lis ces mots, puis écoute-les pour vérifier.', 0.85);
        }}
        className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left ring-1 ring-ink/10 transition-colors hover:bg-sand"
      >
        <span aria-hidden="true" className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FEF3E2] text-2xl">
          🔁
        </span>
        <span className="flex-1">
          <span className="block font-extrabold text-ink">{where === 'debut' ? `Envie de revoir des mots d’avant ?` : title}</span>
          <span className="block text-sm text-ink-soft">
            {count} · {due ? 'appris il y a quelques jours' : 'déjà appris'} · facultatif
          </span>
        </span>
        <span aria-hidden="true" className="text-xl text-ink">→</span>
      </button>
    );
  }

  return (
    <section aria-label={title} className="animate-rise rounded-3xl bg-[#FEF3E2] p-4 text-left ring-1 ring-ink/5 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-xl font-bold text-ink">🔁 {title}</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-11 rounded-full bg-white px-4 text-sm font-bold text-ink ring-1 ring-ink/15"
        >
          Fermer
        </button>
      </div>
      <ReviewWords words={words} library={library} canSpeak={canSpeak} speak={speak} onSuccess={() => setDone(true)} />
      {done ? (
        <p className="animate-rise mt-3 text-center font-display text-lg font-bold text-[#1F6B4C]" aria-live="polite">
          Bravo, tu les as tous relus ! 🌟
        </p>
      ) : (
        <p className="mt-3 text-center text-sm text-ink-soft">Ton enfant essaie de lire chaque mot seul, puis touche le haut-parleur pour vérifier.</p>
      )}
    </section>
  );
}
