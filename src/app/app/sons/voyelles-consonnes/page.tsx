import type { Metadata } from 'next';
import VowelsLesson from '@/components/app/VowelsLesson';

export const metadata: Metadata = {
  title: 'Leçon : voyelles et consonnes | Les Mounas',
  description: 'Les voyelles qui chantent, les consonnes qui bloquent l’air, les voyelles qui font équipe et le piège de « an », avec deux petits jeux.',
};

/** Open to everyone (not in proxy.ts's paid list), like the Y lesson. */
export default function VowelsLessonPage() {
  return <VowelsLesson />;
}
