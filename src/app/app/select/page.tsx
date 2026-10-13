import { getAllThemes, getActivitiesByFilters } from '@/lib/airtable';
import SelectorClient from '@/components/SelectorClient';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function SelectPage() {
  await requireSession('/app/select');
  const [themes, allActivities] = await Promise.all([
    getAllThemes(),
    getActivitiesByFilters(),
  ]);

  return <SelectorClient themes={themes} allActivities={allActivities} />;
}
