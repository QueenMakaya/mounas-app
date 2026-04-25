import Airtable, { FieldSet, Records } from 'airtable';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;
const tableId = process.env.AIRTABLE_TABLE_ID;

if (!apiKey || !baseId || !tableId) {
  throw new Error('Missing Airtable environment variables');
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
