'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { MAX_WORDS_PER_DAY, setChildMode, setWordsPerDay, useWordsDoneToday, useWordsPerDay } from '@/lib/child-mode';
import KidIcon from '@/components/app/kid/KidIcon';

/*
 * The parent space, behind a lock a child won't open by chance: hold the
 * padlock for 3 seconds, then « Touche le nombre sept » among four numbers
 * (written as digits or words). A wrong number closes it again. Inside: how
 * many words a day, and leaving child mode.
 */

const HOLD_MS = 3000;
const NUMBER_WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];

type Choice = { label: string; seven: boolean };

// Built when the check opens (in an event handler, so random is fine).
function sevenChoices(): Choice[] {
  const asText = (n: number) => (Math.random() < 0.5 ? String(n) : NUMBER_WORDS[n]);
  const others = [1, 2, 3, 4, 5, 6, 8, 9].sort(() => Math.random() - 0.5).slice(0, 3);
  const all = [{ label: asText(7), seven: true }, ...others.map((n) => ({ label: asText(n), seven: false }))];
  return all.sort(() => Math.random() - 0.5);
}

export default function ParentLock() {
  const [stage, setStage] = useState<'closed' | 'check' | 'panel'>('closed');
  const [choices, setChoices] = useState<Choice[]>([]);
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const perDay = useWordsPerDay();
  const doneToday = useWordsDoneToday();

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (stage === 'closed') {
      if (d.open) d.close();
    } else if (!d.open) {
      d.showModal();
    }
  }, [stage]);

  const startHold = () => {
    if (timer.current) clearTimeout(timer.current);
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      setChoices(sevenChoices());
      setStage('check');
    }, HOLD_MS);
  };
  const stopHold = () => {
    if (timer.current) clearTimeout(timer.current);
    setHolding(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Espace parent : garde le doigt appuyé 3 secondes"
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
            e.preventDefault();
            startHold();
          }
        }}
        onKeyUp={stopHold}
        className="inline-flex min-h-11 select-none items-center gap-2 rounded-full px-2 text-ink-soft [-webkit-touch-callout:none]"
      >
        <span className="relative flex h-11 w-11 items-center justify-center">
          <svg viewBox="0 0 44 44" className="absolute inset-0 h-11 w-11 -rotate-90" aria-hidden="true">
            <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(26,26,26,0.1)" strokeWidth="3" />
            {holding && (
              <circle cx="22" cy="22" r="20" fill="none" stroke="#5B1F8C" strokeWidth="3" pathLength={100} strokeDasharray="100" className="animate-hold" />
            )}
          </svg>
          <KidIcon name="cadenas" className="h-5 w-5" />
        </span>
        <span className="text-[11px] font-bold leading-tight">
          Parent :<br />appui long
        </span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setStage('closed')}
        aria-labelledby="parent-title"
        className="m-auto w-[min(100%-2rem,26rem)] rounded-[28px] bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50"
      >
        {stage === 'check' && (
          <div className="p-6 text-center">
            <h2 id="parent-title" className="font-display text-2xl font-bold">Espace parent</h2>
            <p className="mt-2 text-ink-soft">Pour entrer, touche le nombre sept.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {choices.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setStage(c.seven ? 'panel' : 'closed')}
                  className="min-h-16 rounded-2xl bg-cream font-display text-2xl font-bold text-ink ring-1 ring-ink/10 active:scale-95"
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStage('closed')} className="mt-5 min-h-11 font-bold text-ink-soft underline underline-offset-4">
              Annuler
            </button>
          </div>
        )}
        {stage === 'panel' && (
          <div className="p-6">
            <h2 id="parent-title" className="font-display text-2xl font-bold">Espace parent</h2>
            <p className="mt-2 rounded-2xl bg-[#E5F4EC] px-4 py-3 font-bold text-[#1F6B4C]">
              Aujourd’hui : {doneToday.length} mot{doneToday.length > 1 ? 's' : ''} terminé{doneToday.length > 1 ? 's' : ''}.
            </p>
            <fieldset className="mt-5">
              <legend className="font-extrabold">Mots par jour en mode enfant</legend>
              <p className="text-sm text-ink-soft">Après ce nombre, « Un autre mot ? » laisse place à « à demain ».</p>
              <div className="mt-3 flex gap-2">
                {Array.from({ length: MAX_WORDS_PER_DAY }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={perDay === n}
                    aria-label={`${n} mot${n > 1 ? 's' : ''} par jour`}
                    onClick={() => setWordsPerDay(n)}
                    className={`h-12 flex-1 rounded-2xl font-display text-xl font-bold ring-1 transition-colors ${
                      perDay === n ? 'bg-mpurple text-cream ring-mpurple' : 'bg-cream text-ink ring-ink/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setChildMode(false);
                  setStage('closed');
                }}
                className="min-h-12 rounded-full bg-ink px-5 font-extrabold text-cream"
              >
                Quitter le mode enfant
              </button>
              <Link href="/app/progres" className="flex min-h-12 items-center justify-center rounded-full bg-[#FFF1E0] px-5 font-bold text-morange-ink">
                📊 Voir les progrès
              </Link>
              <button type="button" onClick={() => setStage('closed')} className="min-h-11 font-bold text-ink-soft underline underline-offset-4">
                Fermer
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
