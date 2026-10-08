/**
 * A row of cards, one per letter, face down (wax-print backs in the brand
 * colours) or face up (the letter in its syllable colour). Pure markup — the
 * home page shows it static, the activity flips it (see MysteryWord).
 */

export const BACK_COLORS = ['#E63946', '#5B1F8C', '#0E8C80', '#F4A340'];

type Props = {
  letters: { char: string; color: string }[];
  /** Which cards are face up. */
  flipped?: boolean[];
  /** Stagger the flip, card after card (the reveal). */
  stagger?: boolean;
  /** Gentle hop on the face-down cards, inviting a tap. */
  invite?: boolean;
  className?: string;
};

const isGap = (c: string) => /[\s'’-]/.test(c);

export function letterCount(word: string): number {
  return Array.from(word).filter((c) => !isGap(c)).length;
}

export default function MysteryTiles({ letters, flipped = [], stagger = false, invite = false, className = '' }: Props) {
  const n = letters.filter((l) => !isGap(l.char)).length;
  const text = n <= 4 ? 'text-5xl' : n <= 6 ? 'text-4xl' : n <= 8 ? 'text-3xl' : 'text-2xl';
  // Position of each letter among the cards (gaps like "-" are not cards).
  const cardIndex = letters.map((_, i) => letters.slice(0, i).filter((l) => !isGap(l.char)).length);
  return (
    <div className={`flex items-center justify-center gap-1.5 sm:gap-2 ${className}`} aria-hidden="true">
      {letters.map((l, i) => {
        if (isGap(l.char)) {
          return (
            <span key={i} className="w-2 text-center font-display text-2xl font-bold text-ink/40">
              {l.char.trim()}
            </span>
          );
        }
        const card = cardIndex[i];
        const up = Boolean(flipped[i]);
        return (
          <span
            key={i}
            className={`flip-card aspect-[3/4] min-w-0 max-w-[68px] flex-1 ${invite && !up ? 'animate-invite' : ''}`}
            style={{ ['--delay' as string]: `${card * 0.12}s` }}
          >
            <span className={`flip-inner block ${up ? 'is-flipped' : ''}`} style={{ transitionDelay: stagger ? `${card * 110}ms` : '0ms' }}>
              <span
                className="flip-face mystery-back sheen block shadow-[0_4px_0_rgba(26,26,26,0.18)]"
                style={{ ['--back' as string]: BACK_COLORS[card % BACK_COLORS.length] }}
              />
              <span className="flip-face flip-front flex items-center justify-center bg-white shadow-[0_4px_0_rgba(26,26,26,0.12)] ring-1 ring-ink/10">
                <span className={`font-display font-bold leading-none ${text}`} style={{ color: l.color }}>
                  {l.char}
                </span>
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
