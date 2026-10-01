import Image from 'next/image';
import Link from 'next/link';
import ProgressBadge from '@/components/kid/ProgressBadge';
import type { Activity } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

async function loadToday(): Promise<Activity | null> {
  // The hub must open even if Airtable is down (the drawing studio and the
  // notebook don't need it).
  try {
    const { getTodayActivity } = await import('@/lib/airtable');
    return await getTodayActivity();
  } catch {
    return null;
  }
}

const TILES = [
  {
    href: '/app/dessins',
    emoji: '🎨',
    title: 'Mes dessins vivants',
    text: 'Prends ton dessin en photo… il se réveille !',
    bg: '#E6197A',
    fg: '#FDF6EC',
  },
  {
    href: '/app/dictee',
    emoji: '📒',
    title: 'Cahier de dictée',
    text: 'Écris avec ton doigt ou au clavier',
    bg: '#2EC4B6',
    fg: '#1A1A1A',
  },
  {
    href: '/app/select',
    emoji: '🎲',
    title: 'Choisir un mot',
    text: 'Par thème et par âge',
    bg: '#F4A340',
    fg: '#1A1A1A',
  },
];

export default async function AppHome() {
  const today = await loadToday();

  return (
    <main className="flex-1 px-4 py-8 sm:px-6" style={{ backgroundColor: '#FDF6EC', fontFamily: 'var(--font-read)' }}>
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 text-center">
          <Image
            src="/logo-mounas.png"
            alt="Les Mounas"
            width={400}
            height={400}
            priority
            className="mounas-float mx-auto mb-4 h-auto w-[220px]"
            style={{ mixBlendMode: 'multiply' }}
          />
          <p className="mb-4 text-2xl font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}>
            Apprendre à lire en s’amusant
          </p>
          <ProgressBadge />
        </header>

        {/* LESSON OF THE DAY */}
        <Link
          href={today ? `/app/lecon?id=${today.id}` : '/app/lecon?id=demo'}
          className="group mb-5 block overflow-hidden rounded-[2rem] p-7 text-center shadow-lg transition active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#E63946,#D4530C)', color: '#FDF6EC' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest opacity-85">
            {today ? 'La leçon du jour' : 'Essaie une leçon'}
          </p>
          <p className="my-3 text-7xl font-bold leading-none sm:text-8xl">{today ? today.frenchWord : 'maman'}</p>
          {today?.theme && (
            <span className="inline-block rounded-full px-4 py-1 text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              {today.theme} · Niveau {today.difficulty}
            </span>
          )}
          <div className="mt-5">
            <span className="inline-block rounded-full px-10 py-4 text-xl font-bold shadow-md transition group-hover:scale-105" style={{ backgroundColor: '#FDF6EC', color: '#E63946' }}>
              ▶ Jouer
            </span>
          </div>
        </Link>

        <div className="grid gap-4 sm:grid-cols-3">
          {TILES.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col items-center gap-1 rounded-[2rem] p-6 text-center shadow-md transition active:scale-95"
              style={{ backgroundColor: t.bg, color: t.fg }}
            >
              <span className="text-5xl">{t.emoji}</span>
              <span className="mt-1 text-xl font-bold">{t.title}</span>
              <span className="text-sm opacity-85">{t.text}</span>
            </Link>
          ))}
        </div>

        {today && (
          <p className="mt-8 text-center text-sm">
            <Link href={`/app/activity?id=${today.id}`} className="underline" style={{ color: '#5B1F8C' }}>
              📋 Guide du parent pour « {today.frenchWord} »
            </Link>
          </p>
        )}

        <footer className="mt-12 text-center">
          <p className="text-xs" style={{ color: 'rgba(26,26,26,0.4)' }}>Les Mounas · 2026</p>
        </footer>
      </div>
    </main>
  );
}
