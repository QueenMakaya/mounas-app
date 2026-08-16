/**
 * Persists email captures (newsletter + free e-book requests) to Airtable.
 *
 * Reads secrets from the environment at call-time (never at import) so the app
 * still builds/renders if signups aren't configured yet:
 *   - AIRTABLE_API_KEY          personal access token (Bearer)
 *   - AIRTABLE_BASE_ID          base id, e.g. appXXXXXXXXXXXXXX
 *   - AIRTABLE_SIGNUPS_TABLE    optional — overrides the table below
 *
 * The table lives in the same base as the activities, so only the table name
 * differs from the app's own config; defaulting it here means signups keep
 * working without a separate deployment variable.
 *
 * Expected columns in that table: "Email" (email or single line text) and
 * "Source" (single select or single line text). typecast lets Airtable create
 * the Source option automatically.
 *
 * The token needs data.records:write on that base, not just read.
 */

import { airtableToken } from '@/lib/airtable-token';

// The "Signups" table, addressed by id rather than name: Airtable answers a
// missing table and a missing permission with the same 403
// (INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND), so pinning the id takes the
// "wrong table" half of that message off the table — and survives a rename.
const DEFAULT_SIGNUPS_TABLE = 'tblbBiOrYGDRd6hO3';

export type SignupSource = 'newsletter' | 'ebook';

export type SignupResult = { ok: true } | { ok: false; error: 'not_configured' | 'airtable_error' };

export async function saveSignup(email: string, source: SignupSource): Promise<SignupResult> {
  const apiKey = airtableToken();
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_SIGNUPS_TABLE || DEFAULT_SIGNUPS_TABLE;

  if (!apiKey || !baseId) {
    console.error('[signups] Missing Airtable env (AIRTABLE_API_KEY / AIRTABLE_BASE_ID)');
    return { ok: false, error: 'not_configured' };
  }

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        typecast: true,
        records: [{ fields: { Email: email, Source: source } }],
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      // Say exactly which credential and target were used. The part of a
      // personal access token before the "." is its public token id — the same
      // id Airtable shows in the tokens list — so this identifies the token
      // without printing the secret half.
      console.error(
        `[signups] Airtable responded ${res.status}: ${detail} ` +
          `| token=${apiKey.split('.')[0]} (len ${apiKey.length}) base=${baseId} table=${table}`,
      );
      return { ok: false, error: 'airtable_error' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[signups] Request to Airtable failed:', err);
    return { ok: false, error: 'airtable_error' };
  }
}
