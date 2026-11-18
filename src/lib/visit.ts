/**
 * Small helpers shared by the server (src/lib/demo-log.ts,
 * src/lib/funnel-log.ts) and the browser (src/lib/funnel-client.ts) to
 * describe a visit without anything personal: the kind of device and where
 * the visitor came from.
 */

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
