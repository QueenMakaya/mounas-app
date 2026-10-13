import type { Metadata } from 'next';
import Link from 'next/link';
import DiamondIcon from '@/components/brand/DiamondIcon';
import { COLORS, STRIPE_PAYMENT_LINK, whatsappLink } from '@/lib/config';
import { safeNext } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Abonnement | Les Mounas',
  description: "Toute l'app Les Mounas et le rituel WhatsApp quotidien. 10 $ par mois, 7 jours gratuits.",
};

const INCLUDED = [
  { emoji: '🎲', text: 'Tous les mots de la bibliothèque, par niveau et par thème' },
  { emoji: '📒', text: 'Le cahier de dictée, pour écrire avec le doigt' },
  { emoji: '🧩', text: 'Les missions : compter et résoudre des petits problèmes' },
  { emoji: '🌱', text: 'Le suivi des progrès de ton enfant' },
  { emoji: '💬', text: 'Le rituel quotidien sur WhatsApp' },
];

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; fin?: string }>;
}) {
  const { next, fin } = await searchParams;
  const loginHref = `/connexion?next=${encodeURIComponent(safeNext(next))}`;

  return (
    <main className="px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-2xl text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest"
          style={{ backgroundColor: COLORS.tealLight, color: COLORS.tealDark }}
        >
          <DiamondIcon size={14} inner={COLORS.tealLight} /> 7 jours gratuits
        </span>

        {fin && (
          <p className="mx-auto mt-6 max-w-md rounded-2xl bg-white px-5 py-4 text-base" style={{ color: COLORS.ink }}>
            Ton abonnement n&apos;est plus actif. Tu peux le reprendre quand tu veux, on t&apos;attend !
          </p>
        )}

        <h1
          className="mt-6 text-4xl font-bold leading-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
        >
          Continue l&apos;aventure avec Les Mounas
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg" style={{ color: 'rgba(26,26,26,0.75)' }}>
          Le mot du jour reste gratuit. Avec l&apos;abonnement, ton enfant a accès à tout le reste :
        </p>

        <ul className="mx-auto mt-8 grid max-w-xl gap-3 text-left">
          {INCLUDED.map((item) => (
            <li key={item.text} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
              <span className="text-2xl" aria-hidden="true">
                {item.emoji}
              </span>
              <span className="font-semibold" style={{ color: COLORS.ink }}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-3xl font-bold" style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.purple }}>
          10 $/mois
        </p>
        <p className="mt-1 text-base" style={{ color: 'rgba(26,26,26,0.75)' }}>
          7 jours gratuits pour essayer. Sans engagement, résilie quand tu veux.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <a
            href={STRIPE_PAYMENT_LINK}
            className="rounded-full px-8 py-4 text-lg font-bold shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
          >
            Commencer l&apos;essai gratuit
          </a>
          <Link href={loginHref} className="font-bold underline underline-offset-4" style={{ color: COLORS.purple }}>
            Déjà abonné·e ? Se connecter
          </Link>
          <a
            href={whatsappLink('Bonjour Les Mounas ! J’ai une question sur l’abonnement. 🌍')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold underline underline-offset-4"
            style={{ color: 'rgba(26,26,26,0.7)' }}
          >
            Une question ? WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
