'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { PIECES, CAMPS, isDark, sqName, type Board } from '@/lib/echecs';
import PieceIcon from './PieceIcon';

/*
 * The savanna board: sand and ochre squares, the pieces as big round tokens.
 * Tap a piece, its possible moves light up (a dot for an empty square, a
 * ring for a piece to catch), tap where to go. Everything is a button, so it
 * also works with a keyboard and a screen reader (« la Gazelle du Soleil, b1 »).
 */

type Props = {
  board: Board;
  selected?: number | null;
  /** Squares the selected piece may go to. */
  targets?: number[];
  lastMove?: { from: number; to: number } | null;
  /** The square of a Roi in check (glows red). */
  check?: number | null;
  /** Things drawn on squares: mangoes, rocks, footprints… */
  decor?: Partial<Record<number, ReactNode>>;
  /** A square to point at (the helping hand). */
  hint?: number | null;
  onSquare?: (sq: number) => void;
  disabled?: boolean;
  className?: string;
};

export default function ChessBoard({ board, selected = null, targets = [], lastMove = null, check = null, decor = {}, hint = null, onSquare, disabled, className = '' }: Props) {
  // On a tablet the whole board must be visible without scrolling: its size
  // follows the screen height (never under 18rem), and when a game opens the
  // page moves so that the board's bottom edge is on screen.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.getBoundingClientRect().bottom > window.innerHeight) el.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, []);

  return (
    <div
      ref={ref}
      className={`mx-auto w-full max-w-[min(100%,34rem,max(18rem,calc(100svh_-_15rem)))] scroll-mb-14 rounded-[22px] bg-[#7A4A22] p-1.5 shadow-[0_14px_40px_-14px_rgba(91,31,140,0.45)] sm:p-2 ${className}`}
    >
      <div className="grid grid-cols-8 overflow-hidden rounded-2xl" role="group" aria-label="Le plateau">
        {board.map((piece, sq) => {
          const dark = isDark(sq);
          const target = targets.includes(sq);
          const isSel = selected === sq;
          const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
          const label = piece
            ? `${PIECES[piece.kind].name} ${piece.camp === 's' ? 'du Soleil' : 'de la Lune'}, ${sqName(sq)}${target ? ', à attraper' : ''}`
            : `${sqName(sq)}${target ? ', on peut y aller' : ''}`;
          return (
            <button
              key={sq}
              type="button"
              aria-label={label}
              aria-pressed={isSel || undefined}
              disabled={disabled || !onSquare}
              onClick={() => onSquare?.(sq)}
              className="relative aspect-square outline-none focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mpurple disabled:cursor-default"
              style={{ backgroundColor: dark ? '#C98A4B' : '#F3DDB8' }}
            >
              {isLast && <span className="absolute inset-0 bg-[#FFE27A]/45" />}
              {isSel && <span className="absolute inset-0 bg-mteal/45" />}
              {check === sq && <span className="animate-glow absolute inset-[6%] rounded-full bg-mred/50" />}
              {decor[sq] && <span className="absolute inset-0 flex items-center justify-center text-[min(7vw,2.2rem)] leading-none">{decor[sq]}</span>}
              {piece && (
                <span key={lastMove?.to === sq ? `m${lastMove.from}` : 'p'} className={`absolute inset-[5%] ${lastMove?.to === sq ? 'animate-pop' : ''}`}>
                  <PieceIcon kind={piece.kind} camp={piece.camp} className="h-full w-full" />
                </span>
              )}
              {target && !piece && <span className="absolute left-1/2 top-1/2 h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0E8C80]/70 ring-2 ring-white/70" />}
              {target && piece && <span className="absolute inset-[2%] rounded-full ring-[5px] ring-mred/80" />}
              {hint === sq && (
                <span className="animate-point pointer-events-none absolute -bottom-1 right-0 z-10 text-2xl drop-shadow" aria-hidden="true">
                  👆
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Whose turn it is, with the camp's sun or moon. */
export function TurnBadge({ camp, label }: { camp: 's' | 'l'; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-base font-bold ${camp === 's' ? 'bg-[#FEF3E2] text-morange-ink' : 'bg-mpurple text-cream'}`}
      aria-live="polite"
    >
      <span aria-hidden="true">{CAMPS[camp].emoji}</span>
      {label ?? `À ${camp === 's' ? 'toi, Soleil' : 'la Lune'} de jouer`}
    </span>
  );
}
