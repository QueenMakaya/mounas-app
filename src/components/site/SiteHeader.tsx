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

/**
 * `member` is set by the app layout when a subscriber is logged in: the trial
 * button then gives way to "Mon compte". The marketing pages don't read the
 * session (they stay static), so they always show "Se connecter".
 *
 * Logged in, the account link shows a round avatar (the first letter of the
 * account email) with a green dot, so a family sees at a glance that it is
 * connected: the word of the day also opens without an account. `account` is
 * that email.
 */
export default function SiteHeader({ member = false, account }: { member?: boolean; account?: string }) {
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
          {member ? (
            <Link
              href="/app/compte"
              aria-label={`Mon compte : connecté${account ? ` (${account})` : ''}`}
              title={account ? `Connecté · ${account}` : 'Connecté'}
              className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: COLORS.purple }}
            >
              <span className="relative inline-flex">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold uppercase shadow-sm"
                  style={{ backgroundColor: COLORS.purple, color: COLORS.cream }}
                  aria-hidden="true"
                >
                  {account ? account.charAt(0) : <PersonIcon />}
                </span>
                {/* Green dot: the family is logged in. */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: '#2D9B6F' }}
                  aria-hidden="true"
                />
              </span>
              Mon compte
            </Link>
          ) : (
            <Link
              href="/connexion"
              className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: COLORS.purple }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed"
                style={{ borderColor: COLORS.purple }}
                aria-hidden="true"
              >
                <PersonIcon />
              </span>
              <span className="underline underline-offset-4">Se connecter</span>
            </Link>
          )}
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
            <Link
              href="/demo"
              className="rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
            >
              Essayer gratuitement
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
    </svg>
  );
}
