'use client';

import { useRouter } from 'next/navigation';
import { NAV_KEY } from '@/components/app/NavTracker';

/**
 * "← Retour": goes back to the page the parent came from (the end of an
 * activity, the home page…). When there is nothing to go back to inside the
 * app — the page was opened from a link or a fresh tab — it goes to `fallback`.
 */
export default function BackButton({ fallback = '/app', label = 'Retour' }: { fallback?: string; label?: string }) {
  const router = useRouter();

  const goBack = () => {
    let cameFromApp = false;
    try {
      cameFromApp = window.history.length > 1 && window.sessionStorage.getItem(NAV_KEY) === '1';
    } catch {
      cameFromApp = false;
    }
    if (cameFromApp) router.back();
    else router.push(fallback);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-ink hover:bg-ink/5"
    >
      <span aria-hidden="true">←</span> {label}
    </button>
  );
}
