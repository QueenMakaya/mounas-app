'use client';

import { useRef, useState } from 'react';
import { playChime } from '@/lib/chime';
import { seeded } from '@/lib/games';
import { SOUNDS, wordSounds, type Sound } from '@/lib/phonics';
import { TRY_AGAIN } from '@/lib/prompts';
import { HintHand } from '@/components/app/kid/KidIcon';
import { useTries } from '@/components/app/kid/useTries';
import type { GameProps } from '@/components/app/games/types';

/**
 * « Nourris le Mounas »: « Épeler » as a game. The child drags the sounds of
 * the word, in order, into the Mounas's mouth (or taps them); the word fills
 * up underneath. Silent letters are fed too: we write them.
 */
export default function FeedMounas({ activity: a, canSpeak, speak, onSuccess }: GameProps) {
  const sounds = wordSounds(a.frenchWord, a.graphemes).filter((x) => x.kind !== 'separator');
  let pool = seeded(sounds.map((sound, i) => ({ sound, i })), `${a.id}-nourris`);
  // Never the right order already: that would give the answer away.
  if (pool.length > 1 && pool.every((x, k) => x.i === k)) pool = [...pool.slice(1), pool[0]];
  const [fed, setFed] = useState<number[]>([]); // pool indexes, in order
  const [drag, setDrag] = useState<{ p: number; dx: number; dy: number } | null>(null);
  const [chomp, setChomp] = useState(0);
  const startAt = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);
  const mouthRef = useRef<HTMLDivElement>(null);
  const tries = useTries();
  const done = fed.length === sounds.length;
  const next = sounds[fed.length];
  const label = (x: Sound) => x.text.toLocaleLowerCase('fr');
  const fits = (x: Sound) => Boolean(next) && label(x) === label(next) && (x.kind === 'silent') === (next.kind === 'silent');
  const handOn = !done && tries.hand(String(fed.length)) ? pool.findIndex(({ sound }, p) => !fed.includes(p) && fits(sound)) : -1;

  const feed = (p: number) => {
    if (done || fed.includes(p)) return;
    const tile = pool[p].sound;
    if (!fits(tile)) {
      tries.miss(String(fed.length), p);
      if (canSpeak) speak(TRY_AGAIN, 0.85);
      return;
    }
    const now = [...fed, p];
    setFed(now);
    setChomp((c) => c + 1);
    tries.reset();
    if (now.length === sounds.length) {
      playChime();
      if (canSpeak) speak(a.frenchWord);
      onSuccess(true);
    } else if (canSpeak && tile.key) {
      speak(SOUNDS[tile.key].say, 0.7, tile.key);
    }
  };

  const overMouth = (x: number, y: number) => {
    const r = mouthRef.current?.getBoundingClientRect();
    return Boolean(r && x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 20 && y <= r.bottom + 20);
  };

  const hungry = drag !== null && (Math.abs(drag.dx) > 10 || Math.abs(drag.dy) > 10);

  return (
    <>
      {/* The Mounas */}
      <div key={chomp} className={`relative mx-auto w-44 ${chomp ? 'animate-pop' : ''}`}>
        <svg viewBox="0 0 220 170" className="w-44" role="img" aria-label={done ? 'Le Mounas a bien mangé' : 'Le Mounas a faim'}>
          <path d="M58 40 70 8 88 32zM162 40 150 8 132 32z" fill="#F4A340" />
          <path d="M28 160C10 70 55 26 110 26s100 44 82 134z" fill="#5B1F8C" />
          {[[52, 120], [170, 118], [66, 70], [156, 74], [110, 150]].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="#FDF6EC" opacity="0.55" />
          ))}
          <circle cx="82" cy="68" r="16" fill="#FDF6EC" />
          <circle cx="138" cy="68" r="16" fill="#FDF6EC" />
          <circle cx="84" cy={done ? 66 : 74} r="7" fill="#1A1A1A" />
          <circle cx="136" cy={done ? 66 : 74} r="7" fill="#1A1A1A" />
          <circle cx="62" cy="96" r="8" fill="#E6197A" opacity="0.35" />
          <circle cx="158" cy="96" r="8" fill="#E6197A" opacity="0.35" />
          {done ? (
            <path d="M80 108q30 26 60 0" fill="none" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx="110" cy="116" rx={hungry ? 40 : 30} ry={hungry ? 28 : 18} fill="#1A1A1A" />
              <ellipse cx="110" cy={hungry ? 132 : 126} rx="16" ry="7" fill="#E63946" />
            </>
          )}
        </svg>
        <div ref={mouthRef} aria-hidden="true" className="absolute left-1/2 top-[56%] h-16 w-24 -translate-x-1/2" />
      </div>

      {/* What it has eaten: the word, sound by sound */}
      <div className="mt-2 flex flex-wrap justify-center gap-1.5" aria-live="polite">
        {sounds.map((x, i) => (
          <span
            key={i}
            className={`flex h-14 min-w-11 items-center justify-center rounded-2xl px-2 font-display text-2xl font-bold ${
              i < fed.length
                ? `animate-pop bg-white ring-1 ring-ink/10 ${x.kind === 'silent' ? 'text-ink/30' : x.kind === 'vowel' ? 'text-mred' : 'text-ink'}`
                : 'border-2 border-dashed border-ink/15'
            }`}
          >
            {i < fed.length ? label(x) : ''}
          </span>
        ))}
      </div>

      {done ? (
        <p className="animate-rise mt-5 font-display text-2xl font-bold text-[#2D9B6F]">Miam ! Tu l’as nourri son par son. 🎉</p>
      ) : (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {pool.map(({ sound: x }, p) => {
            if (fed.includes(p)) return <span key={p} className="h-16 min-w-12 rounded-2xl bg-ink/5" aria-hidden="true" />;
            const moving = drag?.p === p;
            return (
              <button
                key={`${p}-${tries.shake(p)}`}
                type="button"
                aria-label={x.kind === 'silent' ? `${label(x)}, lettre muette` : `Son ${SOUNDS[x.key].hint}, écrit ${label(x)}`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  startAt.current = { x: e.clientX, y: e.clientY };
                  dragged.current = false;
                  setDrag({ p, dx: 0, dy: 0 });
                }}
                onPointerMove={(e) => {
                  if (!moving) return;
                  const dx = e.clientX - startAt.current.x;
                  const dy = e.clientY - startAt.current.y;
                  if (Math.abs(dx) > 10 || Math.abs(dy) > 10) dragged.current = true;
                  setDrag({ p, dx, dy });
                }}
                onPointerUp={(e) => {
                  if (dragged.current && overMouth(e.clientX, e.clientY)) feed(p);
                  setDrag(null);
                }}
                onPointerCancel={() => setDrag(null)}
                // A tap (or the keyboard) feeds it too; a drag already did.
                onClick={() => {
                  if (!dragged.current) feed(p);
                  dragged.current = false;
                }}
                className={`relative flex h-16 min-w-12 touch-none select-none flex-col items-center justify-center rounded-2xl bg-white px-2 shadow-[0_4px_0_rgba(26,26,26,0.15)] ring-1 ring-ink/10 ${
                  moving ? 'z-20 scale-110 shadow-xl' : 'transition-transform'
                } ${tries.shake(p) ? 'animate-shake ring-2 ring-mred' : ''} ${handOn === p ? 'ring-4 ring-mamber' : ''}`}
                style={moving && drag ? { transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.1)` } : undefined}
              >
                <span className={`font-display text-3xl font-bold leading-none ${x.kind === 'silent' ? 'text-ink/30' : x.kind === 'vowel' ? 'text-mred' : 'text-ink'}`}>
                  {label(x)}
                </span>
                {x.kind === 'silent' && <span className="text-[10px] font-extrabold text-ink/30">muette</span>}
                {handOn === p && <HintHand />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
