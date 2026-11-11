'use client';

import { useSyncExternalStore } from 'react';
import { CAD_TO_EUR, EUR_TO_XOF, MONTHLY_PRICE, MONTHLY_PRICE_CAD } from '@/lib/config';

type Zone = 'eur' | 'xof' | null;

// Time zones of the CFA franc (UEMOA + CEMAC) countries.
const XOF_ZONES = new Set([
  'Africa/Abidjan', 'Africa/Dakar', 'Africa/Bamako', 'Africa/Ouagadougou', 'Africa/Niamey',
  'Africa/Lome', 'Africa/Porto-Novo', 'Africa/Bissau', 'Africa/Douala', 'Africa/Libreville',
  'Africa/Brazzaville', 'Africa/Bangui', 'Africa/Ndjamena', 'Africa/Malabo',
]);

function zoneFromTimeZone(): Zone {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    if (XOF_ZONES.has(tz)) return 'xof';
    if (tz.startsWith('Europe/')) return 'eur';
  } catch {
    /* no Intl: show the CAD price only */
  }
  return null;
}

const subscribe = () => () => {};

/** Rough local equivalent, e.g. "≈ 6,50 €" or "≈ 4 250 FCFA". */
export function localEquivalent(zone: Zone): string | null {
  const eur = MONTHLY_PRICE_CAD * CAD_TO_EUR;
  if (zone === 'eur') return `≈ ${eur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  if (zone === 'xof') return `≈ ${(Math.round((eur * EUR_TO_XOF) / 50) * 50).toLocaleString('fr-FR')} FCFA`;
  return null;
}

/**
 * The monthly price ("10 $ CA/mois"), followed by a rough local equivalent for
 * parents in Europe or the CFA zone. Rendered without it on the server, then
 * filled in from the browser's time zone.
 */
export default function PriceTag({ suffix = '/mois' }: { suffix?: string }) {
  const zone = useSyncExternalStore(subscribe, zoneFromTimeZone, () => null);
  const local = localEquivalent(zone);
  return (
    <>
      {MONTHLY_PRICE}
      {suffix}
      {local && <> ({local})</>}
    </>
  );
}
