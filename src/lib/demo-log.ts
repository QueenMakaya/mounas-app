/**
 * One row in the Airtable « Démos » table each time someone starts a demo on
 * /demo, so the daily report and the dashboard can count demos (Vercel Web
 * Analytics collects them too, but its numbers can't be read from outside).
 *
 * Nothing personal is stored: no email, no IP address. Only the age button,
 * the kind of device, the country Vercel gives us and where the visitor came
 * from.
 *
 * Reads the same Airtable env as the rest of the app, at call-time:
 *   - AIRTABLE_API_KEY / AIRTABLE_BASE_ID
 *   - AIRTABLE_DEMOS_TABLE   optional — overrides the table below
 * The token needs data.records:write on that base.
 *
 * Never throws: a demo must open even if Airtable is down.
 */

import { airtableToken } from '@/lib/airtable-token';
import { DEMO_AGES } from '@/lib/demo';

// The « Démos » table of the « LES MOUNAS — App » base, addressed by id so a
// rename doesn't break it (same reasoning as src/lib/signups.ts).
const DEFAULT_DEMOS_TABLE = 'tbl7EgTE2QMKn3FAk';
const WHOLE_APP = "Toute l'app";
const TIMEOUT_MS = 4000;

export type DemoStart = {
  /** The age button pressed on /demo ('0-2', '3-4', '5-6'), or '' for "explorer toute l'app". */
  age: string;
  userAgent: string;
  /** Two-letter country from Vercel's x-vercel-ip-country header. */
  country: string;
  /** Where the visitor came from before /demo, as passed by the page. */
  source: string;
};

export function deviceFrom(userAgent: string): 'Mobile' | 'Tablette' | 'Ordinateur' {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|silk|playbook/.test(ua) || (ua.includes('android') && !ua.includes('mobile'))) return 'Tablette';
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) return 'Mobile';
  return 'Ordinateur';
}

/**
 * Turns the referrer and utm parameters /demo was opened with into a short
 * label: "instagram.com · utm: reel-lettre-y", "direct"… Our own site counts
 * as direct, since it only means the visitor clicked through from another page.
 */
export function sourceLabel(referrer: string | null | undefined, utm: { source?: string; campaign?: string }): string {
  let host = '';
  try {
    host = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : '';
  } catch {
    host = '';
  }
  if (host.endsWith('lesmounas.school') || host.endsWith('vercel.app')) host = '';
  const parts = [host || (utm.source ? '' : 'direct')];
  const tag = [utm.source, utm.campaign].filter(Boolean).join(' / ');
  if (tag) parts.push(`utm: ${tag}`);
  return parts.filter(Boolean).join(' · ').slice(0, 200);
}

export async function logDemoStart(demo: DemoStart): Promise<void> {
  const apiKey = airtableToken();
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_DEMOS_TABLE || DEFAULT_DEMOS_TABLE;
  if (!apiKey || !baseId) {
    console.warn('[demos] Airtable env missing: demo not logged.');
    return;
  }

  const age = DEMO_AGES.find((a) => a.value === demo.age)?.label ?? WHOLE_APP;
  const device = deviceFrom(demo.userAgent);
  const country = /^[A-Z]{2}$/.test(demo.country) ? demo.country : '';
  const summary = [age, device, country].filter(Boolean).join(' · ');

  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        typecast: true,
        records: [
          {
            fields: {
              Démo: summary,
              Date: new Date().toISOString(),
              Âge: age,
              Appareil: device,
              Pays: country,
              Provenance: demo.source || 'direct',
            },
          },
        ],
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[demos] Airtable responded ${res.status}: ${detail}`);
    }
  } catch (err) {
    console.error('[demos] could not log the demo:', err);
  }
}
