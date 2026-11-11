import type { Camp, Kind } from '@/lib/echecs';

/*
 * The pieces of Mounaville, drawn as round tokens like a children's board
 * game: Soleil in warm cream and amber, Lune in deep purple. Each figure is a
 * simple silhouette a 4-year-old can name: a crown, a queen in her gele, a
 * charging rhinoceros, an elephant seen from the front, a gazelle with her
 * long horns, a little Mouna with her two puffs of hair.
 */

const CAMP_STYLE: Record<Camp, { fill: string; ring: string; ink: string; soft: string }> = {
  s: { fill: '#FFF7E8', ring: '#F4A340', ink: '#9A4A06', soft: '#F4A340' },
  l: { fill: '#5B1F8C', ring: '#2E0F47', ink: '#FDF6EC', soft: '#C9A6E8' },
};

export default function PieceIcon({ kind, camp, className = '', title }: { kind: Kind; camp: Camp; className?: string; title?: string }) {
  const c = CAMP_STYLE[camp];
  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <circle cx="50" cy="52" r="44" fill="rgba(26,26,26,0.18)" />
      <circle cx="50" cy="48" r="44" fill={c.fill} stroke={c.ring} strokeWidth="5" />
      <g fill={c.ink} stroke={c.ink} strokeLinejoin="round" strokeLinecap="round">
        <Figure kind={kind} soft={c.soft} fill={c.fill} />
      </g>
    </svg>
  );
}

