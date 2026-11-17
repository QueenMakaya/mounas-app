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

/** The themes we know, used when Airtable can't be asked (src/lib/onboarding.ts). */
export const KNOWN_THEMES = Object.keys(THEME_EMOJI);

export function themeEmoji(theme: string): string {
  return THEME_EMOJI[theme] ?? '✨';
}
