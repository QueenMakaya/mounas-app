import type { Metadata } from 'next';
import Link from 'next/link';
import PriceTag from '@/components/site/PriceTag';
import { startDemo } from '@/app/auth-actions';
import { getSession } from '@/lib/auth';
import { COLORS, GUARANTEE, STRIPE_PAYMENT_LINK, TRIAL_DAYS, whatsappLink } from '@/lib/config';
import { DEMO_AGES, DEMO_MINUTES, demoEnabled, isDemo } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Découvrir l’app en démo | Les Mounas',
  description:
    'Essaie toute l’app Les Mounas avec ton enfant, sans inscription : le mot du jour, les jeux de sons, la dictée, le calcul, les missions et les progrès.',
};

/**
 * /demo: what the app does, then one button that opens the whole subscriber
 * area for DEMO_MINUTES, no account needed (src/lib/demo.ts). Send this link
 * to new parents, or open it on a tablet during a presentation.
 */

const TOUR = [
  {
    emoji: '✨',
    title: 'Le mot mystère du jour',
    text: 'Chaque jour un nouveau mot : on le découvre lettre par lettre, on tape les syllabes dans les mains, on l’écoute et on le lit.',
  },
  {
    emoji: '🎮',
    title: 'Des jeux autour du mot',
    text: 'Pêche aux sons, trouve l’image, nourris les Mounas… L’enfant joue seul en mode enfant, le parent garde la main.',
  },
  {
    emoji: '📒',
    title: 'Le cahier de dictée',
    text: 'Écrire avec le doigt sur du papier Seyès, en cursive comme à l’école.',
  },
  {
    emoji: '🔢',
    title: 'Le calcul',
    text: 'Additions, soustractions, multiplications : des séries courtes, à son niveau et à son rythme.',
  },
  {
    emoji: '🧩',
    title: 'Les missions',
    text: 'Des petits problèmes à résoudre ensemble : compter, chercher, trier.',
  },
  {
    emoji: '♟️',
    title: 'Les échecs de Mounaville',
    text: 'Le Roi, la Reine, la Gazelle, l’Éléphant, le Rhinocéros et les petits Mounas : les échecs appris en jouant, chapitre par chapitre.',
  },
  {
    emoji: '📊',
    title: 'Les progrès',
    text: 'Les mots appris, les sons connus, les jours d’affilée : le parent voit tout d’un coup d’œil.',
  },
];

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ fin?: string; indisponible?: string }>;
}) {
  const { fin, indisponible } = await searchParams;
  const session = await getSession();
  const inDemo = isDemo(session);
  const member = Boolean(session) && !inDemo;
  const enabled = demoEnabled();

  return (
    <main className="px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: COLORS.tealLight, color: COLORS.tealDark }}
          >
            👀 Démo · sans inscription
          </span>
          <h1
            className="mt-6 text-4xl font-bold leading-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Essaie l&apos;app avec ton enfant
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg" style={{ color: 'rgba(26,26,26,0.75)' }}>
            Toute l&apos;app Les Mounas, ouverte pendant {DEMO_MINUTES} minutes : pas de compte, pas de carte bancaire.
            Assieds-toi avec ton enfant et faites le mot du jour ensemble, 10 minutes suffisent.
          </p>

          {fin && (
            <p role="status" className="mx-auto mt-6 max-w-md rounded-2xl bg-white px-5 py-4 font-semibold" style={{ color: COLORS.purple }}>
              Merci d&apos;avoir essayé Les Mounas ! 💜 Prêt·e à continuer ? L&apos;essai gratuit dure {TRIAL_DAYS} jours.
            </p>
          )}
          {(indisponible || !enabled) && (
            <p role="status" className="mx-auto mt-6 max-w-md rounded-2xl bg-white px-5 py-4 font-semibold" style={{ color: COLORS.red }}>
              La démo n&apos;est pas disponible pour le moment. Écris-nous sur WhatsApp, on te la montre avec plaisir.
            </p>
          )}

          <div className="mt-9 flex flex-col items-center justify-center gap-4">
            {member ? (
              <Link
                href="/app"
                className="rounded-full px-8 py-4 text-lg font-bold shadow-md transition-opacity hover:opacity-90"
                style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
              >
                Tu es abonné·e : ouvrir l&apos;app →
              </Link>
            ) : inDemo ? (
              <Link
                href="/app"
                className="rounded-full px-8 py-4 text-lg font-bold shadow-md transition-opacity hover:opacity-90"
                style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
              >
                Reprendre la démo →
              </Link>
            ) : enabled ? (
              <div className="w-full max-w-md">
                <p className="text-lg font-bold" style={{ color: COLORS.ink }}>
                  Quel âge a ton enfant ?
                </p>
                <form action={startDemo} className="mt-4 grid grid-cols-3 gap-3">
                  {DEMO_AGES.map((age) => (
                    <button
                      key={age.value}
                      type="submit"
                      name="age"
                      value={age.value}
                      className="flex flex-col items-center gap-1 rounded-3xl px-2 py-4 text-lg font-extrabold shadow-md transition-transform hover:opacity-90 active:scale-95"
                      style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
                    >
                      <span className="text-3xl" aria-hidden="true">
                        {age.emoji}
                      </span>
                      {age.label}
                    </button>
                  ))}
                </form>
                <p className="mt-3 text-sm" style={{ color: 'rgba(26,26,26,0.7)' }}>
                  Un mot à son niveau s&apos;ouvre tout de suite. À vous de jouer !
                </p>
                <form action={startDemo} className="mt-2">
                  <button type="submit" className="text-sm font-bold underline underline-offset-4" style={{ color: COLORS.purple }}>
                    Ou explorer toute l&apos;app →
                  </button>
                </form>
              </div>
            ) : (
              <a
                href={whatsappLink('Bonjour Les Mounas ! J’aimerais voir une démo de l’app. 🌍')}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-8 py-4 text-lg font-bold shadow-md"
                style={{ backgroundColor: COLORS.teal, color: COLORS.ink }}
              >
                💬 Demander une démo sur WhatsApp
              </a>
            )}
            {!member && (
              <a
                href={STRIPE_PAYMENT_LINK}
                className="rounded-full px-8 py-4 text-lg font-bold transition-opacity hover:opacity-80"
                style={{ color: COLORS.purple, border: `2px solid ${COLORS.purple}` }}
              >
                Commencer l&apos;essai gratuit
              </a>
            )}
          </div>
          <p className="mt-4 text-sm" style={{ color: 'rgba(26,26,26,0.7)' }}>
            Pendant la démo, rien n&apos;est enregistré sur un compte. {TRIAL_DAYS} jours gratuits ensuite, puis <PriceTag />, sans
            engagement. 🛡️ {GUARANTEE}.
          </p>
        </div>

        <section className="mt-14">
          <h2
            className="text-center text-2xl font-bold sm:text-3xl"
            style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
          >
            Ce que tu vas découvrir
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {TOUR.map((step, i) => (
              <li key={step.title} className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm">
                <span
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
                  style={{ backgroundColor: COLORS.tealLight }}
                  aria-hidden="true"
                >
                  {step.emoji}
                </span>
                <div>
                  <h3 className="font-bold" style={{ color: COLORS.ink }}>
                    <span className="mr-1 opacity-50">{i + 1}.</span> {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: 'rgba(26,26,26,0.75)' }}>
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12 rounded-[28px] bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}>
            💡 Conseils pour la démo
          </h2>
          <ul className="mx-auto mt-4 max-w-lg space-y-2 text-left" style={{ color: 'rgba(26,26,26,0.8)' }}>
            <li>🔊 Monte le son : l&apos;app lit les mots et les sons à voix haute.</li>
            <li>👶 Essaie le <strong>mode enfant</strong> sur le mot du jour : ton enfant joue seul, l&apos;écran reste verrouillé.</li>
            <li>📱 Sur téléphone ou tablette, c&apos;est encore mieux : on écrit la dictée avec le doigt.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
