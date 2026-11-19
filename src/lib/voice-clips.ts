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
  // A word that is also a syllable (« yeux ») plays the word.
  ...SYLLABLE_CLIPS,
  ...WORD_CLIPS,
  // Consignes (prompts.ts)
  'Touche les cartes, puis lis le mot tout seul.': 'consignes/decouvrir-lire.mp3',
  'Écoute bien le mot, puis écris-le avec les sons.': 'consignes/decouvrir-ecoute.mp3',
  'Combien de syllabes ? Écris le nombre, puis tape dans tes mains pour vérifier.': 'consignes/syllabes.mp3',
  'Glisse ton doigt sous le mot.': 'consignes/lire.mp3',
  'Dis le mot trois fois.': 'consignes/prononcer.mp3',
  'On en parle ensemble.': 'consignes/activite.mp3',
  'Invente ta phrase avec le mot, puis récite la comptine !': 'consignes/chanson.mp3',
  'Touche les sons dans le bon ordre.': 'consignes/epeler.mp3',
  'Dessine le mot avec ton doigt.': 'consignes/dessiner.mp3',
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
  // Les échecs de Mounaville (EchecsClient.tsx)
  'Voici le Roi !': 'echecs/voici-le-roi.mp3',
  'Voici la Reine !': 'echecs/voici-la-reine.mp3',
  'Voici le Rhinocéros !': 'echecs/voici-le-rhinoceros.mp3',
  'Voici l’Éléphant !': 'echecs/voici-l-elephant.mp3',
  'Voici la Gazelle !': 'echecs/voici-la-gazelle.mp3',
  'Voici le Mouna !': 'echecs/voici-le-mouna.mp3',
  'Parfait ! Trois étoiles !': 'echecs/parfait-trois-etoiles.mp3',
  'Bravo, toutes les mangues sont ramassées !': 'echecs/bravo-toutes-les-mangues-sont-ramassees.mp3',
  'Le Soleil a gagné la course !': 'echecs/le-soleil-a-gagne-la-course.mp3',
  'La Lune a gagné la course !': 'echecs/la-lune-a-gagne-la-course.mp3',
  'Échec ! Attention au Roi !': 'echecs/echec-attention-au-roi.mp3',
  'Échec… mais le Roi peut encore s’échapper. Essaie autre chose !': 'echecs/echec-mais-le-roi-peut-encore-s-echapper.mp3',
  'Pas encore. Essaie un autre coup !': 'echecs/pas-encore-essaie-un-autre-coup.mp3',
  'Échec et mat ! Bravo, tu as attrapé le Roi !': 'echecs/echec-et-mat-bravo-tu-as-attrape-le-roi.mp3',
  'Échec et mat ! Le Soleil a gagné !': 'echecs/echec-et-mat-le-soleil-a-gagne.mp3',
  'Échec et mat ! La Lune a gagné !': 'echecs/echec-et-mat-la-lune-a-gagne.mp3',
  'Match nul ! Personne ne gagne.': 'echecs/match-nul-personne-ne-gagne.mp3',
  'Le Mouna est arrivé au bout : il devient une Reine !': 'echecs/le-mouna-est-arrive-au-bout-il-devient-u.mp3',
  // Échecs : consignes, « comment ça bouge », histoires des pièces et des tissus, fins de partie (18 nov.)
  'Bienvenue à Mounaville ! Ici, chaque équipe porte un tissu d’Afrique : choisis le tien ! Chaque chapitre est un petit jeu. Commence par rencontrer la famille royale !': 'echecs/consigne-bienvenue.mp3',
  'Choisis une pièce. Elle doit ramasser toutes les mangues, en faisant le moins de déplacements possible. Fais attention aux cailloux : on ne peut pas passer dessus !': 'echecs/consigne-mangues.mp3',
  'La course des Mounas ! Chaque Mouna avance d’un pas tout droit, ou de deux pas la première fois. Pour attraper un Mouna de l’autre équipe, il fait un pas en diagonale. Le premier qui arrive tout au bout gagne !': 'echecs/consigne-course.mp3',
  'Quand on attaque le Roi, on dit : échec ! Et si le Roi ne peut plus du tout s’échapper, c’est échec et mat : on a gagné ! Dans chaque défi, trouve le coup qui coince le Roi adverse.': 'echecs/consigne-roi.mp3',
  'Le Roi fait un seul pas, dans toutes les directions. Il est précieux : il faut toujours le protéger !': 'echecs/bouge-roi.mp3',
  'La Reine va où elle veut : tout droit ou en diagonale, aussi loin qu’elle le souhaite. C’est la plus forte !': 'echecs/bouge-reine.mp3',
  'La Gazelle bondit en forme de L : deux cases tout droit, puis une sur le côté. C’est la seule qui saute par-dessus les autres !': 'echecs/bouge-gazelle.mp3',
  'Le Mouna avance d’un pas tout droit (deux pas la première fois). Pour attraper, il fait un pas en diagonale. S’il arrive tout au bout, il devient une Reine !': 'echecs/bouge-mouna.mp3',
  'Il s’appelle Mansa, comme Mansa Moussa, le roi du Mali, qui était si riche qu’il a semé de l’or tout le long de son voyage.': 'echecs/histoire-roi.mp3',
  'Elle s’appelle Nzinga, comme la reine Nzinga d’Angola, une grande stratège qui a défendu son peuple pendant quarante ans.': 'echecs/histoire-reine.mp3',
  'La gazelle bondit si haut et si vite dans la savane que le lion lui-même a du mal à l’attraper.': 'echecs/histoire-gazelle.mp3',
  '« Mouna » veut dire « enfant ». Les petits avancent pas à pas… et celui qui traverse toute la savane devient une Reine !': 'echecs/histoire-mouna.mp3',
  'Le kente vient du Ghana. Les Ashanti et les Ewe le tissent en longues bandes étroites, cousues ensemble. Chaque motif a un nom et un sens.': 'echecs/tissu-kente.mp3',
  'Le bogolan vient du Mali. On peint ses motifs avec de la boue : en bambara, « bogo » veut dire « terre ».': 'echecs/tissu-bogolan.mp3',
  'Le tissu kuba vient du royaume Kuba, au Congo. Il est fait en fibres de raphia, avec des motifs géométriques qu’on invente en brodant.': 'echecs/tissu-kuba.mp3',
  'Le ndop vient de l’Ouest du Cameroun. Ce tissu bleu indigo aux motifs blancs se porte pour les grandes fêtes et les cérémonies des rois.': 'echecs/tissu-ndop.mp3',
  'Le kanga vient du Kenya et de la Tanzanie. Ce tissu aux couleurs vives porte souvent un proverbe écrit en swahili.': 'echecs/tissu-kanga.mp3',
  'Bravo ! Ton équipe a gagné la course !': 'echecs/fin-course-bravo.mp3',
  'L’ordinateur a gagné la course ! On rejoue ?': 'echecs/fin-course-ordi.mp3',
  'Échec et mat ! Bravo, ton équipe a gagné !': 'echecs/fin-mat-bravo.mp3',
  'Échec et mat ! L’ordinateur a gagné. On rejoue ?': 'echecs/fin-mat-ordi.mp3',
  'L’équipe Kente a gagné la course !': 'echecs/fin-course-kente.mp3',
  'L’équipe Bogolan a gagné la course !': 'echecs/fin-course-bogolan.mp3',
  'L’équipe Kuba a gagné la course !': 'echecs/fin-course-kuba.mp3',
  'L’équipe Ndop a gagné la course !': 'echecs/fin-course-ndop.mp3',
  'L’équipe Kanga a gagné la course !': 'echecs/fin-course-kanga.mp3',
  'Échec et mat ! L’équipe Kente a gagné !': 'echecs/fin-mat-kente.mp3',
  'Le Rhinocéros fonce tout droit : en avant, en arrière ou sur les côtés, aussi loin qu’il veut. Mais jamais en diagonale !': 'echecs/bouge-rhinoceros.mp3',
  'L’Éléphant marche en diagonale, aussi loin qu’il veut. Il reste toujours sur les cases de la même couleur.': 'echecs/bouge-elephant.mp3',
  'Le rhinocéros ne voit pas très bien, alors il fonce droit devant lui. Personne n’ose lui barrer la route !': 'echecs/histoire-rhinoceros.mp3',
  'Le sais-tu ? Dans le tout premier jeu d’échecs, il y a très longtemps, cette pièce était déjà un éléphant !': 'echecs/histoire-elephant.mp3',
  'Échec et mat ! L’équipe Bogolan a gagné !': 'echecs/fin-mat-bogolan.mp3',
  'Échec et mat ! L’équipe Kuba a gagné !': 'echecs/fin-mat-kuba.mp3',
  'Échec et mat ! L’équipe Ndop a gagné !': 'echecs/fin-mat-ndop.mp3',
  'Échec et mat ! L’équipe Kanga a gagné !': 'echecs/fin-mat-kanga.mp3',
  // Leçon du Y (YLesson.tsx)
  'stylo': 'lecon-y/stylo.mp3',
  'cygne': 'lecon-y/cygne.mp3',
  'yaourt': 'lecon-y/yaourt.mp3',
  'yoga': 'lecon-y/yoga.mp3',
  'crayon': 'lecon-y/crayon.mp3',
  'noyau': 'lecon-y/noyau.mp3',
  'voyage': 'lecon-y/voyage.mp3',
  'yoyo': 'lecon-y/yoyo.mp3',
  'goyave': 'lecon-y/goyave.mp3',
  'sympa': 'lecon-y/sympa.mp3',
  'symbole': 'lecon-y/symbole.mp3',
  'olympique': 'lecon-y/olympique.mp3',
  'synonyme': 'lecon-y/synonyme.mp3',
  'il y a': 'lecon-y/il-y-a.mp3',
  'Bravo !': 'lecon-y/bravo.mp3',
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
  oin: 'sons/oin.mp3',
  // Groupes de consonnes
  br: 'sons/groupes/br.mp3',
  cr: 'sons/groupes/cr.mp3',
  dr: 'sons/groupes/dr.mp3',
  fr: 'sons/groupes/fr.mp3',
  gr: 'sons/groupes/gr.mp3',
  pr: 'sons/groupes/pr.mp3',
  tr: 'sons/groupes/tr.mp3',
  vr: 'sons/groupes/vr.mp3',
  bl: 'sons/groupes/bl.mp3',
  cl: 'sons/groupes/cl.mp3',
  fl: 'sons/groupes/fl.mp3',
  gl: 'sons/groupes/gl.mp3',
  pl: 'sons/groupes/pl.mp3',
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
