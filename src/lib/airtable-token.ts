/**
 * Reads AIRTABLE_API_KEY and repairs the ways a personal access token usually
 * gets mangled on its way into a deployment dashboard:
 *
 *   - a trailing newline or space picked up by the copy
 *   - wrapping quotes ("pat…" or 'pat…') copied from a .env line
 *   - a "Bearer " prefix copied along with an example header
 *
 * Airtable answers all three with 401 AUTHENTICATION_REQUIRED, which reads as
 * "the token is wrong" even though the token itself is fine — so we clean the
 * value here rather than make someone hunt for an invisible character.
 *
 * A genuinely wrong or revoked token still fails: this only strips packaging.
 */
export function airtableToken(): string {
  return (process.env.AIRTABLE_API_KEY ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^Bearer\s+/i, '')
    .trim();
}

/** True when the value at least looks like an Airtable personal access token. */
export function looksLikeAirtableToken(token: string): boolean {
  return token.startsWith('pat') && token.length > 40;
}
