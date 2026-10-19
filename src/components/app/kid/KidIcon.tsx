import type { KidIconName } from '@/lib/prompts';

/*
 * The child-mode pictograms: one simple drawing per thing to do, readable
 * before reading (écouter, toucher, glisser, écrire, dire, taper des mains,
 * suivant, rejouer), plus the parent lock. Stroked in currentColor so each
 * step can tint them with its accent.
 */

type Name = KidIconName | 'cadenas';

// A finger pointing up, as when touching the screen (24×24, tip at 11.5, 4).
const FINGER =
  'M10 14V5.5a1.5 1.5 0 0 1 3 0V11l3.6.7a2 2 0 0 1 1.6 2.2l-.5 4.1A2.5 2.5 0 0 1 15.2 20H11a2.5 2.5 0 0 1-2-1l-2.6-3.4a1.4 1.4 0 0 1 2.1-1.8z';

const PATHS: Record<Name, React.ReactNode> = {
  ecouter: (
    <>
      <path d="M7 9.5a5 5 0 0 1 10 0c0 3-2.5 4-3 6s-1.5 3.5-3.5 3.5S7.5 18 7.5 16.5" />
      <path d="M10 10a2 2 0 0 1 4 0c0 1.2-1 1.8-1.5 2.5" />
    </>
  ),
  toucher: (
    <>
      <path d={FINGER} transform="translate(0 2)" />
      <path d="M8 4.2a4.5 4.5 0 0 1 7 0" />
    </>
  ),
  glisser: (
    <>
      <path d={FINGER} transform="translate(0 3)" />
      <path d="M4 3.5h13M14.5 1.2l2.5 2.3-2.5 2.3" />
    </>
  ),
  ecrire: (
    <>
      <path d="M5 19l1-4L16 5l3 3L9 18z" />
      <path d="M14 7l3 3M4 22h9" />
    </>
  ),
  dire: (
    <>
      <path d="M2.5 11.5C5 8.5 7.5 7.5 9.5 8l2.5 1 2.5-1c2-.5 4.5.5 7 3.5-2 4-5.5 6-9.5 6s-7.5-2-9.5-6z" />
      <path d="M6 12c2 .8 4 1.2 6 1.2s4-.4 6-1.2c-1.6 2-3.7 3-6 3s-4.4-1-6-3z" />
    </>
  ),
  mains: (
    <>
      <rect x="6" y="8.5" width="5" height="12.5" rx="2.5" transform="rotate(16 8.5 14.75)" />
      <rect x="13" y="8.5" width="5" height="12.5" rx="2.5" transform="rotate(-16 15.5 14.75)" />
      <path d="M12 2v2.5M7 3.5l1.3 2M17 3.5l-1.3 2M3.5 9l2 .8M20.5 9l-2 .8" />
    </>
  ),
  suivant: <path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" />,
  rejouer: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4" />
      <path d="M4 3.5V8h4.5" />
    </>
  ),
  cadenas: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5" />
    </>
  ),
};

export default function KidIcon({ name, className = 'h-8 w-8', strokeWidth = 2 }: { name: Name; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

/**
 * The helping hand: after two wrong tries it points at the right answer.
 * Drawn under the target (its parent must be `relative`), pointing up.
 */
export function HintHand() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-full z-10 -ml-5 -mt-3 block h-10 w-10 animate-point">
      <svg viewBox="0 0 24 24" className="h-10 w-10 drop-shadow-md">
        <path d={FINGER} fill="#F7C26B" stroke="#1A1A1A" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
