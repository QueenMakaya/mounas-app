
import type { ReactNode } from 'react';
import type { Camp, Kind } from '@/lib/echecs';
import { DEFAULT_TEAMS, type FabricId } from '@/lib/echecs-tissus';

/*
 * The pieces of Mounaville, drawn as round tokens like a children's board
 * game, each team wearing its fabric: the outer ring is the cloth's pattern
 * (kente bands, bogolan zigzags, kuba diamonds, ndop indigo, kanga dots), the
 * centre a plain disc with the figure, so it stays easy to read. Each figure
 * is a simple silhouette a 4-year-old can name: a crown, a queen in her gele,
 * a charging rhinoceros, an elephant seen from the front, a gazelle with her
 * long horns, a little Mouna with her two puffs of hair.
 */

type Art = { fill: string; ink: string; soft: string; edge: string; tile: number; pattern: ReactNode };

const ART: Record<FabricId, Art> = {
  // Ghana: woven bands of gold, green, red and black.
  kente: {
    fill: '#FFE9A6',
    ink: '#14532D',
    soft: '#C8102E',
    edge: '#14532D',
    tile: 16,
    pattern: (
      <>
        <rect width="16" height="16" fill="#F2B705" />
        <rect width="4" height="16" fill="#1E7B3A" />
        <rect x="8" width="8" height="4" fill="#C8102E" />
        <rect x="8" y="8" width="8" height="4" fill="#1A1A1A" />
        <rect x="4" y="4" width="4" height="4" fill="#1A1A1A" />
        <rect x="4" y="12" width="4" height="4" fill="#C8102E" />
      </>
    ),
  },
  // Mali: cream zigzags and dots painted on earth brown.
  bogolan: {
    fill: '#3B2416',
    ink: '#F3E3C3',
    soft: '#D9A066',
    edge: '#1E120A',
    tile: 18,
    pattern: (
      <>
        <rect width="18" height="18" fill="#3B2416" />
        <path d="M0 8 L4.5 3 L9 8 L13.5 3 L18 8" fill="none" stroke="#F3E3C3" strokeWidth="1.8" />
        <circle cx="4.5" cy="13.5" r="1.6" fill="#F3E3C3" />
        <circle cx="13.5" cy="13.5" r="1.6" fill="#F3E3C3" />
      </>
    ),
  },
  // RD Congo: brown diamonds on raffia beige.
  kuba: {
    fill: '#EFE1C2',
    ink: '#5A3418',
    soft: '#A0522D',
    edge: '#5A3418',
    tile: 16,
    pattern: (
      <>
        <rect width="16" height="16" fill="#D8BE8A" />
        <path d="M8 1.5 L14.5 8 L8 14.5 L1.5 8 Z" fill="none" stroke="#5A3418" strokeWidth="2" />
        <rect x="6.5" y="6.5" width="3" height="3" fill="#5A3418" />
      </>
    ),
  },
  // Cameroon: white motifs on deep indigo.
  ndop: {
    fill: '#1B2A6B',
    ink: '#FFFFFF',
    soft: '#8FB3FF',
    edge: '#0E1640',
    tile: 14,
    pattern: (
      <>
        <rect width="14" height="14" fill="#1B2A6B" />
        <path d="M7 0 V14 M0 7 H14" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1" />
        <circle cx="3.5" cy="3.5" r="1.8" fill="#FFFFFF" />
        <circle cx="10.5" cy="10.5" r="1.8" fill="#FFFFFF" />
      </>
    ),
  },
  // Kenya, Tanzania: bright pink with yellow dots.
  kanga: {
    fill: '#D81B60',
    ink: '#FFFFFF',
    soft: '#FFD23F',
    edge: '#7A0E36',
    tile: 16,
    pattern: (
      <>
        <rect width="16" height="16" fill="#D81B60" />
        <circle cx="8" cy="8" r="3.4" fill="#FFD23F" />
        <circle cx="8" cy="8" r="1.3" fill="#1A1A1A" />
        <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
        <circle cx="16" cy="16" r="1.5" fill="#FFFFFF" />
        <circle cx="16" cy="0" r="1.5" fill="#FFFFFF" />
        <circle cx="0" cy="16" r="1.5" fill="#FFFFFF" />
      </>
    ),
  },
};

/** The main colours of a fabric, for small swatches and badges. */
export function fabricColors(id: FabricId) {
  const a = ART[id];
  return { fill: a.fill, ink: a.ink, edge: a.edge };
}

/** A little round sample of the cloth. */
export function FabricSwatch({ id, className = '' }: { id: FabricId; className?: string }) {
  const a = ART[id];
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <pattern id={`sw-${id}`} width={a.tile} height={a.tile} patternUnits="userSpaceOnUse">
          {a.pattern}
        </pattern>
      </defs>
      <circle cx="20" cy="20" r="18" fill={`url(#sw-${id})`} stroke={a.edge} strokeWidth="2.5" />
    </svg>
  );
}

export default function PieceIcon({
  kind,
  camp,
  fabric,
  className = '',
  title,
}: {
  kind: Kind;
  camp: Camp;
  /** The team's cloth; by default Kente for your team, Bogolan for the other side. */
  fabric?: FabricId;
  className?: string;
  title?: string;
}) {
  const id = fabric ?? DEFAULT_TEAMS[camp];
  const a = ART[id];
  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <pattern id={`fab-${id}`} width={a.tile} height={a.tile} patternUnits="userSpaceOnUse">
          {a.pattern}
        </pattern>
      </defs>
      <circle cx="50" cy="52" r="45" fill="rgba(26,26,26,0.2)" />
      <circle cx="50" cy="48" r="45" fill={`url(#fab-${id})`} stroke={a.edge} strokeWidth="3" />
      <circle cx="50" cy="48" r="35" fill={a.fill} stroke={a.edge} strokeWidth="2.5" />
      <g transform="translate(50 48) scale(0.74) translate(-50 -48)" fill={a.ink} stroke={a.ink} strokeLinejoin="round" strokeLinecap="round">
        <Figure kind={kind} soft={a.soft} fill={a.fill} />
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
