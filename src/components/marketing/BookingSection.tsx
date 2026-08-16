import { BOOKING_URL, COLORS, whatsappLink } from '@/lib/config';

const WHATSAPP_MESSAGE =
  'Bonjour Les Mounas ! Je souhaite réserver l’appel gratuit de 20 minutes. 🗓️';

/**
 * Free 20-minute consultation booking.
 *
 * Set NEXT_PUBLIC_BOOKING_URL to your Calendly or Cal.com link:
 *   - Calendly: https://calendly.com/<you>/20min
 *   - Cal.com:  https://cal.com/<you>/20min
 *
 * When set, we embed the scheduler inline (both tools allow iframe embedding of
 * their scheduling pages) with a button fallback. When it isn't set we fall back
 * to booking over WhatsApp — visitors always get a working way to reach us,
 * never a dead link or a setup note meant for us.
 */
export default function BookingSection() {
  const configured = BOOKING_URL.length > 0;

  return (
    <section
      id="consultation"
      className="scroll-mt-24 rounded-3xl p-8 sm:p-10"
      style={{ backgroundColor: COLORS.tealLight }}
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.tealDark }}>
          Accompagnement
        </p>
        <h2
          className="mt-3 text-3xl font-bold sm:text-4xl"
          style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
        >
          Réserve un appel gratuit de 20 minutes
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: 'rgba(26,26,26,0.75)' }}>
          Tu veux des conseils pour construire la routine quotidienne de ton enfant&nbsp;? On en
          parle ensemble, gratuitement et sans engagement.
        </p>
      </div>

      {configured ? (
        <div className="mx-auto mt-8 max-w-2xl">
          <div
            className="overflow-hidden rounded-2xl"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(26,26,26,0.1)' }}
          >
            <iframe
              src={BOOKING_URL}
              title="Réserver un appel de 20 minutes"
              className="h-[640px] w-full"
              style={{ border: 'none' }}
            />
          </div>
          <div className="mt-4 text-center">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold underline"
              style={{ color: COLORS.tealDark }}
            >
              Ouvrir le calendrier dans un nouvel onglet →
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center">
          <a
            href={whatsappLink(WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full px-8 py-4 text-lg font-bold shadow-md transition-opacity duration-200 hover:opacity-90"
            style={{ backgroundColor: COLORS.tealDark, color: COLORS.cream }}
          >
            💬 Réserver mon appel sur WhatsApp
          </a>
          <p className="mt-3 text-sm" style={{ color: 'rgba(26,26,26,0.6)' }}>
            On convient ensemble d&apos;un créneau qui t&apos;arrange.
          </p>
        </div>
      )}
    </section>
  );
}
