import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { whatsappLink } from '@/lib/config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bienvenue | Les Mounas',
  robots: { index: false },
};

/**
 * Where Stripe sends parents after paying. proxy.ts has already turned the
 * ?session_id=... into a session cookie (or added ?connexion=1 if it couldn't
 * confirm the payment).
 */
export default async function BienvenuePage() {
  const session = await getSession();

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-xl px-4 pb-16 pt-10 text-center sm:px-6 sm:pt-14">
        <p className="text-6xl" aria-hidden="true">🎉</p>
        <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Bienvenue dans Les Mounas !
        </h1>

        {session ? (
          <>
            <p className="mt-3 text-ink-soft">
              Ton essai gratuit a commencé. Ton enfant peut découvrir son premier mot dès maintenant.
            </p>
            <Link
              href="/app"
              className="mt-8 flex min-h-14 items-center justify-center rounded-full bg-mred px-6 text-lg font-extrabold text-cream shadow-lg hover:bg-mred-dark"
            >
              Commencer le mot du jour <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-ink-soft">
              Merci pour ton inscription ! Pour entrer dans l&apos;app, connecte-toi avec l&apos;adresse email utilisée
              pour l&apos;abonnement : on t&apos;envoie un code.
            </p>
            <Link
              href="/connexion?next=/app"
              className="mt-8 flex min-h-14 items-center justify-center rounded-full bg-mpurple px-6 text-lg font-extrabold text-cream shadow-lg"
            >
              Se connecter
            </Link>
          </>
        )}

        <section className="mt-10 rounded-[28px] bg-white p-6 text-left ring-1 ring-ink/5">
          <h2 className="font-display text-xl font-bold text-ink">💬 Le rituel du jour sur WhatsApp</h2>
          <p className="mt-2 text-ink-soft">
            Chaque jour, on t&apos;envoie le mot du jour et une petite activité sur WhatsApp. Pense à enregistrer notre
            numéro <strong className="text-ink">514 552 8184</strong> dans tes contacts pour bien recevoir nos messages.
          </p>
          <a
            href={whatsappLink('Bonjour Les Mounas ! Je viens de m’abonner et je veux recevoir le rituel du jour. 🌍')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-mteal px-6 font-extrabold text-ink"
          >
            Rejoindre le rituel sur WhatsApp
          </a>
        </section>
      </div>
    </main>
  );
}
