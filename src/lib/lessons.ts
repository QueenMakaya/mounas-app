import { SOUNDS, wordSounds, type Sound } from '@/lib/phonics';

/**
 * The little lessons a parent can open from anywhere in the app (a link
 * under the sounds, the ⓘ of a game…), and the explanations that point to
 * them: why a word that LOOKS like it has the sound doesn't (manioc has the
 * letters a and n, but no « an »).
 */

export type Lesson = { slug: string; href: string; title: string; short: string; badge: string; color: string };

export const LESSONS: Record<'voyelles-consonnes' | 'y', Lesson> = {
  'voyelles-consonnes': {
    slug: 'voyelles-consonnes',
    href: '/app/sons/voyelles-consonnes',
    title: 'Voyelles et consonnes',
    short: 'Les sons qui chantent, ceux qui bloquent l’air, et le piège de « an »',
    badge: 'a·b',
    color: '#E63946',
  },
  y: {
    slug: 'y',
    href: '/app/sons/y',
    title: 'Leçon spéciale : le Y',
    short: 'Stylo, yeux, joyeux : 3 façons de le lire',
    badge: 'Y',
    color: '#5B1F8C',
  },
};

const VOWEL_LETTERS = 'aàâäeéèêëiîïoôöuùûüyœ';
const isVowel = (c: string | undefined) => !!c && VOWEL_LETTERS.includes(c);
const lower = (s: string) => s.toLocaleLowerCase('fr');

/** The spellings of each nasal sound (« an » = an, am, en, em…). */
const NASAL_SPELLINGS: Record<string, string[]> = {
  an: ['an', 'am', 'en', 'em'],
  on: ['on', 'om'],
  in: ['ain', 'ein', 'aim', 'in', 'im', 'un', 'en'],
};

export type WhyNot = {
  /** Short line: « Dans manioc, le n part avec le i. » */
  lead: string;
  /** The rule, for the parent. */
  rule?: string;
  /** How the word is read, by syllables or sounds: « ma-ni-oc ». */
  readAs: string;
  lesson?: Lesson;
};

/** « ma - ni - oc » (Airtable) → « ma-ni-oc »; else the sounds: m·a·n·i·o·c. */
function readingOf(word: string, syllables: string, sounds: Sound[]): string {
  const s = syllables.trim();
  if (s && lower(s.replace(/[\s-]/g, '')) === lower(word.replace(/[\s'’-]/g, ''))) return lower(s).replace(/\s*-\s*/g, '-');
  return sounds.filter((x) => x.kind !== 'silent' && x.kind !== 'separator').map((x) => lower(x.text)).join('·');
}

/**
 * Why `word` doesn't have the sound `sound` (a key of SOUNDS, written
 * `soundText` in today's word), when the child picked it in a game.
 */
export function whyNot(word: string, syllables: string, graphemes: string, sound: { key: string; text: string }): WhyNot {
  const w = lower(word);
  const sounds = wordSounds(word, graphemes);
  const readAs = readingOf(word, syllables, sounds);
  const hint = SOUNDS[sound.key]?.hint ?? sound.text;

  // 1. A nasal sound whose letters are there, but the n/m is followed by a vowel (ma-ni-oc) or doubled (pomme).
  for (const sp of NASAL_SPELLINGS[sound.key] ?? []) {
    for (let i = w.indexOf(sp); i >= 0; i = w.indexOf(sp, i + 1)) {
      const next = w[i + sp.length];
      const nm = sp[sp.length - 1];
      if (isVowel(next)) {
        return {
          lead: `Dans « ${w} », il y a bien « ${sp} », mais le ${nm} est suivi de « ${next} », une voyelle : il part avec elle.`,
          rule: `Pour entendre « ${hint} », le ${nm} doit être suivi d’une consonne, ou être à la fin du mot.`,
          readAs,
          lesson: LESSONS['voyelles-consonnes'],
        };
      }
      if (next === 'n' || next === 'm') {
        return {
          lead: `Dans « ${w} », le ${nm} est doublé (« ${nm}${next} ») : la voyelle reste seule et le ${next} part avec la suite.`,
          rule: `Pour entendre « ${hint} », le ${nm} doit être suivi d’une consonne, ou être à la fin du mot.`,
          readAs,
          lesson: LESSONS['voyelles-consonnes'],
        };
      }
    }
  }

  // 2. The letters are in the word but make another sound there (« a » inside « an », « c » that says « k »).
  const letters = lower(sound.text);
  for (const s of sounds) {
    const t = lower(s.text);
    if (s.key === sound.key || !t.includes(letters)) continue;
    if (s.kind === 'silent' || !s.key) {
      return { lead: `Dans « ${w} », « ${t} » est une lettre muette : on ne l’entend pas.`, readAs };
    }
    const other = SOUNDS[s.key].hint;
    return {
      lead:
        t === letters
          ? `Dans « ${w} », « ${t} » se lit « ${other} », pas « ${hint} ».`
          : `Dans « ${w} », « ${letters} » fait équipe avec d’autres lettres : « ${t} » se lit « ${other} ».`,
      readAs,
      lesson: s.kind === 'vowel' && SOUNDS[s.key] && t.length > 1 ? LESSONS['voyelles-consonnes'] : undefined,
    };
  }

  // 3. Nothing that looks like it: just say what we hear.
  return { lead: `Dans « ${w} », on n’entend pas « ${hint} ».`, readAs };
}
