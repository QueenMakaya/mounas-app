/**
 * Demo mode: lets a new parent (or Pam, during a presentation) open the whole
 * subscriber area for a limited time, without Stripe or an email code.
 *
 * Started from /demo (src/app/(marketing)/demo/page.tsx). It is an ordinary
 * signed session cookie (src/lib/session.ts) with a fixed demo identity and a
 * short expiry, so every page that checks the session works unchanged. What a
 * demo session never does:
 *   - sync progress to Airtable (no ProgressSync, the API answers 403);
 *   - get re-checked with Stripe (proxy.ts) or open the billing portal.
 *
 * Set DEMO_ENABLED=false to turn the demo link off.
 */

import type { Session } from '@/lib/session';

export const DEMO_EMAIL = 'demo@lesmounas.school';
export const DEMO_CUSTOMER_ID = 'demo';
/** How long a demo lasts. */
export const DEMO_MINUTES = 60;

export function demoEnabled(): boolean {
  const value = (process.env.DEMO_ENABLED ?? '').trim().toLowerCase();
  return !['false', '0', 'no', 'non', 'off'].includes(value);
}

export function isDemo(session: Pick<Session, 'customerId'> | null | undefined): boolean {
  return session?.customerId === DEMO_CUSTOMER_ID;
}
