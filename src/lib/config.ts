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

// WhatsApp — set NEXT_PUBLIC_WHATSAPP_NUMBER to your number in international
// format, digits only (e.g. 33612345678). Leave empty to fall back to a plain
// wa.me link the visitor can address themselves.
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^0-9]/g, '');

// Scheduling — paste your Calendly OR Cal.com booking link here via
// NEXT_PUBLIC_BOOKING_URL (e.g. https://calendly.com/les-mounas/20min or
// https://cal.com/les-mounas/20min). Works with either tool.
export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || '';

/** Build a wa.me link, optionally pre-filling the first message. */
export function whatsappLink(message?: string): string {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/';
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
