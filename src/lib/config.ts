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

// Social profiles — each NEXT_PUBLIC_* variable overrides the default URL below,
// so the links always show up on /connect even when the variables aren't set.
export const SOCIAL_LINKS = [
  { key: 'instagram', label: 'Instagram', handle: '@les_mounas', url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/les_mounas' },
  { key: 'tiktok', label: 'TikTok', handle: '@les_mounas', url: process.env.NEXT_PUBLIC_TIKTOK_URL || 'https://www.tiktok.com/@les_mounas' },
  { key: 'youtube', label: 'YouTube', handle: '@lesmounas', url: process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://www.youtube.com/@lesmounas' },
  { key: 'facebook', label: 'Facebook', handle: 'Les Mounas', url: process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://www.facebook.com/profile.php?id=120218827663422' },
  { key: 'skool', label: 'Skool', handle: 'Communauté homeschool', url: process.env.NEXT_PUBLIC_SKOOL_URL || 'https://www.skool.com/homeschooling-les-mounas-6553' },
  { key: 'linkedin', label: 'LinkedIn', handle: 'Les Mounas', url: process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://ca.linkedin.com/company/lesmounas' },
].filter((s) => s.url.length > 0);

// Free trial — Stripe payment link: 14 days free, then 10 $ CAD / month.
// After checkout Stripe redirects to WhatsApp ("J'ai activé mon essai").
export const TRIAL_URL = process.env.NEXT_PUBLIC_TRIAL_URL || 'https://buy.stripe.com/bJe3cwfg5bCpdhH6Fj8AE03';
export const TRIAL_DAYS = 14;
export const MONTHLY_PRICE = '10 $';

/** Build a wa.me link, optionally pre-filling the first message. */
export function whatsappLink(message?: string): string {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/';
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
