/**
 * Colours for syllables, in order. Same idea as the "Mot du Jour" cards: each
 * syllable gets its own colour so the child *sees* the word's rhythm before
 * reading it. All four pass 3:1 contrast on cream at display sizes.
 */
export const SYLLABLE_COLORS = ['#E63946', '#5B1F8C', '#0E8C80', '#C7600A'];

/**
 * Splits "ma-man" into ["ma", "man"]. Only trusts the syllables when they
 * spell the word, so a typo in Airtable never shows the wrong word.
 */
export function splitSyllables(word: string, syllables: string): string[] {
  const parts = syllables
    .split(/[-·•\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const norm = (s: string) => s.toLocaleLowerCase('fr').replace(/[\s'’-]/g, '');
  if (parts.length > 0 && norm(parts.join('')) === norm(word)) return parts;
  return [word];
}

type Props = {
  word: string;
  syllables: string;
  className?: string;
  /** Show a thin dot between syllables (helps early readers). */
  dots?: boolean;
};

export default function SyllableWord({ word, syllables, className, dots = false }: Props) {
  const parts = splitSyllables(word, syllables);
  // Display the word's own spelling/casing, sliced to the syllable lengths.
  let cursor = 0;
  const slices = parts.length > 1
    ? parts.map((p) => {
        const s = word.slice(cursor, cursor + p.length);
        cursor += p.length;
        return s;
      })
    : [word];
  const sliced = slices.join('') === word ? slices : parts;

  return (
    <span className={className}>
      <span className="sr-only">{word}</span>
      <span aria-hidden="true">
        {sliced.map((s, i) => (
          <span key={i}>
            {dots && i > 0 && <span className="mx-[0.04em] opacity-30 text-ink">·</span>}
            <span style={{ color: SYLLABLE_COLORS[i % SYLLABLE_COLORS.length] }}>{s}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
