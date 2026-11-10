/**
 * Verbs among the words of the day (danser, chanter, partager…). When the
 * word is a verb, the app adds a small reminder: a verb is something we DO,
 * a noun is a thing, an animal or a person (danser ↔ la danse), and when I do
 * it myself the word changes a little: « je danse ». Just that one form: an
 * introduction to conjugation, not a lesson.
 *
 * Airtable decides first (« Nature » column: Verbe / Nom / Adjectif). Empty:
 * the lists below. « sourire » and « rire » are left out on purpose: they are
 * also nouns (« ton sourire »), so only the column can say which one is meant.
 */

export type VerbInfo = {
  /** The verb as it is written in the dictionary: danser. */
  infinitive: string;
  /** « je danse » / « j’écoute » — undefined when we don't know the form. */
  je?: string;
  /** A noun of the same family, with its article: « la danse ». */
  noun?: string;
};

/** Verbs of the word list (and likely future ones), with a noun of the same family. */
const NOUN_OF: Record<string, string> = {
  danser: 'la danse',
  chanter: 'la chanson',
  partager: 'le partage',
  persévérer: 'la persévérance',
  jouer: 'le jeu',
  manger: 'le repas',
  dessiner: 'le dessin',
  nager: 'la nage',
  sauter: 'le saut',
  marcher: 'la marche',
  cuisiner: 'la cuisine',
  jardiner: 'le jardin',
  travailler: 'le travail',
  aimer: 'l’amour',
  écouter: 'l’écoute',
  parler: 'la parole',
  rêver: 'le rêve',
  respirer: 'la respiration',
  aider: 'l’aide',
  lire: 'la lecture',
  écrire: 'l’écriture',
  dormir: 'le sommeil',
  courir: 'la course',
  grandir: 'la croissance',
  finir: 'la fin',
  boire: 'la boisson',
  peindre: 'la peinture',
  construire: 'la construction',
  apprendre: 'l’apprentissage',
};

/** Verbs that don't follow the « -er → -e » pattern: their « je » form. */
const IRREGULAR_JE: Record<string, string> = {
  être: 'je suis',
  avoir: 'j’ai',
  aller: 'je vais',
  faire: 'je fais',
  dire: 'je dis',
  lire: 'je lis',
  rire: 'je ris',
  sourire: 'je souris',
  écrire: 'j’écris',
  dormir: 'je dors',
  courir: 'je cours',
  partir: 'je pars',
  sortir: 'je sors',
  venir: 'je viens',
  tenir: 'je tiens',
  voir: 'je vois',
  boire: 'je bois',
  croire: 'je crois',
  vouloir: 'je veux',
  pouvoir: 'je peux',
  savoir: 'je sais',
  prendre: 'je prends',
  apprendre: 'j’apprends',
  comprendre: 'je comprends',
  mettre: 'je mets',
  peindre: 'je peins',
  construire: 'je construis',
  grandir: 'je grandis',
  finir: 'je finis',
  choisir: 'je choisis',
  rougir: 'je rougis',
  bâtir: 'je bâtis',
  ouvrir: 'j’ouvre',
  offrir: 'j’offre',
  cueillir: 'je cueille',
};

/** Words that end in -er but are not verbs, so the fallback never takes them for one. */
const NOT_VERBS = new Set(['mer', 'fer', 'fier', 'hier', 'hiver', 'cher', 'ver', 'super']);

const lower = (s: string) => s.trim().toLocaleLowerCase('fr');

/** « je » + form, with the apostrophe before a vowel or a mute h: j’écoute, j’habite. */
const withJe = (form: string) => (/^[aeiouyàâéèêëîïôûh]/.test(form) ? `j’${form}` : `je ${form}`);

/**
 * « je » form of a verb. Regular -er verbs: drop -r (danser → danse);
 * an « é » just before the last consonant becomes « è » (persévérer → persévère,
 * préférer → préfère). Others only from the table.
 */
export function conjugateJe(infinitive: string): string | undefined {
  const v = lower(infinitive);
  if (IRREGULAR_JE[v]) return IRREGULAR_JE[v];
  if (!v.endsWith('er') || v.length < 4) return undefined;
  let stem = v.slice(0, -2);
  stem = stem.replace(/é([^aeiouyéèêàâîôû]+)$/, 'è$1');
  if (stem.endsWith('y')) stem = `${stem.slice(0, -1)}i`; // nettoyer → nettoie
  return withJe(`${stem}e`);
}

/**
 * Whether the word of the day is a verb, and the reminder to show.
 * `nature` is the Airtable « Nature » column (Verbe, Nom, Adjectif…).
 */
export function verbInfo(word: string, nature = ''): VerbInfo | null {
  const w = lower(word);
  const n = lower(nature);
  const isVerb = n ? n.startsWith('verbe') : (NOUN_OF[w] !== undefined || IRREGULAR_JE[w] !== undefined) && w !== 'sourire' && w !== 'rire';
  if (!isVerb || NOT_VERBS.has(w) || w.includes(' ')) return null;
  return { infinitive: w, je: conjugateJe(w), noun: NOUN_OF[w] };
}
