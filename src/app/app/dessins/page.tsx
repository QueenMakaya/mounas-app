import type { Metadata } from 'next';
import DessinsStudio from '@/components/kid/DessinsStudio';

export const metadata: Metadata = {
  title: 'Mes dessins vivants — Les Mounas',
  description: 'Prends ton dessin en photo et regarde-le prendre vie.',
};

export default function DessinsPage() {
  return <DessinsStudio />;
}
