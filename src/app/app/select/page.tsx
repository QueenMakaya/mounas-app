import { getAllThemes, getActivitiesByFilters } from '@/lib/airtable';
import SelectorClient from '@/components/SelectorClient';

export const dynamic = 'force-dynamic';

export default async function SelectPage() {
  const [themes, allActivities] = await Promise.all([
    getAllThemes(),
    getActivitiesByFilters(),
  ]);

  return <SelectorClient themes={themes} allActivities={allActivities} />;
}
