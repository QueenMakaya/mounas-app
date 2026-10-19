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

export type GameKey = 'jeu-image' | 'jeu-peche' | 'jeu-phrase' | 'jeu-nourris';

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

/** The games this word can have, then the one or two of the day. */
export function gamesOfTheDay(a: Activity, library: WordCard[], date: string): GameKey[] {
  const level = parseInt(a.difficulty, 10) || 1;
  const playable: GameKey[] = [];
  if (imageChoices(a, library)) playable.push('jeu-image');
  if (fishingPond(a, library)) playable.push('jeu-peche');
  if (missingWord(a, library)) playable.push('jeu-phrase');
  // Feeding the Mounas is spelling: from level 2, like « Épeler ».
  if (level >= 2 && wordSounds(a.frenchWord, a.graphemes).filter((s) => s.kind !== 'separator').length > 1) playable.push('jeu-nourris');
  const seed = `${date}:${a.id}`;
  const count = 1 + (hash(seed) % 2);
  return seeded(playable, seed).slice(0, count);
}
