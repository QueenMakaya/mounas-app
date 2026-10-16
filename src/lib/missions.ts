import Airtable, { type FieldSet, type Records } from 'airtable';
import { airtableToken } from '@/lib/airtable-token';

/**
 * "Missions" (calcul + résolution de problèmes), from the Missions table in
 * the same base as the activities. The table id comes from
 * AIRTABLE_MISSIONS_TABLE; everything is read at call-time (never at import)
 * so the app still builds and renders when it isn't set: missions just don't
 * show up.
 *
 * Only Statut = "Prêt" reaches families, like the activities.
 * "Mot lié" links a mission to one or more words (Activités App records).
 */

export type AnswerType = 'nombre' | 'choix' | 'photo';

export type Mission = {
  id: string;
  title: string;
  type: string;
  /** 1 to 7. */
  palier: number;
  /** 1 to 5. */
  niveau: number;
  statement: string;
  parentScript: string;
  hints: string[];
  answer: string;
  answerType: AnswerType;
  choices: string[];
  harder: string;
  materials: string;
  /** Activity record ids this mission belongs to. */
  wordIds: string[];
};

const lines = (value: unknown) =>
  typeof value === 'string'
    ? value
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

function toMission(record: Records<FieldSet>[number]): Mission {
  const kind = text(record.get('Type de réponse'));
  return {
    id: record.id,
    title: text(record.get('Titre')),
    type: text(record.get('Type')),
    palier: Number(record.get('Palier')) || 1,
    niveau: Number(record.get('Niveau')) || 1,
    statement: text(record.get('Énoncé enfant')),
    parentScript: text(record.get('Script parent')),
    hints: lines(record.get('Indices')),
    answer: text(record.get('Réponse')),
    answerType: kind === 'choix' || kind === 'photo' ? kind : 'nombre',
    choices: lines(record.get('Choix')),
    harder: text(record.get('Variante plus difficile')),
    materials: text(record.get('Matériel')),
    wordIds: (record.get('Mot lié') as string[] | undefined) ?? [],
  };
}

let warned = false;

async function readyMissions(): Promise<Mission[]> {
  const apiKey = airtableToken();
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_MISSIONS_TABLE;
  if (!apiKey || !baseId || !table) {
    if (!warned) {
      console.warn('[missions] AIRTABLE_MISSIONS_TABLE (or the Airtable key/base) is not set: missions are hidden.');
      warned = true;
    }
    return [];
  }
  try {
    const records = await new Airtable({ apiKey })
      .base(baseId)(table)
      .select({ filterByFormula: `{Statut} = 'Prêt'` })
      .all();
    return records
      .map(toMission)
      .filter((m) => m.statement)
      .sort((a, b) => a.palier - b.palier || a.niveau - b.niveau || a.title.localeCompare(b.title, 'fr'));
  } catch (error) {
    console.error('[missions] Error fetching missions:', error);
    return [];
  }
}

/** Every ready mission, easiest first. */
export const getMissions = readyMissions;

export async function getMissionById(id: string): Promise<Mission | null> {
  return (await readyMissions()).find((m) => m.id === id) ?? null;
}

/** The (easiest) ready mission linked to this word, if any. */
export async function getMissionForWord(activityId: string): Promise<Mission | null> {
  return (await readyMissions()).find((m) => m.wordIds.includes(activityId)) ?? null;
}
