import type { Metadata } from 'next';
import Link from 'next/link';
import DiamondIcon from '@/components/brand/DiamondIcon';
import EbookSignup from '@/components/marketing/EbookSignup';
import NewsletterSignup from '@/components/marketing/NewsletterSignup';
import BookingSection from '@/components/marketing/BookingSection';
import { COLORS, whatsappLink } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Les Mounas — Le français en s’amusant, sur WhatsApp',
  description:
    'Un abonnement WhatsApp pour transmettre le français aux enfants de 0 à 6 ans des familles de la diaspora. 10 minutes par jour, avec amour et culture.',
};

export default function LandingPage() {
  return (
    <main>
      {/* ── HERO ── */}
      <section className="px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: COLORS.tealLight, color: COLORS.tealDark }}
          >
            <DiamondIcon size={14} inner={COLORS.tealLight} /> Sur WhatsApp · 0–6 ans
          </span>

          <h1
            className="mt-6 text-4xl font-bold leading-tight sm:text-6xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Le français en s&apos;amusant, pour tes enfants
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg" style={{ color: 'rgba(26,26,26,0.75)' }}>
            Chaque jour, une petite activité à faire en famille pour transmettre le français à tes
            enfants de 0 à 6 ans — avec amour et culture afro. 10 minutes, pas plus.
          </p>

          {/* Tagline that previously carried the butterfly — now the brand diamond */}
          <p
            className="mt-5 inline-flex items-center justify-center gap-2 text-base italic"
            style={{ color: COLORS.purple }}
          >
            <DiamondIcon size={16} /> Sans engagement, résilie quand tu veux.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={whatsappLink('Bonjour Les Mounas ! Je souhaite rejoindre l’abonnement WhatsApp. 🌍')}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-8 py-4 text-lg font-bold shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
            >
              💬 Rejoindre sur WhatsApp
            </a>
            <Link
              href="/app"
              className="rounded-full px-8 py-4 text-lg font-bold shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.amber, color: COLORS.ink }}
            >
              Découvrir l&apos;activité du jour →
            </Link>
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
          {[
            {
              color: COLORS.amber,
              title: '10 min par jour',
              body: 'Une activité courte et joyeuse, pensée pour le rythme des tout-petits.',
            },
            {
              color: COLORS.teal,
              title: 'Sur WhatsApp',
              body: 'Rien à installer. Tout arrive dans la conversation que tu utilises déjà.',
            },
            {
              color: COLORS.purple,
              title: 'Langue + culture',
              body: 'Des mots, des chansons et des histoires qui célèbrent la culture afro.',
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-3xl p-6"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(26,26,26,0.08)' }}
            >
              <DiamondIcon size={22} color={c.color} inner="#FFFFFF" />
              <h3
                className="mt-3 text-xl font-bold"
                style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
              >
                {c.title}
              </h3>
              <p className="mt-2 text-sm" style={{ color: 'rgba(26,26,26,0.7)' }}>
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── E-BOOK ── */}
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
            Reçois notre guide gratuit rempli d&apos;idées simples pour faire vivre le français à la
            maison, au quotidien. Choisis comment tu veux le recevoir :
          </p>

          <div className="mt-8">
            <EbookSignup />
          </div>
        </div>
      </section>

      {/* ── CONSULTATION ── */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <BookingSection />
        </div>
      </section>

      {/* ── ENGLISH ── */}
      <section id="english" className="scroll-mt-24 px-4 pb-16 sm:px-6">
        <div
          className="mx-auto max-w-3xl rounded-3xl p-8 text-center sm:p-12"
          style={{ backgroundColor: COLORS.purple, color: COLORS.cream }}
        >
          <h2
            className="inline-flex flex-wrap items-center justify-center gap-3 text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--font-fraunces)' }}
          >
            Les Mounas in English <DiamondIcon size={28} inner={COLORS.purple} />
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: 'rgba(253,246,236,0.85)' }}>
            Raising bilingual kids in the diaspora? Les Mounas sends you one playful 10-minute French
            activity a day, right on WhatsApp — no app to install, cancel anytime.
          </p>
          <div className="mt-8">
            <a
              href={whatsappLink('Hello Les Mounas! I’d love to learn more about the WhatsApp subscription. 🌍')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full px-8 py-4 text-lg font-bold shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.cream, color: COLORS.purple }}
            >
              💬 Join on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section id="newsletter" className="scroll-mt-24 px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2">
            <DiamondIcon size={18} />
          </span>
          <h2
            className="mt-3 text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Suivez-nous
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base" style={{ color: 'rgba(26,26,26,0.75)' }}>
            Reçois nos meilleures idées d&apos;activités et nos nouveautés, sans spam. Juste ce
            qu&apos;il faut pour t&apos;inspirer.
          </p>
          <div className="mt-8">
            <NewsletterSignup />
          </div>
        </div>
      </section>
    </main>
  );
}
