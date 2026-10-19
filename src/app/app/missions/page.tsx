import type { Metadata } from 'next';
import BackButton from '@/components/app/BackButton';
import MissionList from '@/components/app/MissionList';
import { requireSession } from '@/lib/auth';
import { getMissions } from '@/lib/missions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Les missions | Les Mounas',
};

export default async function MissionsPage() {
  await requireSession('/app/missions');
  const missions = await getMissions();

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <BackButton />
        <header className="mb-6 mt-3">
          <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">🧩 Les missions</h1>
          <p className="mt-2 text-ink-soft">
            Des petits problèmes à résoudre ensemble : compter, chercher, trier. Choisis un palier, avance à ton rythme.
          </p>
        </header>
        {missions.length > 0 ? (
          <MissionList missions={missions} />
        ) : (
          <section className="rounded-[28px] bg-white p-8 text-center ring-1 ring-ink/5">
            <p className="text-5xl" aria-hidden="true">🌱</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-ink">Les missions arrivent bientôt</h2>
            <p className="mt-2 text-ink-soft">On les prépare avec soin. Reviens très vite !</p>
          </section>
        )}
      </div>
    </main>
  );
}
