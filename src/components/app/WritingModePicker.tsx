'use client';

import { useState, useSyncExternalStore } from 'react';
import { readPref, writePref } from '@/lib/progress';

/**
 * How the child writes: over the school cursive (minuscules), over capitals,
 * or on a blank page with no model. The last choice is remembered on the
 * device, so a child who loves capitals finds them again the next day.
 */

export type WritingMode = 'minuscules' | 'capitales' | 'blanc';

const LS_WRITING_MODE = 'mounas_writing_mode';
const MODES: WritingMode[] = ['minuscules', 'capitales', 'blanc'];
const subscribeNoop = () => () => {};
const readMode = (): WritingMode => {
  const saved = readPref(LS_WRITING_MODE);
  return MODES.find((m) => m === saved) ?? 'minuscules';
};

export function useWritingMode(): [WritingMode, (mode: WritingMode) => void] {
  const saved = useSyncExternalStore(subscribeNoop, readMode, () => 'minuscules' as const);
  const [chosen, setChosen] = useState<WritingMode | null>(null);
  const choose = (mode: WritingMode) => {
    setChosen(mode);
    writePref(LS_WRITING_MODE, mode);
  };
  return [chosen ?? saved, choose];
}

/** The tracing model for a word: text, CSS font variable and paper. */
export function writingModel(mode: WritingMode, word: string) {
  if (mode === 'blanc') return { text: undefined, font: '--font-cursive', paper: 'blanc' as const };
  if (mode === 'capitales') return { text: word.toLocaleUpperCase('fr'), font: '--font-read', paper: 'seyes' as const };
  return { text: word.toLocaleLowerCase('fr'), font: '--font-cursive', paper: 'seyes' as const };
}

/** Three big pills a child can pick from the picture alone. */
export default function WritingModePicker({ mode, onChange, accent = '#2D9B6F' }: { mode: WritingMode; onChange: (mode: WritingMode) => void; accent?: string }) {
  const options: { value: WritingMode; label: string; icon: React.ReactNode }[] = [
    {
      value: 'minuscules',
      label: 'Minuscules',
      icon: <span className="text-2xl leading-none" style={{ fontFamily: 'var(--font-cursive)' }}>abc</span>,
    },
    {
      value: 'capitales',
      label: 'CAPITALES',
      icon: <span className="text-2xl font-bold leading-none" style={{ fontFamily: 'var(--font-read)' }}>ABC</span>,
    },
    {
      value: 'blanc',
      label: 'Feuille blanche',
      icon: (
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true">
          <path d="M6 2.5h8.5L19 7v14.5H6z" fill="#fff" />
          <path d="M14.5 2.5V7H19" />
        </svg>
      ),
    },
  ];
  return (
    <div role="group" aria-label="Comment veux-tu écrire ?" className="mb-3 grid grid-cols-3 gap-2">
      {options.map((o) => {
        const on = mode === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-transform active:scale-95 ${
              on ? 'text-cream shadow-md' : 'bg-white text-ink ring-1 ring-ink/10'
            }`}
            style={on ? { backgroundColor: accent } : undefined}
          >
            {o.icon}
            <span className="text-[11px] font-extrabold leading-tight sm:text-xs">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
