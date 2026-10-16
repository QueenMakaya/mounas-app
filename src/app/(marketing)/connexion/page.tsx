import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/account/LoginForm';
import { getSession } from '@/lib/auth';
import { COLORS } from '@/lib/config';
import { safeNext } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Se connecter | Les Mounas',
  robots: { index: false },
};

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <main className="px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-xl text-center">
        <h1
          className="text-4xl font-bold leading-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
        >
          Se connecter
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg" style={{ color: 'rgba(26,26,26,0.75)' }}>
          Pas de mot de passe à retenir : entre l&apos;email ou le numéro de téléphone de ton abonnement, et on
          t&apos;envoie un code à 6 chiffres par email.
        </p>
        <div className="mt-9">
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
