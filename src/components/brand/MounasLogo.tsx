import Link from 'next/link';
import DiamondIcon from './DiamondIcon';
import { COLORS } from '@/lib/config';

// Per-letter colours echoing the MOUNAS wordmark in the logo artwork.
const LETTERS: { char: string; color: string }[] = [
  { char: 'M', color: COLORS.amber },
  { char: 'O', color: COLORS.teal },
  { char: 'U', color: COLORS.amber },
  { char: 'N', color: COLORS.pink },
  { char: 'A', color: COLORS.purple },
  { char: 'S', color: COLORS.red },
];

type Props = {
  /** Where the logo links to. Pass null to render a non-linked mark. */
  href?: string | null;
  /** Wordmark font size in px. Icon scales with it. */
  size?: number;
  /** Render the wordmark in a single flat colour instead of multicolour. */
  monoColor?: string;
  className?: string;
};

/**
 * Full Mounas logo: the geometric diamond mark next to the "MOUNAS" wordmark.
 * Used in the site header and footer so the logo always reads as a complete
 * lockup (icon + text), not an icon on its own.
 */
export default function MounasLogo({ href = '/', size = 26, monoColor, className }: Props) {
  const wordmark = (
    <span
      className="inline-flex items-baseline font-bold leading-none tracking-tight"
      style={{ fontFamily: 'var(--font-fraunces)', fontSize: size }}
    >
      {LETTERS.map((l, i) => (
        <span key={i} style={{ color: monoColor ?? l.color }}>
          {l.char}
        </span>
      ))}
    </span>
  );

  const content = (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <DiamondIcon size={Math.round(size * 0.85)} title="Les Mounas" />
      {wordmark}
    </span>
  );

  if (href === null) return content;

  return (
    <Link href={href} aria-label="Les Mounas — accueil" className="inline-flex">
      {content}
    </Link>
  );
}
