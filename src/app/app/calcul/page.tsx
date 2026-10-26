import type { Metadata } from 'next';
import CalculClient from '@/components/app/calcul/CalculClient';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Le calcul | Les Mounas',
};

export default async function CalculPage() {
  await requireSession('/app/calcul');
  return <CalculClient />;
}
