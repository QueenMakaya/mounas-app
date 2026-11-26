/**
 * Places already taken in the Abidjan « Familles Fondatrices » offer.
 *
 * Counted from the Airtable « Accès offerts » table: one row per family whose
 * payment (Mobile Money, cash, card) is confirmed, with « Offre » set to
 * « Famille Fondatrice Abidjan » and « Actif » ticked. Adding the row opens
 * the family's access AND takes one place on /abidjan, with no redeploy.
 *
 * NEXT_PUBLIC_EXPO_PLACES_TAKEN stays as a floor (places promised by hand,
 * or Airtable out of reach): the page shows the larger of the two, and never
 * more than the number of places.
 */

import { airtableToken } from '@/lib/airtable-token';
import { EXPO, EXPO_PLACES_TAKEN } from '@/lib/config';

const DEFAULT_GIFTS_TABLE = 'tbl0xr6jCtLuGrbQA'; // Accès offerts
export const EXPO_OFFER_NAME = 'Famille Fondatrice Abidjan';

export async function expoPlacesTaken(): Promise<number> {
  const token = airtableToken();
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) return EXPO_PLACES_TAKEN;
  const table = process.env.AIRTABLE_GIFTS_TABLE || DEFAULT_GIFTS_TABLE;
  const formula = `AND({Actif}, {Offre} = "${EXPO_OFFER_NAME}")`;
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?pageSize=100&fields%5B%5D=Email&filterByFormula=${encodeURIComponent(formula)}`,
      // Cached a minute, like the page: a full hall must not hit Airtable on every visit.
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 60 } },
    );
    if (!res.ok) {
      console.error(`[expo] Airtable places responded ${res.status}: ${await res.text().catch(() => '')}`);
      return EXPO_PLACES_TAKEN;
    }
    const data = (await res.json()) as { records?: unknown[] };
    return Math.min(EXPO.places, Math.max(EXPO_PLACES_TAKEN, data.records?.length ?? 0));
  } catch (err) {
    console.error('[expo] Airtable places request failed:', err);
    return EXPO_PLACES_TAKEN;
  }
}
