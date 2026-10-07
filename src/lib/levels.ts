/**
 * The four difficulty levels stored in Airtable ("1".."4"), with the
 * parent-facing labels the app shows. Parents think in ages, not numbers, so
 * every surface leads with the age range.
 */
export const LEVELS = [
  { value: '1', short: '1–3 ans', label: 'Tout-petit', emoji: '🐣' },
  { value: '2', short: '3–4 ans', label: 'Petit', emoji: '🐥' },
  { value: '3', short: '4–5 ans', label: 'Grand', emoji: '🦁' },
  { value: '4', short: '5 ans +', label: 'Pré-scolaire', emoji: '🚀' },
] as const;

export function levelLabel(difficulty: string): string {
  const level = LEVELS.find((l) => l.value === difficulty);
  return level ? `${level.emoji} ${level.short}` : `Niveau ${difficulty}`;
}
