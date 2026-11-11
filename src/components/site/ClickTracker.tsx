'use client';

import { useEffect } from 'react';
import { track } from '@vercel/analytics';

/**
 * One listener for the whole site: records clicks on the buttons that matter
 * for signups as Vercel Web Analytics events, without touching each button.
 *   - any link to Stripe checkout   → "Essai gratuit cliqué"
 *   - any link to WhatsApp          → "WhatsApp cliqué"
 *   - any link to /demo             → "Démo cliquée"
 *   - anything with data-track="X"  → "X" (overrides the above)
 * Each event carries the page it came from.
 */
function eventFor(el: Element): string | null {
  const explicit = el.closest('[data-track]')?.getAttribute('data-track');
  if (explicit) return explicit;
  const href = el.closest('a[href]')?.getAttribute('href') ?? '';
  if (href.includes('buy.stripe.com')) return 'Essai gratuit cliqué';
  if (href.includes('wa.me/')) return 'WhatsApp cliqué';
  if (href === '/demo' || href.startsWith('/demo?') || href.startsWith('/demo#')) return 'Démo cliquée';
  return null;
}

export default function ClickTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!(e.target instanceof Element)) return;
      const name = eventFor(e.target);
      if (name) track(name, { page: window.location.pathname });
    }
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);
  return null;
}
