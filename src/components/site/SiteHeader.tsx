import Link from 'next/link';
import MounasLogo from '@/components/brand/MounasLogo';
import { COLORS, STRIPE_PAYMENT_LINK, whatsappLink } from '@/lib/config';

const NAV = [
  { label: 'Accueil', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Consultation', href: '/#consultation' },
  { label: 'English', href: '/#english' },
  { label: "L'app", href: '/app' },
];

/**
 * `member` is set by the app layout when a subscriber is logged in: the trial
 * button then gives way to "Mon compte". The marketing pages don't read the
 * session (they stay static), so they always show "Se connecter".
 */
export default function SiteHeader({ member = false }: { member?: boolean }) {
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
          <Link
            href={member ? '/app/compte' : '/connexion'}
            className="text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-70"
            style={{ color: COLORS.purple }}
          >
            {member ? 'Mon compte' : 'Se connecter'}
          </Link>
          <a
            href={whatsappLink('Bonjour Les Mounas ! Je souhaite en savoir plus sur l’abonnement. 🌍')}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nous écrire sur WhatsApp"
            className="rounded-full px-4 py-2 text-sm font-bold transition-opacity hover:opacity-80"
            style={{ color: COLORS.tealDark, border: `1.5px solid ${COLORS.teal}` }}
          >
            💬 WhatsApp
          </a>
          {!member && (
            <a
              href={STRIPE_PAYMENT_LINK}
              className="rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
            >
              Essai gratuit 14 jours
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
