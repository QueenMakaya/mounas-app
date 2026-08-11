import Link from 'next/link';
import MounasLogo from '@/components/brand/MounasLogo';
import { COLORS, whatsappLink } from '@/lib/config';

const NAV = [
  { label: 'Accueil', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Consultation', href: '/#consultation' },
  { label: 'English', href: '/#english' },
  { label: "L'app", href: '/app' },
];

export default function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur"
      style={{ backgroundColor: 'rgba(253,246,236,0.85)', borderBottom: '1px solid rgba(26,26,26,0.08)' }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <MounasLogo href="/" variant="wordmark" height={30} />

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: COLORS.ink }}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={whatsappLink('Bonjour Les Mounas ! Je souhaite en savoir plus sur l’abonnement. 🌍')}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
          >
            Rejoindre
          </a>
        </nav>
      </div>
    </header>
  );
}
