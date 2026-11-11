import { NextResponse, type NextRequest } from 'next/server';

/**
 * lesmounas.school/jour: the short link printed on the Mot du Jour card and in
 * WhatsApp shares. It sends parents to today's free word with UTM tags, so
 * Vercel Analytics shows how many visits the card brings in.
 *
 * Optional ?s=<source> says where the link was posted, e.g. /jour?s=tiktok,
 * /jour?s=status. Default: whatsapp (the card forwarded in family groups).
 */
const SOURCE = /^[a-z0-9-]{1,30}$/;

export function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('s')?.toLowerCase() ?? '';
  const source = SOURCE.test(raw) ? raw : 'whatsapp';
  const url = new URL('/app', req.url);
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', 'carte');
  url.searchParams.set('utm_campaign', 'mot-du-jour');
  return NextResponse.redirect(url, 307);
}
