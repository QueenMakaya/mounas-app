import Link from 'next/link';
import { getTodayActivity, getActivityById, getActivitiesByFilters } from '@/lib/airtable';
import type { WordCard } from '@/lib/related';
import ActivityFlow from '@/components/app/ActivityFlow';
import { getMissionForWord } from '@/lib/missions';
import { getSession, paywallUrl } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  // Today's word is free; any other word needs a subscription.
  if (id && !(await getSession())) {
    const today = await getTodayActivity();
    if (today?.id !== id) redirect(paywallUrl(`/app/activity?id=${encodeURIComponent(id)}`));
  }
  const [activity, all] = await Promise.all([
    id ? getActivityById(id) : getTodayActivity(),
    getActivitiesByFilters(),
  ]);
  // The other finished words: for sound reminders and "what next?" ideas.
  const library: WordCard[] = all.map((a) => ({
    id: a.id,
    word: a.frenchWord,
    level: a.difficulty,
    theme: a.theme,
    syllables: a.syllables,
    graphemes: a.graphemes,
  }));

  if (!activity) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-cream px-6 py-20 text-center font-body">
        <p className="text-6xl" aria-hidden="true">🌙</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">Pas d’activité ici aujourd’hui</h1>
        <p className="mt-2 max-w-sm text-ink-soft">Les Mounas se reposent ! Choisis un mot parmi tous ceux déjà prêts.</p>
        <Link
          href="/app/select"
          className="mt-8 flex min-h-14 items-center rounded-full bg-mred px-8 text-lg font-extrabold text-cream shadow-md hover:bg-mred-dark"
        >
          🎲 Choisir un mot
        </Link>
        <Link href="/app" className="mt-4 font-bold text-mpurple underline underline-offset-4">
          Retour à l’accueil
        </Link>
      </main>
    );
  }

  // The optional last step, when the word has a ready mission.
  const mission = await getMissionForWord(activity.id);

  return (
    <main className="flex-1 bg-cream font-body">
      <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 sm:pt-10">
        <ActivityFlow activity={activity} library={library} mission={mission} />
      </div>
    </main>
  );
}
