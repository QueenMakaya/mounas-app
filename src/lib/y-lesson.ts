/**
 * « Le y, la lettre caméléon »: the y is hard for early readers because it
 * doesn't always say the same thing. Three cases cover almost every word:
 *
 * 1. y alone or next to a consonant → « i »: pyjama, stylo, il y a.
 * 2. y at the start, before a vowel → « ye »: yeux, yaourt, yoyo.
 * 3. y between two vowels → two i: joyeux = joi + yeux, crayon = crai + yon.
 *    The first i joins the vowel before it (o + i = oi, a + i = è, u + i = ui),
 *    the second says « ye » with the vowel after it.
 *
 * Exceptions (pays, kayak) go in the Airtable « Graphèmes » column.
 */

export type YCase = 'i' | 'ye' | 'deux-i';

const VOWELS = 'aàâäeéèêëiîïoôöuùûüœ';
const isVowel = (c: string | undefined) => !!c && VOWELS.includes(c);
const isLetter = (c: string | undefined) => !!c && /\p{L}/u.test(c);

export type YInWord = {
  /** Position of the y in the word. */
  at: number;
  kind: YCase;
  /** Two-i case only: the word cut in two, the y made into i | y (joi + yeux). */
  left?: string;
  right?: string;
  /** Two-i case only: the sound the first i makes with the vowel before it. */
  joined?: string;
};

const JOINED: Record<string, string> = { o: 'oi', a: 'ai (è)', e: 'ei (è)', u: 'ui' };

/** How each y of `word` is read (same rules as phonics.ts). */
export function yInWord(word: string): YInWord[] {
  const w = word.toLocaleLowerCase('fr');
  const out: YInWord[] = [];
  for (let i = 0; i < w.length; i += 1) {
    if (w[i] !== 'y') continue;
    const prev = w[i - 1];
    const next = w[i + 1];
    // papaye: before a final mute e, the y just says « ye ».
    const finalE = next === 'e' && !isLetter(w[i + 2]);
    if (isVowel(prev) && isVowel(next) && !finalE) {
      out.push({ at: i, kind: 'deux-i', left: `${w.slice(0, i)}i`, right: w.slice(i), joined: JOINED[prev] ?? `${prev}i` });
    } else if (isVowel(next) && (i === 0 || !isLetter(prev) || isVowel(prev))) {
      out.push({ at: i, kind: 'ye' });
    } else {
      out.push({ at: i, kind: 'i' });
    }
  }
  return out;
}

export const hasY = (word: string) => word.toLocaleLowerCase('fr').includes('y');

/** The three rules of the lesson, with examples to tap and hear. */
export const Y_RULES: { kind: YCase; title: string; say: string; text: string; examples: string[] }[] = [
  {
    kind: 'i',
    title: 'y = i',
    say: 'i',
    text: 'Tout seul ou à côté d’une consonne, le y se lit « i », comme un i.',
    examples: ['pyjama', 'stylo', 'cygne', 'il y a'],
  },
  {
    kind: 'ye',
    title: 'y = « ye »',
    say: 'ye',
    text: 'Au début du mot, devant une voyelle, le y fait « ye ».',
    examples: ['yeux', 'yaourt', 'yoyo'],
  },
  {
    kind: 'deux-i',
    title: 'y = i + i',
    say: 'i, i',
    text: 'Entre deux voyelles, le y vaut deux i : un i pour la voyelle d’avant, un i qui fait « ye » avec la suite.',
    examples: ['joyeux', 'crayon', 'noyau', 'tuyau', 'voyage'],
  },
];

/** Words that don't follow the rules: shown so parents aren't surprised. */
export const Y_EXCEPTIONS: { word: string; reads: string }[] = [
  { word: 'pays', reads: 'pé-i' },
  { word: 'kayak', reads: 'ka-yak' },
];

/** The little quiz at the end of the lesson. */
export const Y_QUIZ = ['yeux', 'pyjama', 'joyeux', 'crayon', 'yaourt', 'stylo'];

/**
 * What to say for syllable `i` of a word: before a syllable that starts with
 * a y between two vowels, the syllable takes the first i (« jo » of jo-yeux
 * is said « joi »), so clapping the syllables doesn't mispronounce the word.
 */
export function syllableSay(parts: string[], i: number): string {
  const part = parts[i];
  const next = parts[i + 1]?.toLocaleLowerCase('fr');
  if (!next || !isVowel(part.toLocaleLowerCase('fr').slice(-1))) return part;
  const isLastYe = i + 1 === parts.length - 1 && next === 'ye';
  return next[0] === 'y' && isVowel(next[1]) && !isLastYe ? `${part}i` : part;
}
