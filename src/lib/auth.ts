import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSession, SESSION_COOKIE, type Session } from '@/lib/session';

/**
 * Server-side session helpers for pages. proxy.ts already redirects visitors
 * without a session away from the paid routes; pages check again here so the
 * proxy is never the only line of defence.
 */

export async function getSession(): Promise<Session | null> {
  return readSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** The paywall URL, coming back to `next` after logging in. */
export function paywallUrl(next: string): string {
  return `/abonnement?next=${encodeURIComponent(next)}`;
}

export async function requireSession(next: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(paywallUrl(next));
  return session;
}
