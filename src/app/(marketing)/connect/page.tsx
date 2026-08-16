import type { Metadata } from 'next';
import Link from 'next/link';
import DiamondIcon from '@/components/brand/DiamondIcon';
import EbookSignup from '@/components/marketing/EbookSignup';
import NewsletterSignup from '@/components/marketing/NewsletterSignup';
import BookingSection from '@/components/marketing/BookingSection';
import { COLORS, SOCIAL_LINKS, whatsappLink } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Restons connectés — Les Mounas',
  description:
    'Tous les liens Les Mounas au même endroit : l’abonnement WhatsApp, le guide gratuit, l’appel de 20 minutes, l’activité du jour et la newsletter.',
};

/**
 * /connect — the single landing page every external CTA can point at
 * (bio Instagram/TikTok, boutons de fin d'article, flyers, QR codes…).
 *
 * It deliberately duplicates no copy: it re-uses the same signup components as
 * the landing page so a change there shows up here too.
 */

// The three ways to reach us / start, in the order we want people to try them.
const ROUTES = [
  {
    key: 'app',
    href: '/app',
    emoji: '✨',
    color: COLORS.amber,
    title: 'L’activité du jour',
    body: 'Le mot du jour, la chanson et l’activité de 10 minutes — à faire tout de suite.',
  },
  {
    key: 'blog',
    href: '/blog',
    emoji: '📚',
    color: COLORS.teal,
    title: 'Le blog',
    body: 'Nos rituels, nos histoires et nos idées pour transmettre le français à la maison.',
  },
  {
    key: 'guide',
    href: '#guide',
    emoji: '📖',
    color: COLORS.purple,
    title: 'Le guide gratuit',
    body: '« Ta maison est déjà une école » — reçois-le par email ou sur WhatsApp.',
  },
];

export default function ConnectPage() {
  return (
    <main>
      {/* ── HERO ── */}
      <section className="px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: COLORS.tealLight, color: COLORS.tealDark }}
          >
            <DiamondIcon size={14} inner={COLORS.tealLight} /> Tous nos liens
          </span>

          <h1
            className="mt-6 text-4xl font-bold leading-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Restons connectés
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg" style={{ color: 'rgba(26,26,26,0.75)' }}>
            Tu viens d’Instagram, de TikTok ou d’un article&nbsp;? Tout est ici : rejoindre
            l’abonnement WhatsApp, récupérer le guide gratuit, réserver un appel ou simplement
            commencer l’activité du jour.
          </p>

          <div className="mt-9">
            <a
              href={whatsappLink('Bonjour Les Mounas ! Je souhaite rejoindre l’abonnement WhatsApp. 🌍')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full px-8 py-4 text-lg font-bold shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
            >
              💬 Rejoindre sur WhatsApp
            </a>
            <p className="mt-3 text-sm italic" style={{ color: COLORS.purple }}>
              Sans engagement, résilie quand tu veux.
            </p>
          </div>
        </div>
      </section>

      {/* ── LIENS PRINCIPAUX ── */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {ROUTES.map((r) => (
            <Link
              key={r.key}
              href={r.href}
              className="block rounded-3xl p-6 transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(26,26,26,0.08)' }}
            >
              <span className="text-2xl" aria-hidden="true">
                {r.emoji}
              </span>
              <h2
                className="mt-3 flex items-center gap-2 text-xl font-bold"
                style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
              >
                <DiamondIcon size={16} color={r.color} inner="#FFFFFF" />
                {r.title}
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'rgba(26,26,26,0.7)' }}>
                {r.body}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── GUIDE GRATUIT ── */}
      <section id="guide" className="scroll-mt-24 px-4 pb-16 sm:px-6">
        <div
          className="mx-auto max-w-3xl rounded-3xl p-8 text-center sm:p-12"
          style={{ backgroundColor: '#FFFFFF', border: '2px dashed ' + COLORS.amber }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.amber }}>
            Ton guide gratuit
          </p>
          <h2
            className="mt-3 text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Ta maison est déjà une école
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: 'rgba(26,26,26,0.75)' }}>
            Des idées simples pour faire vivre le français à la maison, au quotidien. Choisis
            comment tu veux le recevoir :
          </p>

          <div className="mt-8">
            <EbookSignup />
          </div>
        </div>
      </section>

      {/* ── CONSULTATION (ancre #consultation) ── */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <BookingSection />
        </div>
      </section>

      {/* ── RÉSEAUX ── */}
      {SOCIAL_LINKS.length > 0 && (
        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="text-3xl font-bold sm:text-4xl"
              style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
            >
              Sur les réseaux
            </h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.key}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full px-6 py-3 text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: COLORS.ink, color: COLORS.cream }}
                >
                  {s.label} · {s.handle}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── NEWSLETTER ── */}
      <section id="newsletter" className="scroll-mt-24 px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <DiamondIcon size={18} />
          <h2
            className="mt-3 text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            La newsletter
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base" style={{ color: 'rgba(26,26,26,0.75)' }}>
            Nos meilleures idées d’activités et nos nouveautés, sans spam.
          </p>
          <div className="mt-8">
            <NewsletterSignup />
          </div>

          {/* Short English bridge, same promise as the landing page. */}
          <p className="mx-auto mt-10 max-w-xl text-sm" style={{ color: 'rgba(26,26,26,0.6)' }}>
            Prefer English? Les Mounas sends one playful 10-minute French activity a day on
            WhatsApp — <Link href="/#english" className="font-semibold underline" style={{ color: COLORS.purple }}>read more here</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
