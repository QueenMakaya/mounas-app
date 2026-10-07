/**
 * French phonics for the "On lit ensemble" step: split a word into the sounds
 * a child reads (graphemes — "ch", "ou", "eau", "an"…), mark the silent
 * letters, and say each one as a SOUND, never as a letter name ("mmm", not
 * "èm").
 *
 * Words can be spelled out by hand in Airtable ("Graphèmes" column, same
 * notation as the Mounas Lecture base: `ch|a|t.` — graphemes separated by |,
 * a dot after a grapheme = silent). Otherwise the rules below work it out;
 * they cover the regular spellings of the app's word list, and the column is
 * the escape hatch for anything irregular.
 */

export type SoundKind = 'vowel' | 'consonant' | 'silent' | 'separator';

export type Sound = {
  /** The letters as written in the word (original casing). */
  text: string;
  kind: SoundKind;
  /** Key into SOUNDS (empty for silent letters and separators). */
  key: string;
};

/**
 * Each sound: what the speech engine is given so it pronounces the sound
 * (consonants get a light "e" — "me" — the closest a voice gets to "mmm"
 * without spelling the letter), and what the parent is told to say.
 */
export const SOUNDS: Record<string, { say: string; hint: string; vowel: boolean }> = {
  a: { say: 'a', hint: 'aaa', vowel: true },
  e: { say: 'e', hint: 'eu', vowel: true },
  é: { say: 'é', hint: 'ééé', vowel: true },
  è: { say: 'è', hint: 'èèè', vowel: true },
  i: { say: 'i', hint: 'iii', vowel: true },
  o: { say: 'o', hint: 'ooo', vowel: true },
  u: { say: 'u', hint: 'uuu', vowel: true },
  ou: { say: 'ou', hint: 'ou', vowel: true },
  oi: { say: 'oi', hint: 'oi', vowel: true },
  eu: { say: 'eu', hint: 'euh', vowel: true },
  an: { say: 'an', hint: 'an', vowel: true },
  on: { say: 'on', hint: 'on', vowel: true },
  in: { say: 'in', hint: 'in', vowel: true },
  ille: { say: 'ille', hint: 'iy', vowel: true },
  eille: { say: 'eille', hint: 'èy', vowel: true },
  aille: { say: 'aille', hint: 'ay', vowel: true },
  ouille: { say: 'ouille', hint: 'ouy', vowel: true },
  m: { say: 'me', hint: 'mmm', vowel: false },
  n: { say: 'ne', hint: 'nnn', vowel: false },
  l: { say: 'le', hint: 'lll', vowel: false },
  r: { say: 're', hint: 'rrr', vowel: false },
  s: { say: 'se', hint: 'sss', vowel: false },
  z: { say: 'ze', hint: 'zzz', vowel: false },
  f: { say: 'fe', hint: 'fff', vowel: false },
  v: { say: 've', hint: 'vvv', vowel: false },
  j: { say: 'je', hint: 'jjj', vowel: false },
  ch: { say: 'che', hint: 'chhh', vowel: false },
  gn: { say: 'gne', hint: 'gn', vowel: false },
  y: { say: 'ye', hint: 'y', vowel: false },
  w: { say: 'oua', hint: 'w', vowel: false },
  p: { say: 'pe', hint: 'p', vowel: false },
  b: { say: 'be', hint: 'b', vowel: false },
  t: { say: 'te', hint: 't', vowel: false },
  d: { say: 'de', hint: 'd', vowel: false },
  k: { say: 'que', hint: 'k', vowel: false },
  g: { say: 'gue', hint: 'g', vowel: false },
  ks: { say: 'xe', hint: 'ks', vowel: false },
};

const VOWEL_LETTERS = 'aàâäeéèêëiîïoôöuùûüyœ';
const isVowel = (c: string | undefined) => !!c && VOWEL_LETTERS.includes(c);
const isLetter = (c: string | undefined) => !!c && /\p{L}/u.test(c);
const SOFTENERS = 'eéèêiîy';

/** Final consonants we say out loud even though French usually drops them. */
const SOUNDED_FINALS: Record<string, true> = {
  bus: true, ananas: true, nounours: true, ours: true, os: true, maïs: true,
  cactus: true, tennis: true, autobus: true, oasis: true, fils: true, sens: true,
};
const SILENT_FINALS = 'stdxzpg';

type Rule = { match: string; key: string; when?: (next: string | undefined, prev: string | undefined) => boolean };

const nasalOk = (next: string | undefined) => !isVowel(next) && next !== 'n' && next !== 'm';

