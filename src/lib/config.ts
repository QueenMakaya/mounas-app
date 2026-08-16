/**
 * Central place for site-wide, brand + integration config.
 *
 * The NEXT_PUBLIC_* values are safe to expose to the browser (they're just
 * links). Secrets (Airtable token) live in src/lib/signups.ts and are read
 * server-side only — never import them into a client component.
 */

// Brand palette — mirrors the colours already used across the word app.
export const COLORS = {
  cream: '#FDF6EC',
  ink: '#1A1A1A',
  purple: '#5B1F8C',
  teal: '#2EC4B6',
  tealDark: '#115E59',
  tealLight: '#CCFBF1',
  amber: '#F4A340',
  red: '#E63946',
  pink: '#E6197A',
} as const;

// WhatsApp — the business number every "Rejoindre" button opens, in
// international format, digits only. NEXT_PUBLIC_WHATSAPP_NUMBER overrides it
// (handy to point staging at a test number); the default keeps the buttons
// working even when that variable isn't set on the deployment.
const DEFAULT_WHATSAPP_NUMBER = '15145528184'; // +1 514 552-8184
export const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER
).replace(/[^0-9]/g, '');

// Scheduling — paste your Calendly OR Cal.com booking link here via
// NEXT_PUBLIC_BOOKING_URL (e.g. https://calendly.com/les-mounas/20min or
// https://cal.com/les-mounas/20min). Works with either tool.
export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || '';

// Social profiles — optional. Each one only shows up on /connect when its
// NEXT_PUBLIC_* variable is set, so the page never links to an empty profile.
export const SOCIAL_LINKS = [
  { key: 'instagram', label: 'Instagram', handle: '@lesmounas', url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '' },
  { key: 'tiktok', label: 'TikTok', handle: '@lesmounas', url: process.env.NEXT_PUBLIC_TIKTOK_URL || '' },
  { key: 'youtube', label: 'YouTube', handle: 'Les Mounas', url: process.env.NEXT_PUBLIC_YOUTUBE_URL || '' },
  { key: 'facebook', label: 'Facebook', handle: 'Les Mounas', url: process.env.NEXT_PUBLIC_FACEBOOK_URL || '' },
].filter((s) => s.url.length > 0);

/** Build a wa.me link, optionally pre-filling the first message. */
export function whatsappLink(message?: string): string {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/';
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
