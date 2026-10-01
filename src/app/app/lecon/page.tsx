import type { Metadata } from 'next';
import Link from 'next/link';
import LessonClient, { type LessonWord } from '@/components/kid/LessonClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'La leçon du jour — Les Mounas',
};

/** Built-in word so the lesson can be tried even without Airtable (?id=demo). */
const DEMO: LessonWord = {
  id: 'demo',
  word: 'maman',
  syllables: ['ma', 'man'],
  pronunciation: 'ma-mɑ̃',
  theme: 'Famille',
  difficulty: '2',
  exampleSentence: 'Maman me lit une histoire avant de dormir.',
  culturalNote: 'Dans beaucoup de langues africaines aussi, « ma » veut dire maman : en lingala, on dit « mama ».',
  activityTitle: 'Le portrait de maman',
  materials: 'Une feuille, des crayons de couleur',
  activitySteps: ['Dessine maman avec ton enfant.', 'Écris « maman » en dessous, ensemble.', 'Offrez-lui le dessin avec un bisou !'],
  songTitle: 'Ma maman',
  songLyrics: 'Ma maman, ma maman,\nTu es mon soleil, ma maman.\nUn bisou, deux bisous,\nJe t’aime fort, voilà tout !',
  badgeName: 'Super cœur',
};

export default async function LessonPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;

  let lesson: LessonWord | null = id === 'demo' ? DEMO : null;
  let others: string[] = ['papa', 'lune', 'ami', 'mamie', 'pomme', 'lion'];

  if (!lesson) {
    try {
      const { getActivityById, getTodayActivity, getActivitiesByFilters } = await import('@/lib/airtable');
      const [a, all] = await Promise.all([id ? getActivityById(id) : getTodayActivity(), getActivitiesByFilters()]);
      if (a) {
        lesson = {
          id: a.id,
          word: a.frenchWord.trim(),
          syllables: a.syllables ? a.syllables.split('-').map((s) => s.trim()).filter(Boolean) : [a.frenchWord.trim()],
          pronunciation: a.pronunciation,
          theme: a.theme,
          difficulty: a.difficulty,
          exampleSentence: a.exampleSentence,
          culturalNote: a.culturalNote,
          activityTitle: a.activityTitle,
          materials: a.materials,
          activitySteps: a.activitySteps
            ? a.activitySteps.split('\n').map((s) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
            : [],
          songTitle: a.songTitle,
          songLyrics: a.songLyrics,
          badgeName: a.badgeName,
        };
      }
      const words = all.map((x) => x.frenchWord.trim()).filter(Boolean);
      if (words.length >= 3) others = words;
    } catch {
      /* Airtable unavailable — handled below */
    }
  }

  if (!lesson) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center" style={{ backgroundColor: '#FDF6EC' }}>
        <p className="text-2xl font-bold">Pas de leçon trouvée pour aujourd’hui.</p>
        <div className="flex gap-3">
          <Link href="/app/select" className="rounded-full px-6 py-3 font-bold" style={{ backgroundColor: '#F4A340' }}>
            🎲 Choisir un mot
          </Link>
          <Link href="/app/lecon?id=demo" className="rounded-full px-6 py-3 font-bold" style={{ backgroundColor: '#2EC4B6' }}>
            Essayer avec « maman »
          </Link>
        </div>
      </main>
    );
  }

  const distractors = Array.from(new Set(others.filter((w) => w.toLowerCase() !== lesson!.word.toLowerCase())));
  return <LessonClient lesson={lesson} distractors={distractors} />;
}
