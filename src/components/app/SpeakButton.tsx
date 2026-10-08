'use client';

import { useSpeech } from '@/lib/useSpeech';

type Props = {
  text: string;
  label?: string;
  rate?: number;
  /** `solid` for the main call to listen, `soft` for secondary placements. */
  tone?: 'solid' | 'soft';
  className?: string;
};

/**
 * "Écouter" button — reads `text` in French. Renders nothing where the
 * browser can't speak, so there's never a dead button.
 */
export default function SpeakButton({ text, label = 'Écouter', rate, tone = 'solid', className = '' }: Props) {
  const { supported, speak, speaking } = useSpeech();
  if (!supported) return null;
  const active = speaking === text;

  return (
    <button
      type="button"
      onClick={() => speak(text, rate)}
      aria-label={`${label} : ${text}`}
      className={`inline-flex min-h-12 items-center gap-2 rounded-full px-5 py-2.5 text-base font-bold transition-transform active:scale-95 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mpurple ${
        tone === 'solid'
          ? 'bg-mpurple text-cream shadow-md hover:bg-[#4a1873]'
          : 'bg-white text-mpurple ring-1 ring-mpurple/25 hover:bg-mpurple/5'
      } ${className}`}
    >
      <span aria-hidden="true" className={active ? 'animate-pop' : ''}>
        {active ? '🔊' : '🔈'}
      </span>
      {label}
    </button>
  );
}
