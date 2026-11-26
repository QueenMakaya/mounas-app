/**
 * The free trial without a card, for families who pay by Mobile Money
 * (/mobile-money). Server only.
 *
 * The form adds one row to the Airtable « Accès offerts » table:
 *   Actif ticked, « Expire le » = last day of the trial, « Offre » = « Essai
 *   Mobile Money », plus the name, WhatsApp number and preferred operator.
 * src/lib/subscription.ts already lets that email log in until « Expire le »,
 * so the trial opens at once and closes by itself. When the family has paid,
 * Pam moves « Expire le » forward in Airtable (and fills « Référence
 * paiement »): nothing else to change.
 *
 * One trial per email: if a row already exists for it (open, expired or
 * unticked), no new one is created.
 *
 * Same Airtable env as the rest of the app (AIRTABLE_API_KEY /
 * AIRTABLE_BASE_ID, optional AIRTABLE_GIFTS_TABLE). The token needs
 * data.records:write on that base.
 */

import { airtableToken } from '@/lib/airtable-token';
import { EXPO, MOBILE_MONEY, TRIAL_DAYS } from '@/lib/config';

const DEFAULT_GIFTS_TABLE = 'tbl0xr6jCtLuGrbQA'; // Accès offerts
const TIMEOUT_MS = 6000;

export type MobileMoneyRequest = {
  email: string;
  name: string;
  whatsapp: string;
  country: string;
  operator: string;
  childAge: string;
  /** The page the form was sent from: /mobile-money or /abidjan (QR code of the flyers). */
  page: string;
};

export type TrialResult =
  | { ok: true; until: string }
  | { ok: false; error: 'already_used' | 'not_configured' | 'airtable_error' };

function target(): { url: string; token: string } | null {
  const token = airtableToken();
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) return null;
  const table = process.env.AIRTABLE_GIFTS_TABLE || DEFAULT_GIFTS_TABLE;
  return { url: `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`, token };
}

/** Last day of a trial that starts today: TRIAL_DAYS days, today included (YYYY-MM-DD, UTC). */
export function trialLastDay(now = Date.now()): string {
  return new Date(now + (TRIAL_DAYS - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** « 9 décembre 2026 » */
export function frenchDate(isoDay: string): string {
  return new Date(`${isoDay}T12:00:00Z`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

async function hasAnyRow(email: string, t: { url: string; token: string }): Promise<boolean> {
  const safe = email.trim().toLowerCase().replace(/["\\]/g, '');
  const formula = `LOWER(TRIM({Email})) = "${safe}"`;
  const res = await fetch(`${t.url}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`, {
    headers: { Authorization: `Bearer ${t.token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text().catch(() => '')}`);
  const data = (await res.json()) as { records?: unknown[] };
  return (data.records?.length ?? 0) > 0;
}

export async function openMobileMoneyTrial(req: MobileMoneyRequest): Promise<TrialResult> {
  const t = target();
  if (!t) {
    console.error('[mobile-money] Airtable env missing (AIRTABLE_API_KEY / AIRTABLE_BASE_ID)');
    return { ok: false, error: 'not_configured' };
  }
  const email = req.email.trim().toLowerCase();
  const until = trialLastDay();
  const today = new Date().toISOString().slice(0, 10);

  try {
    if (await hasAnyRow(email, t)) return { ok: false, error: 'already_used' };

    const notes = [
      `Essai gratuit sans carte demandé sur ${req.page} le ${frenchDate(today)}, ouvert jusqu'au ${frenchDate(until)}.`,
      `Offre annoncée : ${EXPO.price} pour un an, à payer après l'essai.`,
      `Pays : ${req.country}.`,
      req.childAge ? `Âge de l'enfant : ${req.childAge}.` : '',
      `À faire : envoyer les détails de paiement ${req.operator} (${EXPO.price}) sur WhatsApp avant la fin de l'essai. Paiement reçu → repousser « Expire le » d'un an, remplir « Référence paiement », « Offre » → « Famille Fondatrice Abidjan » si c'est une place de l'offre.`,
    ]
      .filter(Boolean)
      .join('\n');

    const fields: Record<string, unknown> = {
      Email: email,
      Actif: true,
      Nom: req.name,
      'Expire le': until,
      Offre: MOBILE_MONEY.offer,
      Paiement: req.operator,
      WhatsApp: req.whatsapp,
      Notes: notes,
    };

    const res = await fetch(t.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t.token}`, 'Content-Type': 'application/json' },
      // typecast creates the « Essai Mobile Money » choice the first time.
      body: JSON.stringify({ typecast: true, records: [{ fields }] }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[mobile-money] Airtable responded ${res.status}: ${await res.text().catch(() => '')}`);
      return { ok: false, error: 'airtable_error' };
    }
    return { ok: true, until };
  } catch (err) {
    console.error('[mobile-money] could not open the trial:', err);
    return { ok: false, error: 'airtable_error' };
  }
}
