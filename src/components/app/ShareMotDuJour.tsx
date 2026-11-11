'use client';

import { useEffect } from 'react';
import { track } from '@vercel/analytics';
import { MOT_DU_JOUR_SHORT_URL } from '@/lib/config';

const MESSAGE =
  `Le mot mystère du jour des Mounas 🌍 Ton enfant arrivera-t-il à le lire ? ` +
  `10 minutes, gratuit : ${MOT_DU_JOUR_SHORT_URL}?s=partage`;

/**
 * "Share with another parent" button on today's word. Opens WhatsApp's contact
 * picker with a message that never gives the word away and links back through
 * /jour, so each share shows up in Vercel Analytics as utm_source=partage.
 * Also records the arrival of a parent who came from the card or a share.
 */
export default function ShareMotDuJour() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('utm_campaign') === 'mot-du-jour') {
        track('Arrivée via le mot du jour', { source: params.get('utm_source') ?? 'inconnue' });
      }
    } catch {
      /* analytics is best-effort */
    }
  }, []);
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(MESSAGE)}`}
      target="_blank"
      rel="noopener noreferrer"
      data-track="Mot du jour partagé"
      className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-base font-extrabold text-white shadow-md active:scale-[0.98]"
    >
      <span aria-hidden="true">💬</span> Envoyer le mot mystère à une autre famille
    </a>
  );
}

