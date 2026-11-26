/**
 * One row in the Airtable « Parcours d'inscription » table per step of the
 * sign-up path, so the daily report and the dashboard can follow it:
 *   - « Questionnaire commencé » : first answer given on /commencer;
 *   - « Questionnaire terminé »  : the parent reached the plan and went on;
 *   - « Essai gratuit cliqué »   : any link to the Stripe trial checkout;
 *   - « Essai Mobile Money demandé » : the no-card trial form was sent (logged
 *     by the server action, src/app/mobile-money-actions.ts).
 * Whether the trial was then really started or abandoned is read from Stripe
 * (checkout sessions), not from here.
 *
 * The browser sends raw answer values (POST /api/parcours); they are only
 * kept when they are one of the questionnaire's own choices, and turned into
 * their French labels here. Nothing personal is stored: never the child's
 * first name, no email, no IP address.
 *
 * Same Airtable env as the rest of the app, read at call-time:
 *   - AIRTABLE_API_KEY / AIRTABLE_BASE_ID
 *   - AIRTABLE_FUNNEL_TABLE   optional — overrides the table below
 * Never throws.
 */

import { airtableToken } from '@/lib/airtable-token';
import { deviceFrom } from '@/lib/visit';
import { LEVELS } from '@/lib/levels';
import { AGE_CHOICES, CHESS_CHOICES, INTEREST_CHOICES, MATH_CHOICES } from '@/lib/onboarding';

// « Parcours d'inscription » in the « LES MOUNAS — App » base, by id (survives a rename).
const DEFAULT_FUNNEL_TABLE = 'tbl5kkPrp5gTbLVXd';
const TIMEOUT_MS = 4000;

export const FUNNEL_EVENTS = {
  start: 'Questionnaire commencé',
  finish: 'Questionnaire terminé',
  trial: 'Essai gratuit cliqué',
  mobile: 'Essai Mobile Money demandé',
} as const;
export type FunnelEvent = keyof typeof FUNNEL_EVENTS;

const ACCESS_LABELS: Record<string, string> = { free: 'Visiteur', demo: 'Démo', member: 'Abonné' };

/** What the browser may send. Every field is optional and checked. */
export type FunnelPayload = {
  event?: unknown;
  page?: unknown;
  source?: unknown;
  access?: unknown;
  age?: unknown;
  level?: unknown;
  math?: unknown;
  chess?: unknown;
  interests?: unknown;
};

export type FunnelRow = Record<string, string>;

const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.slice(0, max) : '');
const labelOf = (choices: readonly { value: string; label: string }[], v: unknown): string =>
  choices.find((c) => c.value === v)?.label ?? '';

/** The Airtable fields for one event, or null when the event is unknown. */
export function funnelRow(payload: FunnelPayload, userAgent: string, country: string): FunnelRow | null {
  const key = str(payload.event, 20) as FunnelEvent;
  if (!(key in FUNNEL_EVENTS)) return null;
  const event = FUNNEL_EVENTS[key];

  const page = str(payload.page, 100);
  const age = labelOf(AGE_CHOICES, payload.age);
  const level = LEVELS.find((l) => l.value === payload.level);
  const interests = Array.isArray(payload.interests)
    ? INTEREST_CHOICES.filter((c) => (payload.interests as unknown[]).includes(c.value)).map((c) => c.label)
    : [];
  const device = deviceFrom(userAgent);
  const pays = /^[A-Z]{2}$/.test(country) ? country : '';

  const row: FunnelRow = {
    Résumé: [event, age, device, pays].filter(Boolean).join(' · '),
    Date: new Date().toISOString(),
    Événement: event,
    Page: page.startsWith('/') ? page : '',
    Âge: age,
    Niveau: level ? `${level.short} · ${level.label}` : '',
    Calcul: labelOf(MATH_CHOICES, payload.math),
    Échecs: labelOf(CHESS_CHOICES, payload.chess),
    Passions: interests.join(', '),
    Accès: ACCESS_LABELS[str(payload.access, 10)] ?? '',
    Appareil: device,
    Pays: pays,
    Provenance: str(payload.source) || 'direct',
  };
  // Airtable refuses '' for a select; leave empty fields out.
  for (const k of Object.keys(row)) if (!row[k]) delete row[k];
  return row;
}

export async function logFunnel(row: FunnelRow): Promise<void> {
  const apiKey = airtableToken();
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_FUNNEL_TABLE || DEFAULT_FUNNEL_TABLE;
  if (!apiKey || !baseId) {
    console.warn('[parcours] Airtable env missing: step not logged.');
    return;
  }
  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ typecast: true, records: [{ fields: row }] }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error(`[parcours] Airtable responded ${res.status}: ${await res.text().catch(() => '')}`);
  } catch (err) {
    console.error('[parcours] could not log the step:', err);
  }
}
