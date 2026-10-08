'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export const NAV_KEY = 'mounas_in_app_nav';

/**
 * Remembers (for this tab) that the parent moved between app pages, so
 * BackButton knows "back" stays inside the app. In-app navigations don't
 * update document.referrer, so it can't be used for this.
 */
export default function NavTracker() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      window.sessionStorage.setItem(NAV_KEY, '1');
    } catch {
      /* storage unavailable: BackButton falls back to its default page */
    }
  }, [pathname]);
  return null;
}
