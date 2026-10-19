/**
 * A picture for the words a child can recognise from an emoji, for the game
 * « Trouve l'image ». Airtable has no image per word, so this short list is
 * the only source: a word without a picture simply never gets the game.
 */
const PICTURES: Record<string, string> = {
  // Animaux
  chat: '🐱', chien: '🐶', lapin: '🐰', girafe: '🦒', hibou: '🦉', lion: '🦁', tigre: '🐯', zèbre: '🦓',
  éléphant: '🐘', singe: '🐒', souris: '🐭', poisson: '🐟', oiseau: '🐦', poule: '🐔', vache: '🐮',
  cochon: '🐷', mouton: '🐑', cheval: '🐴', canard: '🦆', tortue: '🐢', serpent: '🐍', escargot: '🐌',
  papillon: '🦋', abeille: '🐝', fourmi: '🐜', crocodile: '🐊', ours: '🐻', loup: '🐺', renard: '🦊',
  grenouille: '🐸', chèvre: '🐐', baleine: '🐋', dauphin: '🐬', pingouin: '🐧', hippopotame: '🦛',
  // Nature
  soleil: '☀️', lune: '🌙', étoile: '⭐', nuage: '☁️', pluie: '🌧️', arbre: '🌳', fleur: '🌸', feuille: '🍃',
  mer: '🌊', montagne: '⛰️', feu: '🔥', neige: '❄️', 'arc-en-ciel': '🌈', palmier: '🌴', baobab: '🌳',
  // Nourriture
  pomme: '🍎', banane: '🍌', orange: '🍊', mangue: '🥭', ananas: '🍍', fraise: '🍓', raisin: '🍇',
  citron: '🍋', carotte: '🥕', tomate: '🍅', pain: '🍞', riz: '🍚', lait: '🥛', gâteau: '🍰', œuf: '🥚',
  fromage: '🧀', soupe: '🍲', miel: '🍯', bonbon: '🍬', noix: '🥥', avocat: '🥑', maïs: '🌽', poulet: '🍗',
  // Corps
  main: '✋', pied: '🦶', œil: '👁️', nez: '👃', bouche: '👄', oreille: '👂', dent: '🦷', cœur: '❤️',
  // Maison, objets, jeux
  maison: '🏠', lit: '🛏️', porte: '🚪', clé: '🔑', livre: '📖', crayon: '✏️', ballon: '⚽', balle: '⚽',
  poupée: '🪆', tambour: '🥁', guitare: '🎸', robe: '👗', chapeau: '👒', chaussure: '👟', parapluie: '☂️',
  cadeau: '🎁', télé: '📺', téléphone: '📱', lampe: '💡', cuillère: '🥄', tasse: '☕', bol: '🥣',
  // Transports
  voiture: '🚗', bus: '🚌', train: '🚆', avion: '✈️', bateau: '⛵', vélo: '🚲', moto: '🏍️', fusée: '🚀', camion: '🚚',
  // Famille, émotions
  bébé: '👶', maman: '👩', papa: '👨', mamie: '👵', papi: '👴', famille: '👨‍👩‍👧', sourire: '😊', rire: '😄',
};

/** The picture for a word ("le lapin", "Lapin" and "lapins" all work), if any. */
export function wordPicture(word: string): string | null {
  const w = word.trim().toLocaleLowerCase('fr').replace(/^(?:(?:le|la|les|un|une)\s+|l[’'])/, '');
  return PICTURES[w] ?? PICTURES[w.replace(/[sx]$/, '')] ?? null;
}
