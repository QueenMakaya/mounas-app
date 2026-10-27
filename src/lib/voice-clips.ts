/**
 * Pam's recorded voice. Each entry maps what the app says to a file in
 * `public/voix/`. Whatever has no recording here is still read by the
 * browser's voice, so a clip can be added one at a time.
 *
 * Keys go through `clipKey`: case, accents' Unicode form, apostrophes and
 * punctuation don't matter, so « Un autre mot ? » matches "un autre mot".
 */
import { SYLLABLE_CLIPS, WORD_CLIPS } from './voice-clips-words';

const CLIPS: Record<string, string> = {
  ...WORD_CLIPS,
  ...SYLLABLE_CLIPS,
  // Consignes (prompts.ts)
  'Touche les cartes, puis lis le mot tout seul.': 'consignes/decouvrir-lire.mp3',
  'Écoute bien le mot, puis écris-le avec les sons.': 'consignes/decouvrir-ecoute.mp3',
  'Tape dans tes mains à chaque syllabe.': 'consignes/syllabes.mp3',
  'Glisse ton doigt sous le mot.': 'consignes/lire.mp3',
  'Dis le mot trois fois.': 'consignes/prononcer.mp3',
  'On en parle ensemble.': 'consignes/activite.mp3',
  'Invente ta phrase avec le mot, puis dis-la !': 'consignes/chanson.mp3',
  'Touche les sons dans le bon ordre.': 'consignes/epeler.mp3',
  'Écris le mot avec ton doigt.': 'consignes/ecrire.mp3',
  'Écoute bien la mission.': 'consignes/mission.mp3',
  'Écoute le mot, puis touche la bonne image.': 'consignes/jeu-image.mp3',
  'Pêche les mots qui ont ce son.': 'consignes/jeu-peche.mp3',
  'Trouve le mot qui manque dans la phrase.': 'consignes/jeu-phrase.mp3',
  'Écoute le mot, puis touche-le. Attention aux pièges !': 'consignes/jeu-mot.mp3',
  'Donne les sons au Mounas, dans le bon ordre.': 'consignes/jeu-nourris.mp3',
  'Lis ces mots, puis écoute-les pour vérifier.': 'consignes/revision.mp3',
  // Petites phrases
  'Écoute encore.': 'phrases/ecoute-encore.mp3',
  'À toi de dire les sons !': 'phrases/a-toi.mp3',
  'Un autre mot ?': 'phrases/un-autre-mot.mp3',
  'Tu as bien travaillé aujourd’hui, à demain !': 'phrases/a-demain.mp3',
  'Presque ! Essaie encore.': 'phrases/presque.mp3',
  'Bravo, tu passes au niveau suivant !': 'phrases/niveau-suivant.mp3',
  // Bravos
  'Bel effort !': 'bravos/bel-effort.mp3',
  'Tu as bien écouté !': 'bravos/bien-ecoute.mp3',
  'Tu as pris ton temps, bravo !': 'bravos/pris-ton-temps.mp3',
  'Tu as bien cherché !': 'bravos/bien-cherche.mp3',
  'Tu as essayé jusqu’au bout, bravo !': 'bravos/jusqu-au-bout.mp3',
  'Bravo, tu as bien cherché !': 'bravos/bravo-bien-cherche.mp3',
  'Tu as pris le temps de réfléchir, et tu as trouvé !': 'bravos/reflechir.mp3',
  'Super, tu as essayé, tu as cherché, et tu as trouvé !': 'bravos/super.mp3',
  'Quel beau travail de recherche !': 'bravos/recherche.mp3',
  'Tu as utilisé un indice, c’est une très bonne façon de chercher. Bravo !': 'bravos/indice.mp3',
  'Tu n’as pas abandonné, et tu as trouvé. Bravo pour ta patience !': 'bravos/patience.mp3',
  // Calcul : opérations et nombres de 0 à 100
  plus: 'calcul/plus.mp3',
  moins: 'calcul/moins.mp3',
  fois: 'calcul/fois.mp3',
  ...Object.fromEntries(Array.from({ length: 101 }, (_, n) => [String(n), `calcul/${n}.mp3`])),
};

export function clipKey(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[!?.,;:…«»" ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The sounds, by their key in `SOUNDS` (phonics.ts). Kept apart from the
 * texts: the syllable « le » of « école » must not play the sound « lll ».
 */
const SOUND_CLIPS: Record<string, string> = {
  a: 'sons/a.mp3',
  e: 'sons/e.mp3',
  'é': 'sons/e-aigu.mp3',
  'è': 'sons/e-grave.mp3',
  i: 'sons/i.mp3',
  o: 'sons/o.mp3',
  u: 'sons/u.mp3',
  ou: 'sons/ou.mp3',
  oi: 'sons/oi.mp3',
  eu: 'sons/eu.mp3',
  an: 'sons/an.mp3',
  on: 'sons/on.mp3',
  in: 'sons/in.mp3',
  ille: 'sons/ille.mp3',
  eille: 'sons/eille.mp3',
  aille: 'sons/aille.mp3',
  ouille: 'sons/ouille.mp3',
  m: 'sons/m.mp3',
  n: 'sons/n.mp3',
  l: 'sons/l.mp3',
  r: 'sons/r.mp3',
  s: 'sons/s.mp3',
  z: 'sons/z.mp3',
  f: 'sons/f.mp3',
  v: 'sons/v.mp3',
  j: 'sons/j.mp3',
  ch: 'sons/ch.mp3',
  gn: 'sons/gn.mp3',
  y: 'sons/y.mp3',
  w: 'sons/w.mp3',
  p: 'sons/p.mp3',
  b: 'sons/b.mp3',
  t: 'sons/t.mp3',
  d: 'sons/d.mp3',
  k: 'sons/k.mp3',
  g: 'sons/g.mp3',
  ks: 'sons/ks.mp3',
};

const byKey = new Map(Object.entries(CLIPS).map(([text, file]) => [clipKey(text), `/voix/${file}`]));

/** URL of Pam's recording of `text`, if there is one. */
export const clipFor = (text: string): string | undefined => byKey.get(clipKey(text));

/**
 * The clips to play for `text` (or for the sound `sound`, a key of
 * `SOUNDS`): its own recording, or, for a calculation
 * such as "7 plus 5", one clip per word when every word is recorded.
 * Undefined means the browser's voice reads it.
 */
export function clipsFor(text: string, sound?: string): string[] | undefined {
  if (sound) return SOUND_CLIPS[sound] ? [`/voix/${SOUND_CLIPS[sound]}`] : undefined;
  const whole = clipFor(text);
  if (whole) return [whole];
  if (!/^\d+ (plus|moins|fois) \d+$/.test(clipKey(text))) return undefined;
  const parts = clipKey(text).split(' ').map(clipFor);
  return parts.every(Boolean) ? (parts as string[]) : undefined;
}
