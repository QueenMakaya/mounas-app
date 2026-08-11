import Link from 'next/link';
import Image from 'next/image';

/**
 * The real Mounas logo artwork (public/logo-mounas.png), pre-trimmed into two
 * transparent variants so it stays crisp at small sizes:
 *
 *  - `wordmark` — the "MOUNAS" lettering only. Best in the compact site header.
 *  - `lockup`   — lettering + the four-glyph frieze. Best where there's room
 *                 to breathe (e.g. the footer).
 *
 * Trimmed from the 3000×3000 source with scripts/… (see PR); ratios below match
 * the exported PNGs so `next/image` reserves the right box and never distorts.
 */
const VARIANTS = {
  wordmark: { src: '/logo-mounas-wordmark.png', ratio: 1823 / 404 },
  lockup: { src: '/logo-mounas-lockup.png', ratio: 1839 / 650 },
} as const;

type Props = {
  /** Where the logo links to. Pass null to render a non-linked image. */
  href?: string | null;
  /** Which artwork to show. */
  variant?: keyof typeof VARIANTS;
  /** Rendered height in px; width scales with the artwork ratio. */
  height?: number;
  /** Legacy alias for `height` (older callers passed `size`). */
  size?: number;
  className?: string;
};

/**
 * Renders the actual brand logo image (not a font recreation), so the header
 * and footer always show the true Mounas artwork and colours.
 */
export default function MounasLogo({
  href = '/',
  variant = 'wordmark',
  height,
  size,
  className,
}: Props) {
  const h = height ?? size ?? 28;
  const { src, ratio } = VARIANTS[variant];
  const w = Math.round(h * ratio);

  const img = (
    <Image
      src={src}
      alt="Les Mounas"
      width={w}
      height={h}
      priority
      className={className}
      style={{ height: h, width: 'auto' }}
    />
  );

  if (href === null) return img;

  return (
    <Link href={href} aria-label="Les Mounas — accueil" className="inline-flex items-center">
      {img}
    </Link>
  );
}
