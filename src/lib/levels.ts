/**
 * The four difficulty levels stored in Airtable ("1".."4") and how the app
 * names them. Levels describe what the child can do, not how old they are —
 * the same growth image as the Mounas test portrait (graine → pousse → arbre).
 */
export const LEVELS = [
  { value: '1', short: 'Niveau 1', label: 'Graine · premiers mots', emoji: '🌱' },
  { value: '2', short: 'Niveau 2', label: 'Pousse · petits mots', emoji: '🌿' },
  { value: '3', short: 'Niveau 3', label: 'Arbre · mots plus longs', emoji: '🌳' },
  { value: '4', short: 'Niveau 4', label: 'Baobab · lire et écrire', emoji: '🌍' },
] as const;

export function levelLabel(difficulty: string): string {
  const level = LEVELS.find((l) => l.value === difficulty);
  return level ? `${level.emoji} ${level.short}` : `Niveau ${difficulty}`;
}
