'use client';

import { sourceLabel } from '@/lib/visit';

/**
 * Browser side of src/lib/funnel-log.ts: sends one sign-up step to
 * /api/parcours with sendBeacon, which still goes out when the page is
 * leaving (for Stripe or the first word). Never throws, never waits.
 */

export type FunnelStep = {
  event: 'start' | 'finish' | 'trial';
  access?: string;
  age?: string;
  level?: string;
  math?: string;
  chess?: string;
  interests?: string[];
};

/** Where this visit came from: the referrer and utm tags of the landing page, kept for the visit. */
function visitSource(): string {
  try {
    const saved = window.sessionStorage.getItem('mounas_source');
    if (saved) return saved;
    const params = new URLSearchParams(window.location.search);
    const label = sourceLabel(document.referrer, {
      source: params.get('utm_source') ?? undefined,
      campaign: params.get('utm_campaign') ?? undefined,
    });
    window.sessionStorage.setItem('mounas_source', label);
    return label;
  } catch {
    return '';
  }
}

export function sendFunnelStep(step: FunnelStep): void {
  try {
    const body = JSON.stringify({ ...step, page: window.location.pathname, source: visitSource() });
    const blob = new Blob([body], { type: 'application/json' });
    if (!navigator.sendBeacon?.('/api/parcours', blob)) {
      void fetch('/api/parcours', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch {
    // Tracking must never get in the way of a parent.
  }
}

/** Call once early on each page so the visit's origin is remembered before internal links replace the referrer. */
export function rememberVisitSource(): void {
  visitSource();
}
