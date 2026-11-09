import type { Metadata } from 'next';
import YLesson from '@/components/app/YLesson';

export const metadata: Metadata = {
  title: 'Leçon spéciale : la lettre Y | Les Mounas',
  description: 'Les trois façons de lire le Y (stylo, yeux, joyeux), les pièges et un petit jeu, pour les enfants qui apprennent à lire.',
};

/** Open to everyone (not in proxy.ts's paid list): a lesson Pam can share. */
export default function YLessonPage() {
  return <YLesson />;
}
