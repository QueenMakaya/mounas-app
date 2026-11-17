import { LEVELS } from '@/lib/levels';
import { DEMO_AGES, demoLevelForAge } from '@/lib/demo';
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
 *   - the rhythm    → `mounas_words_per_day` (child mode, src/lib/child-mode.ts);
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

export const MAX_GOALS = 3;

/** Each goal points at the part of the app that serves it. */
export const GOAL_CHOICES: (Choice & { section: string })[] = [
  { value: 'aimer', emoji: '💛', label: 'Aimer le français', section: 'Le mot mystère du jour' },
  { value: 'lire', emoji: '📖', label: 'Apprendre à lire', section: 'Les syllabes et les sons' },
  { value: 'ecrire', emoji: '✏️', label: 'Apprendre à écrire', section: 'Le cahier de dictée' },
  { value: 'compter', emoji: '🔢', label: 'Compter et calculer', section: 'Le calcul et les missions' },
  { value: 'culture', emoji: '🌍', label: 'Grandir avec la culture afro', section: 'Mounaville, son village qui grandit' },
  { value: 'confiance', emoji: '🦁', label: 'Prendre confiance', section: 'Les progrès, mot après mot' },
];

export const INVOLVEMENT_CHOICES: (Choice & { title: string; text: string })[] = [
  {
    value: 'ensemble',
    emoji: '🤝',
    label: 'On joue ensemble',
    title: 'Dix minutes rien que pour vous deux',
    text: 'Chaque mot se découvre à deux : on retourne les cartes, on tape les syllabes dans les mains, on chante. L’app te guide étape par étape.',
  },
  {
    value: 'seul',
    emoji: '🚀',
    label: 'Mon enfant aime jouer seul',
    title: 'Le mode enfant est fait pour ça',
    text: 'Ton enfant avance seul, guidé par la voix. L’écran reste verrouillé sur son mot, et c’est toi qui choisis combien de mots par jour.',
  },
  {
    value: 'suivi',
    emoji: '👀',
    label: 'Je regarde ses progrès',
    title: 'Tu vois tout d’un coup d’œil',
    text: 'Les mots appris, les sons connus, les jours d’affilée : la page Progrès te montre le chemin parcouru, sans note ni pression.',
  },
];

/** `words` feeds child mode's « mots par jour » (1 to 5). */
export const RHYTHM_CHOICES: (Choice & { words: number })[] = [
  { value: '1', emoji: '☀️', label: 'Un mot par jour', hint: '10 minutes', words: 1 },
  { value: '3', emoji: '🌤️', label: 'Deux ou trois mots par jour', words: 3 },
  { value: '5', emoji: '🔥', label: 'Autant que l’envie est là', words: 5 },
  { value: 'libre', emoji: '🤷', label: 'Je ne sais pas encore', words: 3 },
];

export type ChildProfile = {
  /** First name, or '' when the parent skipped it. */
  name: string;
  age: string;
  level: string;
  goals: string[];
  themes: string[];
  involvement: string;
  rhythm: string;
};

export const EMPTY_PROFILE: ChildProfile = { name: '', age: '', level: '', goals: [], themes: [], involvement: '', rhythm: '' };

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
// Same keys as the word picker and child mode, so the answers are used there.
const LS_LAST_DIFFICULTY = 'mounas_last_difficulty';
const LS_WORDS_PER_DAY = 'mounas_words_per_day';

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export function readProfile(): ChildProfile | null {
  try {
    const p = JSON.parse(readPref(LS_PROFILE) ?? 'null');
    if (!p || typeof p !== 'object') return null;
    return {
      name: typeof p.name === 'string' ? p.name : '',
      age: typeof p.age === 'string' ? p.age : '',
      level: typeof p.level === 'string' ? p.level : '',
      goals: strings(p.goals),
      themes: strings(p.themes),
      involvement: typeof p.involvement === 'string' ? p.involvement : '',
      rhythm: typeof p.rhythm === 'string' ? p.rhythm : '',
    };
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

export function saveProfile(profile: ChildProfile): void {
  writePref(LS_PROFILE, JSON.stringify(profile));
  if (profile.level) writePref(LS_LAST_DIFFICULTY, profile.level);
  const rhythm = RHYTHM_CHOICES.find((r) => r.value === profile.rhythm);
  // « Je ne sais pas encore » leaves a number the parent may already have set.
  if (rhythm && rhythm.value !== 'libre') writePref(LS_WORDS_PER_DAY, String(rhythm.words));
  try {
    window.dispatchEvent(new Event('mounas-child-mode'));
  } catch {
    // no window: nothing to notify
  }
}
