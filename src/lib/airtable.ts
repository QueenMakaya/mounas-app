import Airtable, { FieldSet, Records } from 'airtable';
import { airtableToken, looksLikeAirtableToken } from '@/lib/airtable-token';

const apiKey = airtableToken();
const baseId = process.env.AIRTABLE_BASE_ID;
const tableId = process.env.AIRTABLE_TABLE_ID;

if (!apiKey || !baseId || !tableId) {
  throw new Error('Missing Airtable environment variables');
}

// A malformed token surfaces as empty pages (every read is caught and returns
// []), so say it out loud once at startup instead.
if (!looksLikeAirtableToken(apiKey)) {
  console.error(
    `[airtable] AIRTABLE_API_KEY does not look like a personal access token ` +
      `(expected it to start with "pat"; got ${apiKey.length} chars starting "${apiKey.slice(0, 4)}"). ` +
      `Airtable will answer 401 and every activity page will render empty.`,
  );
}

const base = new Airtable({ apiKey }).base(baseId);

export type Activity = {
  id: string;
  title: string;
  week: number;
  day: string;
  theme: string;
  difficulty: string;
  frenchWord: string;
  syllables: string;
  syllablesCount: number;
  pronunciation: string;
  exampleSentence: string;
  culturalNote: string;
  activityTitle: string;
  materials: string;
  activitySteps: string;
  songTitle: string;
  songLyrics: string;
  badgeName: string;
  status: string;
};

const recordToActivity = (record: Records<FieldSet>[number]): Activity => ({
  id: record.id,
  title: (record.get('Title') as string) || '',
  week: (record.get('Week') as number) || 0,
  day: (record.get('Day') as string) || '',
  theme: (record.get('Theme') as string) || '',
  difficulty: (record.get('Difficulty') as string) || '',
  frenchWord: (record.get('French word') as string) || '',
  syllables: (record.get('Syllables') as string) || '',
  syllablesCount: (record.get('Syllables count') as number) || 0,
  pronunciation: (record.get('Pronunciation') as string) || '',
  exampleSentence: (record.get('Example sentence') as string) || '',
  culturalNote: (record.get('Cultural note') as string) || '',
  activityTitle: (record.get('Activity title') as string) || '',
  materials: (record.get('Materials') as string) || '',
  activitySteps: (record.get('Activity steps') as string) || '',
  songTitle: (record.get('Song title') as string) || '',
  songLyrics: (record.get('Song lyrics') as string) || '',
  badgeName: (record.get('Badge name') as string) || '',
  status: (record.get('Status') as string) || '',
});

const getDayName = (): string => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[new Date().getDay()];
};

export const getTodayActivity = async (): Promise<Activity | null> => {
  const today = getDayName();

  try {
    const records = await base(tableId!)
      .select({
        filterByFormula: `AND({Day} = '${today}', {Week} = 1)`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return null;
    }

    return recordToActivity(records[0]);
  } catch (error) {
    console.error('Error fetching today activity:', error);
    return null;
  }
};

export const getActivityByDay = async (day: string, week: number = 1): Promise<Activity | null> => {
  try {
    const records = await base(tableId!)
      .select({
        filterByFormula: `AND({Day} = '${day}', {Week} = ${week})`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return null;
    }

    return recordToActivity(records[0]);
  } catch (error) {
    console.error('Error fetching activity by day:', error);
    return null;
  }
};

// Récupère tous les thèmes uniques disponibles dans la base
export const getAllThemes = async (): Promise<string[]> => {
  try {
    const records = await base(tableId)
      .select({ fields: ['Theme'] })
      .all();

    const themesSet = new Set<string>();
    records.forEach((record) => {
      const theme = record.get('Theme') as string;
      if (theme) themesSet.add(theme);
    });

    return Array.from(themesSet).sort();
  } catch (error) {
    console.error('Error fetching themes:', error);
    return [];
  }
};

// Récupère toutes les activités filtrées par thème et difficulté
export const getActivitiesByFilters = async (
  theme?: string,
  difficulty?: string
): Promise<Activity[]> => {
  try {
    const filterParts: string[] = [];
    if (theme) filterParts.push(`{Theme} = '${theme}'`);
    if (difficulty) filterParts.push(`{Difficulty} = '${difficulty}'`);

    const filterByFormula = filterParts.length > 0
      ? `AND(${filterParts.join(', ')})`
      : '';

    const records = await base(tableId)
      .select(filterByFormula ? { filterByFormula } : {})
      .all();

    return records.map(recordToActivity);
  } catch (error) {
    console.error('Error fetching activities by filters:', error);
    return [];
  }
};

// Récupère une activité par son ID Airtable
export const getActivityById = async (id: string): Promise<Activity | null> => {
  try {
    const record = await base(tableId).find(id);
    return recordToActivity(record);
  } catch (error) {
    console.error('Error fetching activity by id:', error);
    return null;
  }
};
