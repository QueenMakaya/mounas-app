/**
 * What the voice says to the child in child mode, all in one place: one short
 * instruction per step (said once when the step opens, again when the child
 * taps the picture), the praise when a step is done, and the gentle nudge
 * after a wrong tap. Short sentences, "tu", and praise for the effort and the
 * method, never for speed or talent.
 */

export type KidIconName = 'ecouter' | 'toucher' | 'glisser' | 'ecrire' | 'dire' | 'mains' | 'suivant' | 'rejouer';

export type Prompt = { icon: KidIconName; say: string };

export const STEP_PROMPTS: Record<string, Prompt> = {
  'decouvrir-lire': { icon: 'toucher', say: 'Touche les cartes, puis lis le mot tout seul.' },
  'decouvrir-ecoute': { icon: 'ecouter', say: 'Écoute bien le mot, puis écris-le avec les sons.' },
  syllabes: { icon: 'mains', say: 'Tape dans tes mains à chaque syllabe.' },
  lire: { icon: 'glisser', say: 'Glisse ton doigt sous le mot.' },
  prononcer: { icon: 'dire', say: 'Dis le mot trois fois.' },
  activite: { icon: 'dire', say: 'On en parle ensemble.' },
  chanson: { icon: 'ecouter', say: 'On chante ensemble !' },
  epeler: { icon: 'toucher', say: 'Touche les sons dans le bon ordre.' },
  ecrire: { icon: 'ecrire', say: 'Écris le mot avec ton doigt.' },
  mission: { icon: 'ecouter', say: 'Écoute bien la mission.' },
  revision: { icon: 'toucher', say: 'Lis ces mots, puis écoute-les pour vérifier.' },
  'jeu-image': { icon: 'ecouter', say: 'Écoute le mot, puis touche la bonne image.' },
  'jeu-peche': { icon: 'toucher', say: 'Pêche les mots qui ont ce son.' },
  'jeu-phrase': { icon: 'toucher', say: 'Trouve le mot qui manque dans la phrase.' },
  'jeu-nourris': { icon: 'glisser', say: 'Donne les sons au Mounas, dans le bon ordre.' },
};

/** When a step is done: about trying, listening and taking one's time. */
export const PRAISE = [
  'Bel effort !',
  'Tu as bien écouté !',
  'Tu as pris ton temps, bravo !',
  'Tu as bien cherché !',
  'Tu as essayé jusqu’au bout, bravo !',
];

export const praiseFor = (n: number) => PRAISE[Math.abs(n) % PRAISE.length];

export const TRY_AGAIN = 'Écoute encore.';
export const YOUR_TURN = 'À toi de dire les sons\u00a0!';
export const ANOTHER_WORD = 'Un autre mot\u00a0?';
export const DAY_DONE = 'Tu as bien travaillé aujourd’hui, à demain\u00a0!';