// Longest first. `when` guards context (next letter after the match, previous letter before it).
const RULES: Rule[] = [
  { match: 'ouill', key: 'ouille' },
  { match: 'eill', key: 'eille' },
  { match: 'aill', key: 'aille' },
  { match: 'eil', key: 'eille', when: (n) => !isLetter(n) },
  { match: 'ail', key: 'aille', when: (n) => !isLetter(n) },
  { match: 'eau', key: 'o' },
  { match: 'ain', key: 'in', when: nasalOk },
  { match: 'ein', key: 'in', when: nasalOk },
  { match: 'aim', key: 'in', when: nasalOk },
  { match: 'ill', key: 'ille', when: (_n, p) => !isVowel(p) },
  { match: 'œu', key: 'eu' },
  { match: 'eu', key: 'eu' },
  { match: 'ou', key: 'ou' },
  { match: 'oi', key: 'oi' },
  { match: 'ai', key: 'è' },
  { match: 'ei', key: 'è' },
  { match: 'au', key: 'o' },
  { match: 'an', key: 'an', when: nasalOk },
  { match: 'am', key: 'an', when: nasalOk },
  { match: 'en', key: 'in', when: (n, p) => p === 'i' && nasalOk(n) }, // chien, bien
  { match: 'en', key: 'an', when: nasalOk },
  { match: 'em', key: 'an', when: nasalOk },
  { match: 'on', key: 'on', when: nasalOk },
  { match: 'om', key: 'on', when: nasalOk },
  { match: 'in', key: 'in', when: nasalOk },
  { match: 'im', key: 'in', when: nasalOk },
  { match: 'un', key: 'in', when: nasalOk },
  { match: 'ch', key: 'ch' },
  { match: 'ph', key: 'f' },
  { match: 'gn', key: 'gn' },
  { match: 'qu', key: 'k' },
  { match: 'gu', key: 'g', when: (n) => !!n && SOFTENERS.includes(n) },
  { match: 'ss', key: 's' },
  { match: 'll', key: 'l' },
  { match: 'mm', key: 'm' },
  { match: 'nn', key: 'n' },
  { match: 'tt', key: 't' },
  { match: 'pp', key: 'p' },
  { match: 'rr', key: 'r' },
  { match: 'ff', key: 'f' },
  { match: 'gg', key: 'g' },
  { match: 'bb', key: 'b' },
  { match: 'dd', key: 'd' },
];

function singleLetter(w: string, i: number): string {
  const c = w[i];
  const next = w[i + 1];
  const prev = w[i - 1];
  switch (c) {
    case 'a': case 'à': case 'â': case 'ä': return 'a';
    case 'é': return 'é';
    case 'è': case 'ê': case 'ë': return 'è';
    case 'i': case 'î': case 'ï': return 'i';
    case 'o': case 'ô': case 'ö': return 'o';
    case 'u': case 'ù': case 'û': case 'ü': return 'u';
    case 'y': return isVowel(next) && (i === 0 || isVowel(prev)) ? 'y' : 'i';
    case 'e': {
      // "mer", "ciel": e + one final consonant → è. e + two consonants → è
      // (except consonant + r/l, and ch/ph/gn, which start the next syllable).
      const n2 = w[i + 2];
      if (isLetter(next) && !isVowel(next) && !isLetter(n2)) return 'è';
      if (isLetter(next) && !isVowel(next) && isLetter(n2) && !isVowel(n2) && !'rlh'.includes(n2) && !['ch', 'ph', 'gn'].includes(next + n2)) return 'è';
      return 'e';
    }
    case 'c': return next && SOFTENERS.includes(next) ? 's' : 'k';
    case 'ç': return 's';
    case 'g': return next && SOFTENERS.includes(next) ? 'j' : 'g';
    case 's': return isVowel(prev) && isVowel(next) ? 'z' : 's';
    case 'x': return 'ks';
    case 'k': case 'q': return 'k';
    case 'w': return 'w';
    case 'h': return '';
    default: return SOUNDS[c] ? c : '';
  }
}

