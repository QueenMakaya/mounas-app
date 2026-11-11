import type { Metadata } from 'next';
import EchecsClient from '@/components/app/echecs/EchecsClient';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Les échecs de Mounaville | Les Mounas',
};

export default async function EchecsPage() {
  await requireSession('/app/echecs');
  return <EchecsClient />;
}
