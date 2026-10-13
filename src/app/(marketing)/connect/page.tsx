import type { Metadata } from 'next';
import Link from 'next/link';
import DiamondIcon from '@/components/brand/DiamondIcon';
import EbookSignup from '@/components/marketing/EbookSignup';
import NewsletterSignup from '@/components/marketing/NewsletterSignup';
import BookingSection from '@/components/marketing/BookingSection';
import { COLORS, SOCIAL_LINKS, TRIAL_URL, TRIAL_DAYS, MONTHLY_PRICE, whatsappLink } from '@/lib/config';

export const metadata: Metadata = {
  title: `${TRIAL_DAYS} jours offerts : le français en jouant, 10 minutes par jour | Les Mounas`,
  description:
    'Chaque matin sur WhatsApp, une activité de 10 minutes pour que ton enfant (0-6 ans) parle, lise et chante en français, avec nos racines africaines. 7 jours offerts, sans engagement.',
};

/**
 * /connect — the sales page every external CTA points at (bio Instagram/TikTok,
 * end of YouTube videos, articles, flyers, QR codes…).
 *
 * One main action: start the free trial (Stripe payment link, 7 days free).
 * Everything else (guide, blog, call, newsletter, socials) comes after.
 */

const OFFER = [
  {
    emoji: '☀️',
    color: COLORS.amber,
    title: 'Chaque matin sur WhatsApp',
    body: 'Le mot du jour, sa chanson et une mission de 10 minutes, prête à faire. Tu ouvres ton téléphone, tu joues.',
  },
  {
    emoji: '📱',
    color: COLORS.teal,
    title: 'L’app Les Mounas',
    body: 'Lire syllabe par syllabe, le mot mystère, la dictée, le mode « J’écoute » et le suivi des progrès de ton enfant.',
  },
  {
    emoji: '🎬',
    color: COLORS.purple,
    title: 'Vidéos, fables et bricolages',
    body: 'Des épisodes interactifs (« C’est quelle heure ? », le Soleil et les planètes…) et des contes qui finissent par une activité.',
  },
];

const FOR_PARENT = [
  'Zéro préparation : tout arrive prêt, il suffit de 10 minutes.',
  'Un vrai moment à deux, chaque jour, sans écran allumé toute la journée.',
  'Tu transmets le français et nos racines sans être prof.',
  'Tu vois ses progrès dans l’app, mot après mot.',
];

const FOR_CHILD = [
  'Apprend à lire en tapant les syllabes dans ses mains.',
  'Chante, bouge et bricole : jamais d’ennui.',
  'Se reconnaît dans Amara, Kofi et les contes d’Afrique.',
  'Gagne en fierté à chaque nouveau mot qu’il ou elle sait dire.',
];

const STEPS = [
  { n: '1', title: 'Active tes 7 jours', body: 'Un clic, ton nom et ton numéro. Rien n’est prélevé pendant l’essai.' },
  { n: '2', title: 'Reçois ton premier mot', body: 'Dès le lendemain matin, sur WhatsApp, avec la mission du jour.' },
  { n: '3', title: 'Joue 10 minutes', body: 'Ton enfant répète, chante et joue. Tu continues seulement si vous aimez.' },
];

const FAQ = [
  {
    q: 'Est-ce que je paie pendant l’essai ?',
    a: `Non. Les ${TRIAL_DAYS} premiers jours sont offerts. L’abonnement (${MONTHLY_PRICE} CAD par mois) commence seulement après.`,
  },
  { q: 'Pour quel âge ?', a: 'Pour les enfants de 0 à 6 ans. Les activités s’adaptent : les plus petits écoutent et chantent, les plus grands lisent.' },
  {
    q: 'Mon enfant parle peu français, c’est grave ?',
    a: 'Pas du tout. Les Mounas est pensé pour les familles où le français est une langue de la maison, du cœur ou à (re)découvrir.',
  },
  { q: 'Comment j’arrête ?', a: 'Sans engagement : un simple message sur WhatsApp et on arrête l’abonnement.' },
];

const SOCIAL_COLORS: Record<string, string> = {
  instagram: COLORS.pink,
  tiktok: COLORS.ink,
  youtube: COLORS.red,
  facebook: '#1877F2',
  skool: COLORS.teal,
  linkedin: '#0A66C2',
};