function Figure({ kind, soft, fill }: { kind: Kind; soft: string; fill: string }) {
  switch (kind) {
    case 'k':
      // A crown with three points, jewels and a band.
      return (
        <>
          <path d="M24 66 L20 32 L36 46 L50 24 L64 46 L80 32 L76 66 Z" strokeWidth="3" />
          <rect x="22" y="66" width="56" height="9" rx="3" strokeWidth="2" />
          <circle cx="20" cy="30" r="4.5" fill={soft} strokeWidth="0" />
          <circle cx="50" cy="22" r="5" fill={soft} strokeWidth="0" />
          <circle cx="80" cy="30" r="4.5" fill={soft} strokeWidth="0" />
          <circle cx="38" cy="58" r="3.5" fill={fill} strokeWidth="0" />
          <circle cx="50" cy="56" r="4" fill={fill} strokeWidth="0" />
          <circle cx="62" cy="58" r="3.5" fill={fill} strokeWidth="0" />
        </>
      );
    case 'q':
      // A queen: tall patterned gele (head wrap) with a small crown, smiling face, earrings, necklace.
      return (
        <>
          <path d="M40 16 L44 6 L50 13 L56 6 L60 16 Z" fill={soft} strokeWidth="1.5" stroke={soft} />
          <path d="M28 42 C22 24 38 14 50 15 C64 16 80 24 72 42 C62 37 38 37 28 42 Z" strokeWidth="2" />
          <circle cx="40" cy="28" r="2.6" fill={soft} strokeWidth="0" />
          <circle cx="50" cy="24" r="2.6" fill={soft} strokeWidth="0" />
          <circle cx="60" cy="28" r="2.6" fill={soft} strokeWidth="0" />
          <ellipse cx="50" cy="53" rx="15" ry="15" strokeWidth="0" />
          <circle cx="44" cy="51" r="2.3" fill={fill} strokeWidth="0" />
          <circle cx="56" cy="51" r="2.3" fill={fill} strokeWidth="0" />
          <path d="M44 58 C47 61 53 61 56 58" fill="none" stroke={fill} strokeWidth="2.5" />
          <circle cx="34" cy="60" r="4" fill={soft} strokeWidth="0" />
          <circle cx="66" cy="60" r="4" fill={soft} strokeWidth="0" />
          <path d="M28 84 C30 72 40 68 50 68 C60 68 70 72 72 84 Z" strokeWidth="2" />
          <path d="M39 71 C44 77 56 77 61 71" fill="none" stroke={soft} strokeWidth="3.5" />
        </>
      );
    case 'r':
      // A rhinoceros charging to the right: body, head, two horns, four legs.
      return (
        <>
          <ellipse cx="44" cy="54" rx="24" ry="15" strokeWidth="0" />
          <path d="M60 46 C68 42 76 46 80 54 C82 60 76 64 68 63 L60 62 Z" strokeWidth="1" />
          <path d="M76 48 L84 32 L80 50 Z" strokeWidth="2" />
          <path d="M70 45 L72 36 L74 46 Z" strokeWidth="2" />
          <path d="M60 42 L62 34 L66 42 Z" strokeWidth="1" />
          <rect x="26" y="62" width="8" height="14" rx="3" strokeWidth="0" />
          <rect x="38" y="64" width="8" height="12" rx="3" strokeWidth="0" />
          <rect x="50" y="62" width="8" height="14" rx="3" strokeWidth="0" />
          <path d="M20 52 C16 50 15 46 17 44" fill="none" strokeWidth="3" />
          <circle cx="70" cy="51" r="2.2" fill={fill} strokeWidth="0" />
        </>
      );
    case 'b':
      // An elephant from the front: big ears, head, trunk curling up, tusks.
      return (
        <>
          <path d="M34 30 C18 26 12 44 18 58 C22 66 30 64 36 58 Z" strokeWidth="2" />
          <path d="M66 30 C82 26 88 44 82 58 C78 66 70 64 64 58 Z" strokeWidth="2" />
          <path d="M33 30 C33 20 67 20 67 30 C67 46 60 54 56 58 L44 58 C40 54 33 46 33 30 Z" strokeWidth="2" />
          <path d="M47 56 C46 66 46 74 50 78 C54 82 60 80 61 74" fill="none" strokeWidth="8" />
          <path d="M42 56 C38 62 36 66 37 70" fill="none" stroke={soft} strokeWidth="4" />
          <path d="M58 56 C62 62 64 64 63 68" fill="none" stroke={soft} strokeWidth="4" />
          <circle cx="42" cy="38" r="2.6" fill={fill} strokeWidth="0" />
          <circle cx="58" cy="38" r="2.6" fill={fill} strokeWidth="0" />
        </>
      );
    case 'n':
      // A gazelle's head: long ringed horns curving back, ears, a slender face.
      return (
        <>
          <path d="M44 34 C38 22 36 14 40 8" fill="none" strokeWidth="5" />
          <path d="M56 34 C62 22 64 14 60 8" fill="none" strokeWidth="5" />
          <path d="M40 20 L46 19 M38 26 L45 26 M60 20 L54 19 M62 26 L55 26" fill="none" stroke={soft} strokeWidth="2" />
          <path d="M40 36 C30 32 22 34 20 40 C28 44 34 44 40 42 Z" strokeWidth="2" />
          <path d="M60 36 C70 32 78 34 80 40 C72 44 66 44 60 42 Z" strokeWidth="2" />
          <path d="M38 36 C38 30 62 30 62 36 C62 52 58 70 50 78 C42 70 38 52 38 36 Z" strokeWidth="2" />
          <path d="M44 44 C46 56 47 64 50 72 C53 64 54 56 56 44" fill="none" stroke={soft} strokeWidth="2.5" />
          <circle cx="44" cy="42" r="2.6" fill={fill} strokeWidth="0" />
          <circle cx="56" cy="42" r="2.6" fill={fill} strokeWidth="0" />
        </>
      );
    case 'p':
      // A little Mouna: round face with two puffs of hair, smile, small body.
      return (
        <>
          <circle cx="31" cy="30" r="10" strokeWidth="0" />
          <circle cx="69" cy="30" r="10" strokeWidth="0" />
          <circle cx="50" cy="44" r="17" strokeWidth="0" />
          <path d="M28 82 C28 68 38 62 50 62 C62 62 72 68 72 82 Z" strokeWidth="0" />
          <circle cx="44" cy="44" r="2.4" fill={fill} strokeWidth="0" />
          <circle cx="56" cy="44" r="2.4" fill={fill} strokeWidth="0" />
          <path d="M44 51 C47 54 53 54 56 51" fill="none" stroke={fill} strokeWidth="2.5" />
        </>
      );
  }
}
