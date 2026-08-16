import Link from 'next/link';
import MounasLogo from '@/components/brand/MounasLogo';
import DiamondIcon from '@/components/brand/DiamondIcon';
import { COLORS } from '@/lib/config';

export default function SiteFooter() {
  const year = 2025;

  return (
    <footer style={{ backgroundColor: COLORS.ink, color: COLORS.cream }}>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            {/* Real logo lockup: MOUNAS wordmark + glyph frieze, transparent on the dark footer */}
            <MounasLogo href="/" variant="lockup" height={52} />
            <p className="mt-4 text-sm" style={{ color: 'rgba(253,246,236,0.7)' }}>
              Le français en s&apos;amusant, pour les familles de la diaspora et leurs enfants de 0 à
              6 ans. Directement sur WhatsApp.
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <span className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(253,246,236,0.5)' }}>
              Navigation
            </span>
            <Link href="/" className="hover:opacity-70" style={{ color: COLORS.cream }}>
              Accueil
            </Link>
            <Link href="/blog" className="hover:opacity-70" style={{ color: COLORS.cream }}>
              Blog
            </Link>
            <Link href="/#consultation" className="hover:opacity-70" style={{ color: COLORS.cream }}>
              Consultation gratuite
            </Link>
            <Link href="/connect" className="hover:opacity-70" style={{ color: COLORS.cream }}>
              Restons connectés
            </Link>
            <Link href="/#english" className="hover:opacity-70" style={{ color: COLORS.cream }}>
              In English
            </Link>
            <Link href="/app" className="hover:opacity-70" style={{ color: COLORS.cream }}>
              L&apos;app quotidienne
            </Link>
          </nav>
        </div>

        <div
          className="mt-10 flex items-center justify-center gap-2 border-t pt-6 text-center text-xs"
          style={{ borderColor: 'rgba(253,246,236,0.15)', color: 'rgba(253,246,236,0.6)' }}
        >
          <DiamondIcon size={12} inner={COLORS.ink} />
          <span>Les Mounas · lesmounas.school · {year}</span>
        </div>
      </div>
    </footer>
  );
}
