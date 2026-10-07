import type { Metadata } from 'next';
import { Andika, Playwrite_FR_Trad } from 'next/font/google';
import SiteHeader from '@/components/site/SiteHeader';

// Andika was designed for children learning to read (single-storey "a",
// clear b/d/p/q). Playwrite FR Trad is the French school cursive taught in
// CP — used for the tracing guides and the dictation notebook.
const andika = Andika({
  weight: ['400', '700'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-read',
  display: 'swap',
});
const cursive = Playwrite_FR_Trad({
  variable: '--font-cursive',
  display: 'swap',
});

// Opened from the home screen (see src/app/manifest.ts), the app runs
// full-screen on iPhone too, with the Mounas logo as its icon.
export const metadata: Metadata = {
  appleWebApp: { capable: true, title: 'Les Mounas', statusBarStyle: 'default' },
  icons: { apple: '/logo-mounas.png' },
};

/**
 * Layout for the daily-word app (/app/*).
 *
 * Keeps the site menu (SiteHeader) pinned on every app screen so a visitor who
 * came in from the marketing site can always navigate back — the app is a
 * section of the site, not a dead end. The header is `sticky`, so it stays put
 * while the activity scrolls.
 *
 * The cream wrapper fills the viewport so short screens never show the
 * default body background underneath.
 *
 * If you ever want the app to run standalone (opened in its own browser tab,
 * no site chrome), link to it with target="_blank" from the marketing header —
 * that "forced" tab gets the full-screen app without this menu.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${andika.variable} ${cursive.variable} flex min-h-screen flex-1 flex-col bg-cream text-ink`}>
      <SiteHeader />
      {children}
    </div>
  );
}