/** Splits one word (no spaces) into sounds using the rules. */
function splitWord(original: string): Sound[] {
  const w = original.toLocaleLowerCase('fr');
  const out: Sound[] = [];
  let i = 0;
  while (i < w.length) {
    const c = w[i];
    if (!isLetter(c)) {
      out.push({ text: original.slice(i, i + 1), kind: 'separator', key: '' });
      i += 1;
      continue;
    }
    const prev = w[i - 1];

    // Word endings that read "é"/"è" and hide their last letter: nez, pied, violet, rocher.
    const rest = w.slice(i);
    const atEnd = (len: number) => !isLetter(w[i + len]);
    if ((rest.startsWith('ez') || rest.startsWith('ed')) && atEnd(2) && i > 0) {
      out.push({ text: original.slice(i, i + 1), kind: 'vowel', key: 'é' });
      out.push({ text: original.slice(i + 1, i + 2), kind: 'silent', key: '' });
      i += 2;
      continue;
    }
    if (rest.startsWith('et') && atEnd(2) && i > 1) {
      out.push({ text: original.slice(i, i + 1), kind: 'vowel', key: 'è' });
      out.push({ text: original.slice(i + 1, i + 2), kind: 'silent', key: '' });
      i += 2;
      continue;
    }
    if (rest.startsWith('er') && atEnd(2) && i > 2) {
      out.push({ text: original.slice(i, i + 1), kind: 'vowel', key: 'é' });
      out.push({ text: original.slice(i + 1, i + 2), kind: 'silent', key: '' });
      i += 2;
      continue;
    }

    const rule = RULES.find(
      (r) => rest.startsWith(r.match) && (!r.when || r.when(w[i + r.match.length], prev)),
    );
    if (rule) {
      out.push({ text: original.slice(i, i + rule.match.length), kind: SOUNDS[rule.key].vowel ? 'vowel' : 'consonant', key: rule.key });
      i += rule.match.length;
      continue;
    }

    const key = singleLetter(w, i);
    out.push({
      text: original.slice(i, i + 1),
      kind: key ? (SOUNDS[key].vowel ? 'vowel' : 'consonant') : 'silent',
      key,
    });
    i += 1;
  }
  return markSilentEndings(out, w);
}

/** Final e, and final s/t/d/x/z/p/g after it, are not read: "tomate", "chat", "souris". */
function markSilentEndings(sounds: Sound[], lower: string): Sound[] {
  // Treat each chunk between separators (grand-mère, arc-en-ciel) as its own word.
  let end = sounds.length - 1;
  while (end >= 0) {
    let start = end;
    while (start > 0 && sounds[start - 1].kind !== 'separator') start -= 1;
    if (sounds[end].kind !== 'separator') {
      const chunk = sounds.slice(start, end + 1).map((s) => s.text).join('').toLocaleLowerCase('fr');
      const vowelCount = sounds.slice(start, end + 1).filter((s) => s.kind === 'vowel').length;
      let k = end;
      if (!SOUNDED_FINALS[chunk] && !SOUNDED_FINALS[lower]) {
        // Silent consonant(s) at the very end, e.g. "ts", "ds".
        while (k > start && sounds[k].text.length === 1 && SILENT_FINALS.includes(sounds[k].text.toLocaleLowerCase('fr')) && sounds[k].kind === 'consonant') {
          sounds[k] = { ...sounds[k], kind: 'silent', key: '' };
          k -= 1;
        }
      }
      // Final "e" (alone, after a consonant) is mute when the word has another vowel.
      if (k >= start && sounds[k].key === 'e' && sounds[k].text.length === 1 && vowelCount > 1) {
        sounds[k] = { ...sounds[k], kind: 'silent', key: '' };
      }
    }
    end = start - 2; // skip the separator
  }
  return sounds;
}

/** Parses the hand-written notation: `ch|a|t.` (dot = silent letter, * prefix ignored). */
function parseManual(word: string, manual: string): Sound[] | null {
  const parts = manual.replace(/\*/g, '').split('|').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const sounds: Sound[] = parts.map((p) => {
    const silent = p.endsWith('.');
    const text = silent ? p.slice(0, -1) : p;
    if (silent) return { text, kind: 'silent', key: '' };
    // Classify the grapheme with the same rules, in isolation.
    const auto = splitWord(text);
    const key = auto.length === 1 ? auto[0].key : text.toLocaleLowerCase('fr');
    const known = SOUNDS[key];
    return { text, kind: known ? (known.vowel ? 'vowel' : 'consonant') : 'consonant', key: known ? key : '' };
  });
  const norm = (s: string) => s.toLocaleLowerCase('fr').replace(/[\s'’-]/g, '');
  // Only trust it when it spells the word.
  return norm(sounds.map((s) => s.text).join('')) === norm(word) ? sounds : null;
}

export function wordSounds(word: string, manual?: string): Sound[] {
  const fromManual = manual ? parseManual(word, manual) : null;
  if (fromManual) {
    // Keep the word's own casing.
    let at = 0;
    return fromManual.map((s) => {
      const text = word.slice(at, at + s.text.length) || s.text;
      at += s.text.length;
      return { ...s, text };
    });
  }
  return splitWord(word);
}
