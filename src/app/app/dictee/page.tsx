import type { Metadata } from 'next';
import DicteeClient, { type DicteeWord } from '@/components/app/DicteeClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Le cahier de dictée — Les Mounas',
};

async function loadWords(): Promise<DicteeWord[]> {
  // The notebook must work even if Airtable is down or not configured (the
  // parent can still use their own list), so the import itself is guarded too.
  try {
    const { getActivitiesByFilters } = await import('@/lib/airtable');
    const all = await getActivitiesByFilters();
    const seen = new Set<string>();
    return all
      .filter((a) => a.frenchWord.trim() && a.difficulty)
      .filter((a) => {
        const key = `${a.difficulty}:${a.frenchWord.trim().toLocaleLowerCase('fr')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((a) => ({ word: a.frenchWord.trim(), level: a.difficulty }));
  } catch {
    return [];
  }
}

export default async function DicteePage() {
  return <DicteeClient words={await loadWords()} />;
}
