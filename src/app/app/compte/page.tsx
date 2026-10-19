import type { Metadata } from 'next';
import { logout, openBillingPortal } from '@/app/auth-actions';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mon compte | Les Mounas',
  robots: { index: false },
};

export default async function ComptePage({ searchParams }: { searchParams: Promise<{ portail?: string }> }) {
  const session = await requireSession('/app/compte');
  const { portail } = await searchParams;

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <h1 className="font-display text-3xl font-bold text-ink">Mon compte</h1>
        <p className="mt-2 text-ink-soft">
          Connecté·e avec <strong className="text-ink">{session.email}</strong>
        </p>

        {portail && (
          <p role="status" className="mt-5 rounded-2xl bg-white px-5 py-4 font-semibold text-mred">
            L&apos;espace abonnement n&apos;est pas disponible pour le moment. Réessaie dans un instant.
          </p>
        )}

        <div className="mt-8 grid gap-3">
          <form action={openBillingPortal}>
            <button
              type="submit"
              className="flex min-h-14 w-full items-center justify-center rounded-full bg-mpurple px-6 text-lg font-extrabold text-cream shadow-lg"
            >
              Gérer mon abonnement
            </button>
          </form>
          <p className="text-center text-sm text-ink-soft">Changer de carte, voir tes factures ou résilier.</p>
          <form action={logout} className="mt-4">
            <button
              type="submit"
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 font-extrabold text-ink ring-1 ring-ink/10 hover:bg-sand"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
