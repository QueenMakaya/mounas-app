/**
 * Persists email captures (newsletter + free e-book requests) to Airtable.
 *
 * Reads secrets from the environment at call-time (never at import) so the app
 * still builds/renders if signups aren't configured yet:
 *   - AIRTABLE_API_KEY          personal access token (Bearer)
 *   - AIRTABLE_BASE_ID          base id, e.g. appXXXXXXXXXXXXXX
 *   - AIRTABLE_SIGNUPS_TABLE    table name OR id that stores the emails
 *
 * Expected columns in that table: "Email" (single line text) and
 * "Source" (single select or single line text). typecast lets Airtable create
 * the Source option automatically.
 */

export type SignupSource = 'newsletter' | 'ebook';

export type SignupResult = { ok: true } | { ok: false; error: 'not_configured' | 'airtable_error' };

export async function saveSignup(email: string, source: SignupSource): Promise<SignupResult> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_SIGNUPS_TABLE;

  if (!apiKey || !baseId || !table) {
    console.error('[signups] Missing Airtable env (AIRTABLE_API_KEY / AIRTABLE_BASE_ID / AIRTABLE_SIGNUPS_TABLE)');
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
      console.error(`[signups] Airtable responded ${res.status}: ${detail}`);
      return { ok: false, error: 'airtable_error' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[signups] Request to Airtable failed:', err);
    return { ok: false, error: 'airtable_error' };
  }
}
