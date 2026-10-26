import type { Activity } from '@/lib/airtable';
import { wordSounds, type Sound } from '@/lib/phonics';
import { trickySounds, wordsWithSound, type WordCard } from '@/lib/related';
import { wordPicture } from '@/lib/word-pictures';

/*
 * The mini-games that change from day to day, so the flow doesn't feel the
 * same every time. Each game says what it needs (a picture, words with the
 * same sound, a sentence…); the day picks one or two of the playable ones
 * with a seed made of the date and the word, so a whole day stays the same
 * and the next day is different.
 */

export type GameKey = 'jeu-image' | 'jeu-peche' | 'jeu-phrase' | 'jeu-mot' | 'jeu-nourris';

const lower = (s: string) => s.toLocaleLowerCase('fr');
// FNV-1a with a final mix: a one-letter change in the seed (the next day)
// reshuffles everything, which a plain "h * 31 + c" would not.
function hash(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return h >>> 0;
}

/** A stable shuffle for this seed (same order on every render). */
export function seeded<T>(items: T[], seed: string): T[] {
  return items
    .map((item, i) => ({ item, k: hash(`${seed}:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item);
}

/** « Trouve l'image »: the word's picture and two others, all different. */
export function imageChoices(a: Activity, library: WordCard[]) {
  const mine = wordPicture(a.frenchWord);
  if (!mine) return null;
  const others: { id: string; word: string; picture: string }[] = [];
  for (const w of seeded(library, a.id)) {
    const p = wordPicture(w.word);
    if (w.id !== a.id && p && p !== mine && !others.some((o) => o.picture === p)) others.push({ id: w.id, word: w.word, picture: p });
  }
  if (others.length < 2) return null;
  return seeded([{ id: a.id, word: a.frenchWord, picture: mine }, ...others.slice(0, 2)], `${a.id}-image`);
}

/** « La pêche aux sons »: the sound to fish for, the words that have it, and some that don't. */
export function fishingPond(a: Activity, library: WordCard[]) {
  const heard = wordSounds(a.frenchWord, a.graphemes).filter((s) => s.kind !== 'silent' && s.kind !== 'separator' && s.key);
  // The tricky sounds first (ou, ch, an…), then the vowels, then the rest:
  // the first one other words of the app share.
  const candidates: Sound[] = [...trickySounds(a.frenchWord, a.graphemes), ...heard.filter((s) => s.kind === 'vowel'), ...heard];
  for (const sound of candidates) {
    const withSound = wordsWithSound(sound, library, a.id, 3).map(({ card, text }) => ({ card, text, has: true }));
    const without = seeded(library, a.id)
      .filter((w) => w.id !== a.id && !wordSounds(w.word, w.graphemes).some((s) => s.key === sound.key))
      .slice(0, Math.max(2, 5 - withSound.length))
      .map((card) => ({ card, text: '', has: false }));
    if (withSound.length >= 1 && without.length >= 2) return { sound, fish: seeded([...withSound, ...without], `${a.id}-peche`) };
  }
  return null;
}

/** « Le mot qui manque »: the example sentence cut where the word is, and two other words. */
export function missingWord(a: Activity, library: WordCard[]) {
  const sentence = a.exampleSentence.trim();
  const word = lower(a.frenchWord.trim());
  if (!sentence || !word) return null;
  const at = lower(sentence).search(new RegExp(`(^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'u'));
  if (at < 0) return null;
  const start = at + (lower(sentence)[at] === word[0] ? 0 : 1);
  const others = seeded(library.filter((w) => w.id !== a.id && lower(w.word) !== word), a.id).slice(0, 2);
  if (others.length < 2) return null;
  return {
    before: sentence.slice(0, start),
    answer: sentence.slice(start, start + word.length),
    after: sentence.slice(start + word.length),
    choices: seeded([{ id: a.id, word: a.frenchWord }, ...others.map((w) => ({ id: w.id, word: w.word }))], `${a.id}-phrase`),
  };
}

/*
 * « Trouve le mot »: the app says the word, the child touches it among words
 * that look like it. It trains what CP teaching calls rapid word
 * identification: looking at every letter, in order, instead of guessing from
 * the shape or the first letter (the « comparer des suites de lettres » kind
 * of exercise, and the orthographic mapping research of L. Ehri). The traps
 * are the classic confusions of young readers:
 *   - mirror letters and look-alikes (b/d, p/q, m/n, n/u, f/t, a/o, i/l);
 *   - two letters swapped (lapin → lpain, alpin);
 *   - one letter more or less (lapins, lapn);
 *   - a real word that looks close (sapin).
 * The level sets how many and how close: 3 words at level 1 (the word is
 * also shown as a model), up to 6 from level 4, heard only. Pam can write her
 * own traps in Airtable (« Mots pièges »); the app tops them up if needed.
 */

const LOOK_ALIKE: Record<string, string> = { b: 'd', d: 'b', p: 'q', q: 'p', m: 'n', n: 'u', u: 'n', f: 't', t: 'f', a: 'o', o: 'a', i: 'l', l: 'i' };

/** How many words to choose from, by level. */
export const findWordSize = (level: number) => (level <= 1 ? 3 : level === 2 ? 4 : level === 3 ? 5 : 6);

/** Look-alike, swapped and one-letter-off versions of the word (never the word itself). */
function closeTraps(word: string): { mirror: string[]; swap: string[]; edit: string[] } {
  const ch = Array.from(word);
  const isLetter = (c: string) => /\p{L}/u.test(c);
  const mirror: string[] = [];
  const swap: string[] = [];
  const edit: string[] = [];
  ch.forEach((c, i) => {
    const m = LOOK_ALIKE[c];
    if (m) mirror.push([...ch.slice(0, i), m, ...ch.slice(i + 1)].join(''));
    const d = ch[i + 1];
    if (d && d !== c && isLetter(c) && isLetter(d)) swap.push([...ch.slice(0, i), d, c, ...ch.slice(i + 2)].join(''));
    if (i > 0 && ch.length > 3 && isLetter(c)) edit.push([...ch.slice(0, i), ...ch.slice(i + 1)].join(''));
  });
  if (!/[sx]$/.test(word)) edit.unshift(`${word}s`);
  const not = (x: string) => x !== word;
  return { mirror: mirror.filter(not), swap: swap.filter(not), edit: edit.filter(not) };
}

/** Real words of the app that look like this one: close length, at least half the letters in the same place. */
function lookingWords(word: string, library: WordCard[], id: string): string[] {
  const mine = Array.from(word);
  return library
    .filter((w) => w.id !== id)
    .map((w) => lower(w.word.trim()))
    .filter((w) => w !== word && Math.abs(w.length - word.length) <= 1)
    .map((w) => {
      const ch = Array.from(w);
      return { w, common: ch.filter((c, i) => mine[i] === c).length / Math.max(ch.length, mine.length) };
    })
    .filter((x) => x.common >= 0.5)
    .sort((a, b) => b.common - a.common)
    .map((x) => x.w);
}

export function findWord(a: Activity, library: WordCard[]) {
  const word = lower(a.frenchWord.trim());
  if (Array.from(word).length < 2) return null;
  const level = parseInt(a.difficulty, 10) || 1;
  const size = findWordSize(level);
  const seed = `${a.id}-mot`;
  const own = a.traps
    .split(/[,;\n]/)
    .map((t) => lower(t.trim()))
    .filter((t) => t && t !== word);
  const close = closeTraps(word);
  const real = lookingWords(word, library, a.id);
  // Level 1: one close trap and one word that looks different, so the
  // youngest win often; then more and more close traps.
  const far = seeded(
    library.map((w) => lower(w.word.trim())).filter((w) => w !== word && w[0] !== word[0]),
    seed,
  ).slice(0, 1);
  const kinds = [seeded(close.mirror, seed), real, seeded(close.swap, seed), seeded(close.edit, seed)];
  const picked: string[] = [...own];
  for (let round = 0; picked.length < size - 1 && round < 6; round++) {
    for (const list of kinds) {
      const next = list.find((t) => !picked.includes(t));
      if (next && picked.length < size - (level <= 1 ? 2 : 1)) picked.push(next);
    }
    if (level <= 1) break;
  }
  for (const f of [...far, ...real]) if (picked.length < size - 1 && !picked.includes(f)) picked.push(f);
  const traps = [...new Set(picked)].slice(0, size - 1);
  if (traps.length < 2) return null;
  return { word, level, choices: seeded([word, ...traps], seed) };
}

/** The games this word can have, then the one or two of the day. */
export function gamesOfTheDay(a: Activity, library: WordCard[], date: string): GameKey[] {
  const level = parseInt(a.difficulty, 10) || 1;
  const playable: GameKey[] = [];
  if (imageChoices(a, library)) playable.push('jeu-image');
  if (fishingPond(a, library)) playable.push('jeu-peche');
  // « Le mot qui manque » (missingWord) is out of the rotation since 26 Oct.:
  // Pam prefers « Trouve le mot ». Its code stays, to bring it back if wanted.
  if (findWord(a, library)) playable.push('jeu-mot');
  // Feeding the Mounas is spelling: from level 2, like « Épeler ».
  if (level >= 2 && wordSounds(a.frenchWord, a.graphemes).filter((s) => s.kind !== 'separator').length > 1) playable.push('jeu-nourris');
  const seed = `${date}:${a.id}`;
  const count = 1 + (hash(seed) % 2);
  return seeded(playable, seed).slice(0, count);
}
