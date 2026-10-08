import type { Metadata } from 'next';
import ProgressClient from '@/components/app/ProgressClient';
import { wordSounds } from '@/lib/phonics';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nos progrès — Les Mounas',
};

/** How many finished words each level offers, and every sound they use. */
async function loadLibrary(): Promise<{ levelTotals: Record<string, number>; allSounds: string[] }> {
  try {
    const { getActivitiesByFilters } = await import('@/lib/airtable');
    const all = await getActivitiesByFilters();
    const levelTotals: Record<string, number> = {};
    const sounds = new Set<string>();
    for (const a of all) {
      if (a.difficulty) levelTotals[a.difficulty] = (levelTotals[a.difficulty] ?? 0) + 1;
      for (const s of wordSounds(a.frenchWord, a.graphemes)) if (s.key) sounds.add(s.key);
    }
    return { levelTotals, allSounds: [...sounds] };
  } catch {
    return { levelTotals: {}, allSounds: [] };
  }
}

export default async function ProgresPage() {
  const { levelTotals, allSounds } = await loadLibrary();
  return <ProgressClient levelTotals={levelTotals} allSounds={allSounds} />;
}
