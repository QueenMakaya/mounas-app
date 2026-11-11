import type { Metadata } from 'next';
import Link from 'next/link';
import { LESSONS } from '@/lib/lessons';

export const metadata: Metadata = {
  title: 'Les leçons sur les sons | Les Mounas',
  description: 'Les petites leçons des Mounas pour comprendre les sons du français : voyelles et consonnes, la lettre Y…',
};

/** Every lesson in one place, so a parent can find them again. */
export default function LessonsPage() {
  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <Link href="/app" className="text-sm font-bold text-ink-soft">
          ← Accueil
        </Link>
        <h1 className="mt-4 font-display text-4xl font-bold text-ink">Les leçons sur les sons</h1>
        <p className="mt-2 text-ink-soft">Une petite règle à la fois, avec des cases à toucher et un jeu à la fin.</p>
        <ul className="mt-6 grid gap-3">
          {Object.values(LESSONS).map((l) => (
            <li key={l.slug}>
              <Link
                href={l.href}
                className="group flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-ink/5 transition-colors hover:bg-sand"
              >
                <span
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-cream"
                  style={{ backgroundColor: l.color }}
                  aria-hidden="true"
                >
                  {l.badge}
                </span>
                <span className="flex-1">
                  <span className="block font-extrabold text-ink">{l.title}</span>
                  <span className="block text-sm text-ink-soft">{l.short}</span>
                </span>
                <span aria-hidden="true" className="text-xl text-ink transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
