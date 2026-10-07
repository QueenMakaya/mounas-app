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
  /** Optional hand-written sound split, e.g. "ch|a|t." (see src/lib/phonics.ts). */
  graphemes: string;
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
  graphemes: (record.get('Graphèmes') as string) || '',
});

// Only finished activities reach parents. Rows still being written
// ("À produire") stay hidden until someone sets them to Prêt or Publié.
// The older base's English status names are listed too, so pointing the app
// back at it doesn't empty every page.
const VISIBLE_STATUSES = ['Prêt', 'Publié', 'Ready', '🟢 Ready ', '✓ Published '];
const IS_VISIBLE = `OR(${VISIBLE_STATUSES.map((st) => `{Status} = '${st}'`).join(', ')})`;

/**
 * The word of the day: one finished activity per calendar day, cycling
 * through every word marked Prêt/Publié so the whole library gets used.
 * Records are ordered by id, which is stable and mixes levels and themes
 * from one day to the next. The day count is taken in UTC so every visitor
 * sees the same word on a given date.
 */
export const getTodayActivity = async (): Promise<Activity | null> => {
  try {
    const records = await base(tableId!)
      .select({ filterByFormula: IS_VISIBLE })
      .all();

    if (records.length === 0) {
      return null;
    }

    const ordered = [...records].sort((a, b) => a.id.localeCompare(b.id));
    const dayNumber = Math.floor(Date.now() / 86_400_000);
    return recordToActivity(ordered[dayNumber % ordered.length]);
  } catch (error) {
    console.error('Error fetching today activity:', error);
    return null;
  }
};

export const getActivityByDay = async (day: string, week: number = 1): Promise<Activity | null> => {
  try {
    const records = await base(tableId!)
      .select({
        filterByFormula: `AND({Day} = '${day}', {Week} = ${week}, ${IS_VISIBLE})`,
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
      .select({ fields: ['Theme'], filterByFormula: IS_VISIBLE })
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
    const filterParts: string[] = [IS_VISIBLE];
    if (theme) filterParts.push(`{Theme} = '${theme}'`);
    if (difficulty) filterParts.push(`{Difficulty} = '${difficulty}'`);

    const records = await base(tableId)
      .select({ filterByFormula: `AND(${filterParts.join(', ')})` })
      .all();

    return records.map(recordToActivity);
  } catch (error) {
    console.error('Error fetching activities by filters:', error);
    return [];
  }
};

// Récupère une activité par son ID Airtable — sans filtre de statut, pour
// pouvoir prévisualiser un brouillon via /app/activity?id=rec…
export const getActivityById = async (id: string): Promise<Activity | null> => {
  try {
    const record = await base(tableId).find(id);
    return recordToActivity(record);
  } catch (error) {
    console.error('Error fetching activity by id:', error);
    return null;
  }
};
