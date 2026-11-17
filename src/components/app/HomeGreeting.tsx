'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { hasProfile, profileName } from '@/lib/onboarding';

/*
 * What the /commencer questionnaire leaves on the app's home page: the
 * child's first name in the greeting, and, for a family that hasn't answered
 * it yet, a card that leads there.
 */

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

export function HomeGreeting() {
  const name = useSyncExternalStore(subscribe, profileName, () => '');
  return <p className="text-sm font-bold text-ink-soft">Bonjour{name ? ` ${name}` : ''} 👋</p>;
}

export function StartPrompt() {
  // True on the server and until hydrated: the card never flashes for a
  // family that has already answered.
  const answered = useSyncExternalStore(subscribe, hasProfile, () => true);
  if (answered) return null;
  return (
    <Link
      href="/commencer"
      className="group mb-5 flex items-center gap-4 rounded-3xl bg-[#F1E9F8] p-4 transition-colors hover:bg-[#E9DDF4]"
    >
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-2xl" aria-hidden="true">
        🌱
      </span>
      <span className="flex-1">
        <span className="block font-extrabold text-ink">Nouveau ici ? Prépare son programme</span>
        <span className="block text-sm text-ink-soft">2 minutes pour trouver son niveau et ses thèmes</span>
      </span>
      <span aria-hidden="true" className="text-xl text-ink transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}
