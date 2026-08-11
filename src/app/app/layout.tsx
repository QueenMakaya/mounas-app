import SiteHeader from '@/components/site/SiteHeader';

/**
 * Layout for the daily-word app (/app/*).
 *
 * Keeps the site menu (SiteHeader) pinned on every app screen so a visitor who
 * came in from the marketing site can always navigate back — the app is a
 * section of the site, not a dead end. The header is `sticky`, so it stays put
 * while the activity scrolls.
 *
 * If you ever want the app to run standalone (opened in its own browser tab,
 * no site chrome), link to it with target="_blank" from the marketing header —
 * that "forced" tab gets the full-screen app without this menu.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