function TrialButton({ label = `🌱 Commencer mes ${TRIAL_DAYS} jours gratuits` }: { label?: string }) {
  return (
    <div className="text-center">
      <a
        href={TRIAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-full px-8 py-4 text-lg font-bold shadow-lg transition-transform hover:-translate-y-0.5 sm:px-10 sm:text-xl"
        style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
      >
        {label}
      </a>
      <p className="mt-3 text-sm" style={{ color: COLORS.purple }}>
        Puis {MONTHLY_PRICE} CAD par mois. Sans engagement, tu arrêtes quand tu veux.
      </p>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <main>
      {/* ── HERO : one promise, one action ── */}
      <section className="px-4 pb-12 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: COLORS.amber, color: COLORS.ink }}
          >
            <DiamondIcon size={14} inner={COLORS.amber} /> {TRIAL_DAYS} jours offerts
          </span>

          <h1
            className="mt-6 text-4xl font-bold leading-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Ton enfant parle, lit et chante en français, 10&nbsp;minutes par jour
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg" style={{ color: 'rgba(26,26,26,0.75)' }}>
            Chaque matin, une activité joyeuse et prête à faire, avec la chaleur de nos racines
            africaines. Pour les 0 à 6 ans. Essaie gratuitement pendant {TRIAL_DAYS} jours.
          </p>

          <div className="mt-9">
            <TrialButton />
          </div>

          <p className="mt-5 text-sm" style={{ color: 'rgba(26,26,26,0.6)' }}>
            Une question avant de commencer ?{' '}
            <a
              href={whatsappLink('Bonjour Les Mounas ! J’ai une question sur l’essai gratuit. 🌍')}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
              style={{ color: COLORS.tealDark }}
            >
              Écris-nous sur WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* ── CE QUE TU REÇOIS ── */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Pendant tes {TRIAL_DAYS} jours offerts
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {OFFER.map((o) => (
              <div
                key={o.title}
                className="rounded-3xl p-6"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(26,26,26,0.08)' }}
              >
                <span className="text-3xl" aria-hidden="true">
                  {o.emoji}
                </span>
                <h3
                  className="mt-3 flex items-center gap-2 text-xl font-bold"
                  style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
                >
                  <DiamondIcon size={16} color={o.color} inner="#FFFFFF" />
                  {o.title}
                </h3>
                <p className="mt-2 text-sm" style={{ color: 'rgba(26,26,26,0.75)' }}>
                  {o.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POUR TOI / POUR TON ENFANT ── */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          {[
            { title: 'Pour toi, parent', items: FOR_PARENT, color: COLORS.teal, bg: COLORS.tealLight },
            { title: 'Pour ton enfant', items: FOR_CHILD, color: COLORS.amber, bg: '#FDEBD3' },
          ].map((col) => (
            <div key={col.title} className="rounded-3xl p-7" style={{ backgroundColor: col.bg }}>
              <h3
                className="text-2xl font-bold"
                style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
              >
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.items.map((it) => (
                  <li key={it} className="flex gap-3 text-base" style={{ color: COLORS.ink }}>
                    <span className="mt-1 shrink-0">
                      <DiamondIcon size={14} color={col.color} inner={col.bg} />
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE + CTA ── */}
      <section className="px-4 pb-16 sm:px-6">
        <div
          className="mx-auto max-w-4xl rounded-3xl p-8 sm:p-12"
          style={{ backgroundColor: '#FFFFFF', border: '2px dashed ' + COLORS.amber }}
        >
          <h2
            className="text-center text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Comment ça marche
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold"
                  style={{ backgroundColor: COLORS.purple, color: COLORS.cream }}
                >
                  {s.n}
                </div>
                <h3 className="mt-3 text-lg font-bold" style={{ color: COLORS.ink }}>
                  {s.title}
                </h3>
                <p className="mt-1 text-sm" style={{ color: 'rgba(26,26,26,0.7)' }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <TrialButton label="🌱 J’essaie gratuitement" />
          </div>
        </div>
      </section>

      {/* ── RÉSEAUX ── */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Suis Les Mounas
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base" style={{ color: 'rgba(26,26,26,0.7)' }}>
            Vidéos, fables, chansons et idées d’activités, tous les jours.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.key}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-6 py-3 text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: SOCIAL_COLORS[s.key] || COLORS.ink, color: '#FFFFFF' }}
              >
                {s.label} · {s.handle}
              </a>
            ))}
            <a
              href={whatsappLink('Bonjour Les Mounas ! 🌍')}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-6 py-3 text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
            >
              WhatsApp · +1 514 552-8184
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-center text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Questions fréquentes
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="rounded-2xl p-5"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(26,26,26,0.08)' }}
              >
                <summary className="cursor-pointer text-base font-bold" style={{ color: COLORS.ink }}>
                  {f.q}
                </summary>
                <p className="mt-2 text-sm" style={{ color: 'rgba(26,26,26,0.75)' }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
          <div className="mt-10">
            <TrialButton />
          </div>
        </div>
      </section>

      {/* ── RESSOURCES GRATUITES (secondaires) ── */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2
            className="text-center text-2xl font-bold sm:text-3xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Envie de découvrir d’abord ? Commence par ces ressources gratuites
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { href: '/app', emoji: '✨', title: 'L’activité du jour', body: 'Teste une activité tout de suite.' },
              { href: '#guide', emoji: '📖', title: 'Le guide gratuit', body: '« Ta maison est déjà une école ».' },
              { href: '/blog', emoji: '📚', title: 'Le blog', body: 'Nos rituels et idées pour la maison.' },
            ].map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="block rounded-3xl p-5 transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(26,26,26,0.08)' }}
              >
                <span className="text-2xl" aria-hidden="true">
                  {r.emoji}
                </span>
                <h3 className="mt-2 text-lg font-bold" style={{ color: COLORS.ink }}>
                  {r.title}
                </h3>
                <p className="mt-1 text-sm" style={{ color: 'rgba(26,26,26,0.7)' }}>
                  {r.body}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUIDE GRATUIT ── */}
      <section id="guide" className="scroll-mt-24 px-4 pb-16 sm:px-6">
        <div
          className="mx-auto max-w-3xl rounded-3xl p-8 text-center sm:p-12"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(26,26,26,0.08)' }}
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

          <p className="mx-auto mt-10 max-w-xl text-sm" style={{ color: 'rgba(26,26,26,0.6)' }}>
            Prefer English? Les Mounas sends one playful 10-minute French activity a day on
            WhatsApp, with a {TRIAL_DAYS}-day free trial.{' '}
            <a href={TRIAL_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: COLORS.purple }}>
              Start your free trial
            </a>{' '}
            or <Link href="/#english" className="font-semibold underline" style={{ color: COLORS.purple }}>read more here</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
