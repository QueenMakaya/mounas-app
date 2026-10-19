import type { LearnedWord } from '@/lib/progress';

/*
 * Mounaville: the village the child builds. Each word learned adds a piece
 * (a case, a baobab, a market stall, a drum, a pirogue…), in the order the
 * words were learned. No score, no count: just a village that grows.
 */

type Piece = { name: string; draw: React.ReactNode };

const PIECES: Piece[] = [
  {
    name: 'une case',
    draw: (
      <>
        <rect x="16" y="32" width="32" height="22" rx="3" fill="#F4A340" />
        <path d="M10 34 32 12l22 22z" fill="#C7600A" />
        <path d="M20 30l6-8M32 30V18M44 30l-6-8" stroke="#8A3F06" strokeWidth="1.5" />
        <rect x="27" y="40" width="10" height="14" rx="5" fill="#5C2A0A" />
      </>
    ),
  },
  {
    name: 'un baobab',
    draw: (
      <>
        <path d="M26 56c2-10 2-20 0-28h12c-2 8-2 18 0 28z" fill="#9C5B2E" />
        <path d="M27 30 18 20M37 30l9-10M32 28V16" stroke="#9C5B2E" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="17" cy="17" rx="9" ry="5" fill="#2D9B6F" />
        <ellipse cx="47" cy="17" rx="9" ry="5" fill="#2D9B6F" />
        <ellipse cx="32" cy="12" rx="10" ry="6" fill="#0E8C80" />
      </>
    ),
  },
  {
    name: 'un étal du marché',
    draw: (
      <>
        <path d="M14 30v24M50 30v24" stroke="#8A3F06" strokeWidth="3" />
        <path d="M10 22h44l-4 10H14z" fill="#E63946" />
        <path d="M21 22l-2 10M32 22v10M43 22l2 10" stroke="#FDF6EC" strokeWidth="4" />
        <rect x="12" y="42" width="40" height="6" rx="2" fill="#C7600A" />
        <circle cx="21" cy="39" r="4" fill="#F4A340" />
        <circle cx="30" cy="39" r="4" fill="#2D9B6F" />
        <circle cx="39" cy="39" r="4" fill="#E63946" />
        <circle cx="46" cy="40" r="3" fill="#F4A340" />
      </>
    ),
  },
  {
    name: 'un tambour',
    draw: (
      <>
        <path d="M20 22h24l-6 16 4 16H22l4-16z" fill="#993556" />
        <ellipse cx="32" cy="22" rx="12" ry="4" fill="#FDF6EC" stroke="#5C2A0A" strokeWidth="1.5" />
        <path d="M22 25l8 12M42 25l-8 12M26 25l12 12M38 25 26 37" stroke="#F4A340" strokeWidth="1.2" />
      </>
    ),
  },
  {
    name: 'une pirogue',
    draw: (
      <>
        <path d="M4 48c6-3 10 3 16 0s10 3 16 0 10 3 16 0 8 2 8 2v8H4z" fill="#2EC4B6" />
        <path d="M10 40h44c-3 7-9 9-22 9S13 47 10 40z" fill="#9C5B2E" />
        <path d="M40 18 28 46" stroke="#5C2A0A" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="27" cy="47" rx="3" ry="2" fill="#5C2A0A" />
      </>
    ),
  },
  {
    name: 'un palmier',
    draw: (
      <>
        <path d="M30 56c0-14 2-28 6-38" stroke="#9C5B2E" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M36 18c-8-6-18-4-22 2 8-2 14-1 22-2zM36 18c8-6 18-4 22 2-8-2-14-1-22-2zM36 18c-4-8-12-10-16-8 6 2 10 4 16 8zM36 18c4-8 12-10 16-8-6 2-10 4-16 8z" fill="#2D9B6F" />
        <circle cx="34" cy="21" r="2.5" fill="#C7600A" />
        <circle cx="38" cy="21" r="2.5" fill="#C7600A" />
      </>
    ),
  },
  {
    name: 'un puits',
    draw: (
      <>
        <path d="M18 20v18M46 20v18" stroke="#9C5B2E" strokeWidth="3" />
        <path d="M14 20h36" stroke="#C7600A" strokeWidth="4" strokeLinecap="round" />
        <path d="M32 20v10" stroke="#5C2A0A" strokeWidth="1.5" />
        <rect x="28" y="30" width="8" height="6" rx="1" fill="#1D6FA4" />
        <path d="M14 38h36v14a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="#C9B79C" />
        <path d="M14 45h36M24 38v7M38 45v11" stroke="#A8957A" strokeWidth="1.5" />
      </>
    ),
  },
  {
    name: 'un manguier',
    draw: (
      <>
        <rect x="29" y="36" width="6" height="20" rx="2" fill="#9C5B2E" />
        <circle cx="32" cy="26" r="16" fill="#2D9B6F" />
        <ellipse cx="25" cy="28" rx="3" ry="4" fill="#F4A340" />
        <ellipse cx="38" cy="22" rx="3" ry="4" fill="#E63946" />
        <ellipse cx="36" cy="33" rx="3" ry="4" fill="#F4A340" />
      </>
    ),
  },
];

export default function Mounaville({ learned }: { learned: LearnedWord[] }) {
  return (
    <section aria-labelledby="village-title" className="mt-6 overflow-hidden rounded-[28px] ring-1 ring-ink/5">
      <div className="bg-gradient-to-b from-[#FFE7C2] to-[#FEF3E2] px-5 pb-3 pt-5">
        <h2 id="village-title" className="font-display text-xl font-bold text-ink">
          <span aria-hidden="true">🏘️ </span>Mounaville
        </h2>
        <p className="mt-1 text-sm text-ink-soft">Chaque mot appris construit le village de ton enfant.</p>
      </div>
      <ul className="grid grid-cols-4 gap-x-1 gap-y-3 bg-[#EBD3A8] px-3 pb-5 pt-4 sm:grid-cols-6">
        {learned.map((w, i) => {
          const piece = PIECES[i % PIECES.length];
          const word = w.word.toLocaleLowerCase('fr');
          return (
            <li key={w.id} className="flex flex-col items-center">
              <svg viewBox="0 0 64 60" className="h-16 w-16" role="img" aria-label={`${piece.name}, pour le mot ${word}`}>
                <ellipse cx="32" cy="56" rx="24" ry="3.5" fill="#C9A26B" opacity="0.6" />
                {piece.draw}
              </svg>
              <span className="mt-0.5 max-w-full truncate text-xs font-bold text-[#5C2A0A]">{word}</span>
            </li>
          );
        })}
        {/* The next plot, waiting for a word */}
        <li className="flex flex-col items-center">
          <span className="sr-only">Le prochain mot ajoutera une construction.</span>
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-[#B8925C] text-2xl text-[#9C7A48]" aria-hidden="true">
            +
          </span>
        </li>
      </ul>
    </section>
  );
}
