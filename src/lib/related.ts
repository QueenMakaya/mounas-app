import { wordSounds, type Sound } from '@/lib/phonics';

/** The few fields of another word the activity needs to suggest or cite it. */
export type WordCard = {
  id: string;
  word: string;
  level: string;
  theme: string;
  syllables: string;
  graphemes: string;
};

const lower = (s: string) => s.toLocaleLowerCase('fr');

/**
 * Sounds worth a reminder: those written with several letters (ou, ch, eil,
 * an…) or whose letter doesn't say its usual sound (c → k, s → z, ê → è).
 * Simple one-letter sounds (m, a, t) need no reminder.
 */
export function trickySounds(word: string, graphemes = ''): Sound[] {
  const seen = new Set<string>();
  return wordSounds(word, graphemes).filter((s) => {
    if (s.kind === 'silent' || s.kind === 'separator' || !s.key) return false;
    const text = lower(s.text);
    const tricky = text.length > 1 || text !== s.key;
    const id = `${text}:${s.key}`;
    if (!tricky || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** How `card` writes this sound (e.g. "eill" in oreille for the "eil" of soleil), if it has it. */
function spellingOf(card: WordCard, sound: Sound): string | null {
  const hit = wordSounds(card.word, card.graphemes).find((s) => s.key === sound.key);
  return hit ? lower(hit.text) : null;
}

const byLevel = (a: WordCard, b: WordCard) => a.level.localeCompare(b.level) || a.word.localeCompare(b.word, 'fr');

/**
 * Other words of the library with this sound: the same spelling first, then
 * other spellings of the same sound; easiest levels first. `text` is how each
 * word writes it, so it can be highlighted.
 */
export function wordsWithSound(sound: Sound, library: WordCard[], excludeId: string, limit = 3): { card: WordCard; text: string }[] {
  const mine = lower(sound.text);
  return library
    .filter((w) => w.id !== excludeId)
    .map((card) => ({ card, text: spellingOf(card, sound) }))
    .filter((x): x is { card: WordCard; text: string } => x.text !== null)
    .sort((a, b) => Number(b.text === mine) - Number(a.text === mine) || byLevel(a.card, b.card))
    .slice(0, limit);
}

/** "What next?" after an activity: words sharing a tricky sound, and words of the same theme. */
export function nextWords(current: WordCard, library: WordCard[]) {
  const tricky = trickySounds(current.word, current.graphemes);
  const sameSound: { word: WordCard; sound: Sound }[] = [];
  for (const sound of tricky) {
    for (const { card } of wordsWithSound(sound, library, current.id, 6)) {
      if (!sameSound.some((x) => x.word.id === card.id)) sameSound.push({ word: card, sound });
    }
  }
  const sameTheme = current.theme
    ? library.filter((w) => w.id !== current.id && w.theme === current.theme && !sameSound.some((x) => x.word.id === w.id)).sort(byLevel)
    : [];
  return { sameSound: sameSound.slice(0, 3), sameTheme: sameTheme.slice(0, 3) };
}
