import { LEVELS } from '@/lib/levels';
import { DEMO_AGES, demoLevelForAge } from '@/lib/demo';
import { readCalcul, saveCalcul, setLevel } from '@/lib/calcul';
import { readPref, writePref } from '@/lib/progress';

/**
 * The « Commencer » questionnaire (/commencer): a few friendly questions to a
 * parent, one per screen, that end on the child's first word at the right
 * level. Nothing is sent anywhere: the answers stay on the device, in
 * `mounas_child_profile`, next to the progress keys of src/lib/progress.ts.
 *
 * What the answers really change in the app:
 *   - the level     → `mounas_last_difficulty` (the word picker opens on it)
 *                     and the first word offered at the end;
 *   - the themes    → the first word is picked among them when possible;
 *   - the numbers   → where the calculation ladder starts (`mounas_calcul`);
 *   - chess         → the chapter marked « Commence ici » in the chess hub;
 *   - the first name → the greeting on the app's home page.
 */

export type Choice = { value: string; emoji: string; label: string; hint?: string };

export const AGE_CHOICES: Choice[] = DEMO_AGES.map((a) => ({ value: a.value, emoji: a.emoji, label: a.label }));

/** « Où en est ton enfant ? » Worded without il/elle. */
export const STAGE_CHOICES: Choice[] = [
  { value: '1', emoji: '🌱', label: 'Découvre ses premiers mots' },
  { value: '2', emoji: '🌿', label: 'Reconnaît des lettres et des sons' },
  { value: '3', emoji: '🌳', label: 'Lit des syllabes et des petits mots' },
  { value: '4', emoji: '🌍', label: 'Lit déjà et commence à écrire' },
  { value: '', emoji: '🤔', label: 'Je ne sais pas trop' },
];

/** « Et avec les chiffres ? » Each answer is a starting rung of the calculation ladder (src/lib/calcul.ts). */
export const MATH_CHOICES: (Choice & { calcul: string; start: string })[] = [
  { value: 'compte', emoji: '🖐️', label: 'Apprend à compter', calcul: 'add-1', start: 'Ajouter 1, avec les jetons' },
  { value: 'additions', emoji: '➕', label: 'Fait de petites additions', calcul: 'add-10', start: 'Les additions jusqu’à 10' },
  { value: 'soustractions', emoji: '➖', label: 'Additionne et soustrait', calcul: 'sub-10', start: 'Les soustractions jusqu’à 10' },
  { value: 'tables', emoji: '✖️', label: 'Apprend ses tables', calcul: 'mul-2', start: 'La table de 2' },
  { value: 'libre', emoji: '🤔', label: 'Je ne sais pas trop', calcul: 'add-1', start: 'Ajouter 1, puis le niveau s’ajuste tout seul' },
];

/** « Et les échecs ? » Each answer is a chapter of Les échecs de Mounaville, or none. */
export const CHESS_CHOICES: (Choice & { chapter: string; start: string })[] = [
  { value: 'jamais', emoji: '👑', label: 'N’a jamais joué', chapter: 'famille', start: 'Chapitre 1 · La famille royale' },
  { value: 'pieces', emoji: '🥭', label: 'Connaît quelques pièces', chapter: 'mangues', start: 'Chapitre 2 · La cueillette des mangues' },
  { value: 'joue', emoji: '♟️', label: 'Sait déjà jouer', chapter: 'partie', start: 'Chapitre 5 · La grande partie' },
  { value: 'non', emoji: '⏳', label: 'Pas pour l’instant', chapter: '', start: '' },
];

/** Calculation and chess are asked from 3 years old. */
export const asksNumbers = (age: string) => age !== '0-2';

export type ChildProfile = {
  /** First name, or '' when the parent skipped it. */
  name: string;
  age: string;
  level: string;
  themes: string[];
  /** A MATH_CHOICES value, or '' when not asked. */
  math: string;
  /** A CHESS_CHOICES value, or '' when not asked. */
  chess: string;
};

export const EMPTY_PROFILE: ChildProfile = { name: '', age: '', level: '', themes: [], math: '', chess: '' };

/** The level to start at: the parent's answer, else the one that goes with the age. */
export function startingLevel(stage: string, age: string): string {
  if (LEVELS.some((l) => l.value === stage)) return stage;
  return demoLevelForAge(age) ?? '1';
}

/** « de Kofi », « d’Awa ». */
export function de(name: string): string {
  return /^[aeiouyhàâäéèêëîïôöùûü]/i.test(name) ? `d’${name}` : `de ${name}`;
}

const LS_PROFILE = 'mounas_child_profile';
// Same key as the word picker, so the level is used there.
const LS_LAST_DIFFICULTY = 'mounas_last_difficulty';

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const text = (v: unknown): string => (typeof v === 'string' ? v : '');

export function readProfile(): ChildProfile | null {
  try {
    const p = JSON.parse(readPref(LS_PROFILE) ?? 'null');
    if (!p || typeof p !== 'object') return null;
    return { name: text(p.name), age: text(p.age), level: text(p.level), themes: strings(p.themes), math: text(p.math), chess: text(p.chess) };
  } catch {
    return null;
  }
}

/** The child's first name, or '' (also '' on the server). */
export function profileName(): string {
  return readProfile()?.name ?? '';
}

/** Whether the questionnaire has been finished on this device. */
export function hasProfile(): boolean {
  return readProfile() !== null;
}

/** The chess chapter to begin with (« famille », « mangues », « partie »), or ''. */
export function chessStart(): string {
  const answer = readProfile()?.chess;
  return CHESS_CHOICES.find((c) => c.value === answer)?.chapter ?? '';
}

export function saveProfile(profile: ChildProfile): void {
  writePref(LS_PROFILE, JSON.stringify(profile));
  if (profile.level) writePref(LS_LAST_DIFFICULTY, profile.level);
  // The calculation ladder starts where the parent said, unless the child has
  // already calculated here: progress is never reset by the questionnaire.
  const math = MATH_CHOICES.find((m) => m.value === profile.math);
  if (math) {
    const calcul = readCalcul();
    if (Object.keys(calcul.stats).length === 0) saveCalcul(setLevel(calcul, math.calcul));
  }
}
