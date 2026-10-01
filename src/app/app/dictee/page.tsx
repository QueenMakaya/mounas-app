import type { Metadata } from 'next';
import DicteeClient from '@/components/kid/DicteeClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Le cahier de dictée — Les Mounas',
};

async function loadWords(): Promise<string[]> {
  // The notebook must work even if Airtable is down or not configured, so the
  // import itself (which throws on missing env vars) is guarded too.
  try {
    const { getActivitiesByFilters } = await import('@/lib/airtable');
    const all = await getActivitiesByFilters();
    return Array.from(new Set(all.map((a) => a.frenchWord.trim()).filter(Boolean)));
  } catch {
    return [];
  }
}

export default async function DicteePage() {
  const words = await loadWords();
  return <DicteeClient words={words} />;
}
