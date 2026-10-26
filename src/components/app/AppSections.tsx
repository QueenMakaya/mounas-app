'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/*
 * The app's sections, always one tap away: a row of big picture buttons at
 * the top of every app screen, so nobody has to scroll or search to find the
 * dictation, the calculations or the missions. The same pictures as on the
 * home page cards. Hidden during the word itself (/app/activity), which has
 * its own steps and, in child mode, must not let the child wander off.
 */

const SECTIONS = [
  { href: '/app', label: 'Mot du jour', icon: '✨', tint: '#FDECEE', match: (p: string) => p === '/app' || p.startsWith('/app/select') },
  { href: '/app/dictee', label: 'Dictée', icon: '📒', tint: '#E3F8F5' },
  { href: '/app/calcul', label: 'Calcul', icon: '1+2', tint: '#F1E9F8' },
  { href: '/app/missions', label: 'Missions', icon: '🧩', tint: '#FEF3E2' },
  { href: '/app/progres', label: 'Progrès', icon: '📊', tint: '#FFF1E0' },
];

const HIDDEN = ['/app/activity'];

/** The calculation picture: « 1+2 » drawn in the app's colours, clearer than any emoji. */
export function CalculIcon({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`font-display font-black leading-none tracking-tight ${className}`}>
      <span className="text-mred">1</span>
      <span className="text-mpurple">+</span>
      <span className="text-mteal-ink">2</span>
    </span>
  );
}

export default function AppSections() {
  const pathname = usePathname() ?? '';
  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav aria-label="Les rubriques de l’app" className="border-b border-ink/5 bg-cream">
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1.5 px-3 py-2.5 sm:gap-3 sm:px-6">
        {SECTIONS.map((s) => {
          const active = s.match ? s.match(pathname) : pathname === s.href || pathname.startsWith(`${s.href}/`);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition-colors ${active ? 'bg-white shadow-sm ring-2 ring-ink/80' : 'hover:bg-white/70'}`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: s.tint }}>
                  {s.icon === '1+2' ? <CalculIcon className="text-lg" /> : <span aria-hidden="true">{s.icon}</span>}
                </span>
                <span className={`text-center text-[11px] leading-tight sm:text-xs ${active ? 'font-extrabold text-ink' : 'font-bold text-ink-soft'}`}>{s.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
