import { NextResponse, type NextRequest } from 'next/server';
import {
  readSession,
  refreshSession,
  RECHECK_AFTER_MS,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from '@/lib/session';
import { checkoutAccess, findAccess } from '@/lib/subscription';

/**
 * Runs before every /app/* request (Next 16 "proxy", formerly middleware).
 *
 * 1. /app/bienvenue?session_id=cs_... (Stripe's after-payment redirect): logs
 *    the parent in straight away, then drops the id from the URL.
 * 2. Sessions older than 24 h are re-checked with Stripe. No active or
 *    trialing subscription anymore: session cleared, off to /abonnement.
 *    If Stripe can't be reached, the session is kept and retried next time.
 * 3. Paid routes without a session go to the paywall. Pages check again
 *    server-side (src/lib/auth.ts); /app/activity is gated in its page, since
 *    only Airtable knows which word is today's (free) one.
 */

const PAID_PREFIXES = ['/app/select', '/app/dictee', '/app/progres', '/app/compte', '/app/missions'];

function isPaid(pathname: string): boolean {
  return PAID_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function paywall(req: NextRequest): NextResponse {
  const url = new URL('/abonnement', req.url);
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. Arriving from Stripe Checkout.
  const checkoutId = pathname === '/app/bienvenue' ? searchParams.get('session_id') : null;
  if (checkoutId) {
    const clean = new URL('/app/bienvenue', req.url);
    const paid = await checkoutAccess(checkoutId);
    const token = paid ? await signSession(paid.email, paid.customerId) : null;
    if (!token) {
      // Couldn't confirm the payment: they can still log in with their email.
      clean.searchParams.set('connexion', '1');
      return NextResponse.redirect(clean);
    }
    const res = NextResponse.redirect(clean);
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  }

  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await readSession(raw);

  // 2. Daily re-check with Stripe.
  if (session && Date.now() - session.checkedAt > RECHECK_AFTER_MS) {
    const access = await findAccess(session.email);
    if (access.status === 'none') {
      const url = new URL('/abonnement', req.url);
      url.searchParams.set('fin', '1');
      const res = NextResponse.redirect(url);
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    if (access.status === 'active') {
      const token = await refreshSession(session, access.customerId);
      const res = NextResponse.next();
      if (token) res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
      return res;
    }
    // Stripe unreachable: keep the session for now.
  }

  // 3. Paywall for the paid routes.
  if (!session && isPaid(pathname)) {
    const res = paywall(req);
    if (raw) res.cookies.delete(SESSION_COOKIE); // expired or tampered
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
