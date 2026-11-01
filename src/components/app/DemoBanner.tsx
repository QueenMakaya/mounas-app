'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { endDemo } from '@/app/auth-actions';
import { STRIPE_PAYMENT_LINK } from '@/lib/config';

/**
 * Thin strip under the site menu while a demo session is open
 * (src/lib/demo.ts): how long is left, the trial link, and a way out.
 * Hidden during the word itself (/app/activity) like the section buttons,
 * so a child playing the demo can't tap away from the activity.
 */

const HIDDEN = ['/app/activity'];

function minutesLeft(endsAt: number): number {
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 60_000));
}

export default function DemoBanner({ endsAt }: { endsAt: number }) {
  const pathname = usePathname() ?? '';
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(minutesLeft(endsAt));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;

  const over = left === 0;

  return (
    <div role="status" className="bg-mpurple px-4 py-2 text-cream">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-sm font-bold">
        <span>
          {over ? (
            <>⏰ La démo est terminée.</>
          ) : (
            <>
              👀 Mode démo
              {left !== null && <span className="font-semibold opacity-80"> · encore {left} min</span>}
            </>
          )}
        </span>
        {over ? (
          <Link href="/demo" className="rounded-full bg-cream px-4 py-1.5 font-extrabold text-mpurple">
            Relancer la démo
          </Link>
        ) : (
          <a href={STRIPE_PAYMENT_LINK} className="rounded-full bg-cream px-4 py-1.5 font-extrabold text-mpurple">
            Commencer l’essai gratuit
          </a>
        )}
        <form action={endDemo}>
          <button type="submit" className="underline underline-offset-4 opacity-90 hover:opacity-100">
            Quitter la démo
          </button>
        </form>
      </div>
    </div>
  );
}
