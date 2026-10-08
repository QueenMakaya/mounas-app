/** A friendly emoji per Airtable theme, for hints and chips. */
const THEME_EMOJI: Record<string, string> = {
  Animaux: '🐾',
  Nature: '🌿',
  Famille: '👨‍👩‍👧',
  Nourriture: '🍲',
  'Cuisine Afro': '🍛',
  Corps: '🖐️',
  Maison: '🏠',
  Transports: '🚗',
  Jeux: '🧸',
  Émotions: '😊',
  Musique: '🎵',
  Couleurs: '🎨',
  Quotidien: '☀️',
};

export function themeEmoji(theme: string): string {
  return THEME_EMOJI[theme] ?? '✨';
}
