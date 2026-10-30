import type { Metadata } from 'next';
import Link from 'next/link';
import BackButton from '@/components/app/BackButton';
import MissionPlayer from '@/components/app/MissionPlayer';
import { requireSession } from '@/lib/auth';
import { getMissions } from '@/lib/missions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mission | Les Mounas',
};

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSession(`/app/missions/${encodeURIComponent(id)}`);
  const missions = await getMissions();
  const index = missions.findIndex((m) => m.id === id);
  const mission = index >= 0 ? missions[index] : null;
  // Easiest first, so the next one is a little step up.
  const next = index >= 0 ? missions[index + 1] : undefined;

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <BackButton fallback="/app/missions" />
        {mission ? (
          <>
          <section className="mt-3 overflow-hidden rounded-[28px] bg-white shadow-[0_10px_40px_-12px_rgba(26,26,26,0.18)] ring-1 ring-ink/5">
            <div className="h-2 bg-mamber" />
            <div className="p-5 sm:p-8">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#C7600A]">
                Palier {mission.palier} · Niveau {mission.niveau}
                {mission.type && ` · ${mission.type}`}
              </p>
              <h1 className="mb-6 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
                {mission.title || 'La mission'}
              </h1>
              <MissionPlayer key={mission.id} mission={mission} compact />
            </div>
          </section>
          <nav aria-label="Après la mission" className="mt-6 flex flex-col gap-3 sm:flex-row">
            {next && (
              <Link
                href={`/app/missions/${encodeURIComponent(next.id)}`}
                className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 text-lg font-extrabold text-cream shadow-md active:scale-[0.98]"
              >
                Mission suivante →
              </Link>
            )}
            <Link
              href="/app/missions"
              className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-white px-6 text-lg font-extrabold text-ink ring-1 ring-ink/15 active:scale-[0.98]"
            >
              🧩 Toutes les missions
            </Link>
          </nav>
          </>
        ) : (
          <section className="mt-3 rounded-[28px] bg-white p-8 text-center ring-1 ring-ink/5">
            <p className="text-5xl" aria-hidden="true">🌙</p>
            <h1 className="mt-3 font-display text-2xl font-bold text-ink">Cette mission n’est pas disponible</h1>
            <Link href="/app/missions" className="mt-6 inline-block font-bold text-mpurple underline underline-offset-4">
              Voir toutes les missions
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
