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

// Stripe Payment Link: every "Essai gratuit" button opens it (10 $/mois,
// 14 jours gratuits). NEXT_PUBLIC_STRIPE_PAYMENT_LINK overrides it, e.g. to point
// a preview deployment at a test-mode link.
const DEFAULT_STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/7sY5kE6JzbCpcdD4xb8AE06';
export const STRIPE_PAYMENT_LINK = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || DEFAULT_STRIPE_PAYMENT_LINK;

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

// Free trial — same Stripe link as STRIPE_PAYMENT_LINK: 14 days free, then
// 10 $ CAD / month. After checkout Stripe sends the parent to /app/bienvenue,
// already logged in.
export const TRIAL_URL = process.env.NEXT_PUBLIC_TRIAL_URL || STRIPE_PAYMENT_LINK;
export const TRIAL_DAYS = 14;
/** Money-back guarantee shown next to every trial button (Pam, Nov 2026). */
export const GUARANTEE_DAYS = 30;
export const GUARANTEE = `Satisfait ou remboursé ${GUARANTEE_DAYS} jours`;
/** What Stripe actually charges: the Payment Link is in Canadian dollars. */
export const MONTHLY_PRICE_CAD = 10;
export const MONTHLY_PRICE = `${MONTHLY_PRICE_CAD} $ CA`;
/**
 * Rough conversions shown next to the price for parents in Europe and in the
 * CFA franc zone, so "10 $" doesn't read as US dollars. Display only: Stripe
 * still charges CAD. Update the rate if the CAD moves a lot. The CFA franc is
 * pegged to the euro (1 € = 655,957 FCFA).
 */
export const CAD_TO_EUR = 0.65;
export const EUR_TO_XOF = 655.957;

/** Public site, used for links that leave the app (WhatsApp shares, emails). */
export const SITE_URL = 'https://www.lesmounas.school';
/**
 * Short link printed on the Mot du Jour card and in WhatsApp shares. It
 * redirects to the free word of the day with UTM tags (see src/app/jour).
 */
export const MOT_DU_JOUR_SHORT_URL = `${SITE_URL}/jour`;

/** Build a wa.me link, optionally pre-filling the first message. */
export function whatsappLink(message?: string): string {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/';
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
