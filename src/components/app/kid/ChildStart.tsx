'use client';

import { useRouter } from 'next/navigation';
import { setChildMode } from '@/lib/child-mode';

/**
 * « C'est parti » on the home page: turns child mode on and opens the word.
 * The child goes through the steps with pictures and a voice; the parent's
 * explanations and tips stay on screen for whoever is nearby.
 */
export default function ChildStart({ href }: { href: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        setChildMode(true);
        router.push(href);
      }}
      className="group flex w-full items-center gap-4 rounded-[28px] bg-mred-dark p-4 text-left text-cream shadow-[0_10px_30px_-10px_rgba(230,57,70,0.7)] transition-transform active:scale-[0.98]"
    >
      <span
        aria-hidden="true"
        className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-cream text-mred shadow-[0_5px_0_rgba(26,26,26,0.18)] transition-transform group-hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="ml-1.5 h-10 w-10" fill="currentColor">
          <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
        </svg>
      </span>
      <span>
        <span className="block font-display text-3xl font-bold leading-tight">C’est parti !</span>
        <span className="mt-1 block text-sm font-semibold leading-snug text-cream/90">
          Mode enfant : des images et une voix guident ton enfant. Tes astuces restent affichées.
        </span>
      </span>
    </button>
  );
}
