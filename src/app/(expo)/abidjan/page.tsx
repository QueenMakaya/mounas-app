import type { Metadata } from 'next';
import Link from 'next/link';
import DiamondIcon from '@/components/brand/DiamondIcon';
import MounasLogo from '@/components/brand/MounasLogo';
import ExpoMark from '@/components/expo/ExpoMark';
import { COLORS, EXPO, EXPO_PAYMENT_LINK, EXPO_PLACES_TAKEN, GUARANTEE, GUARANTEE_DAYS, whatsappLink } from '@/lib/config';

export const metadata: Metadata = {
  title: `Les Mounas à Abidjan : ${EXPO.places} Familles Fondatrices`,
  description:
    "L'application pour apprendre à lire en 10 minutes par jour, de 3 à 8 ans, avec les mots de chez nous. Offre de lancement réservée aux 20 premières familles.",
  robots: { index: false },
};

/**
 * /abidjan: the page behind the QR code of the Abidjan roll-up, flyer and
 * screen spot. One promise, one action (WhatsApp), no site menu to wander
 * into. Written with « vous »: these parents meet the brand at a trade show.
 * The offer itself (places, price, keyword) lives in src/lib/config.ts.
 */

const WHATSAPP_MESSAGE = `${EXPO.keyword} : bonjour, je souhaite réserver une place de Famille Fondatrice.`;

const WORDS: { syllables: string[] }[] = [
  { syllables: ['AL', 'LO', 'CO'] },
  { syllables: ['AT', 'TIÉ', 'KÉ'] },
  { syllables: ['BIS', 'SAP'] },
  { syllables: ['BA', 'LA', 'FON'] },
  { syllables: ['BA', 'O', 'BAB'] },
];
const SYLLABLE_COLORS = [COLORS.red, COLORS.tealDark, COLORS.purple];

const SKILLS = [
  { color: COLORS.red, title: 'Lire', body: 'Un mot mystère par jour : les sons, les syllabes, puis le mot entier.' },
  { color: COLORS.teal, title: 'Écrire', body: 'Le cahier de dictée, pour tracer les lettres du bout du doigt.' },
  { color: COLORS.amber, title: 'Compter', body: 'Des missions de calcul et de petits problèmes à résoudre.' },
  { color: COLORS.purple, title: 'Réfléchir', body: 'Les échecs, expliqués pas à pas avec les animaux de la savane.' },
];

const INCLUDED = [
  "12 mois d'accès à toute l'app, pour toute la famille",
  'Le rituel quotidien sur WhatsApp : 10 minutes, pas plus',
  'Le suivi des progrès de votre enfant',
  'Toutes les nouveautés de l’année, sans supplément',
];

const STEPS = [
  { n: '1', title: 'Écrivez-nous', body: `Le bouton ouvre WhatsApp avec le message « ${EXPO.keyword} » déjà prêt.` },
  { n: '2', title: 'Essayez avec votre enfant', body: 'Sa première leçon est gratuite et s’ouvre d’un simple lien : rien à télécharger.' },
  { n: '3', title: 'Confirmez votre place', body: 'Convaincu·e ? Vous réglez, et votre famille est inscrite pour un an.' },
];

const FAQ = [
  {
    q: 'Faut-il télécharger une application ?',
    a: "Non, il n'y a rien à télécharger. Les Mounas s'ouvre d'un simple lien, dans le navigateur de votre téléphone, de votre tablette ou de votre ordinateur.",
  },
  {
    q: 'À quel âge commencer ?',
    a: "De 3 à 8 ans. Quelques questions suffisent pour placer votre enfant au bon niveau, et il avance ensuite à son rythme.",
  },
  {
    q: 'De quoi a-t-on besoin ?',
    a: "D'un téléphone ou d'une tablette avec Internet, et de 10 minutes par jour avec votre enfant.",
  },
  {
    q: 'Et si cela ne nous convient pas ?',
    a: `Vous avez ${GUARANTEE_DAYS} jours pour changer d'avis : un message, et nous vous remboursons.`,
  },
  {
    q: 'Les écrans, est-ce raisonnable à cet âge ?',
    a: "C'est une activité courte, faite avec vous, qui finit souvent par un dessin ou un jeu loin de l'écran. 10 minutes, puis on range le téléphone.",
  },
];

function WhatsAppButton({
  label,
  track,
  light = false,
  outline = false,
}: {
  label: string;
  track: string;
  light?: boolean;
  outline?: boolean;
}) {
  const style = outline
    ? { color: COLORS.purple, border: `2px solid ${COLORS.purple}` }
    : light
      ? { backgroundColor: COLORS.cream, color: COLORS.purple }
      : { backgroundColor: COLORS.red, color: COLORS.cream };
  return (
    <a
      href={whatsappLink(WHATSAPP_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      data-track={track}
      className={`inline-block w-full rounded-full px-8 py-4 text-center text-lg font-bold transition-opacity hover:opacity-90 sm:w-auto ${outline ? '' : 'shadow-md'}`}
      style={style}
    >
      {label}
    </a>
  );
}

export default function ExpoPage() {
  const left = EXPO.places - EXPO_PLACES_TAKEN;
  const full = left <= 0;
  const placesLine = full
    ? `Les ${EXPO.places} places sont prises`
    : EXPO_PLACES_TAKEN > 0
      ? `Il reste ${left} place${left > 1 ? 's' : ''} sur ${EXPO.places}`
      : `${EXPO.places} places, pas une de plus`;
  const cta = full ? "M'inscrire sur la liste d'attente" : 'Réserver ma place sur WhatsApp';

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.cream, color: COLORS.ink, fontFamily: 'var(--font-nunito)' }}>
      <ExpoMark />
      {/* ── TOP BAR: logo only, nothing to wander into ── */}
      <header className="px-4 pt-5 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <MounasLogo href={null} variant="wordmark" height={28} />
          <span className="text-right text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.purple }}>
            {EXPO.event || 'Abidjan'}
            {EXPO.dates && (
              <>
                <br />
                {EXPO.dates}
              </>
            )}
          </span>
        </div>
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="px-4 pb-14 pt-12 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest"
              style={{ backgroundColor: COLORS.tealLight, color: COLORS.tealDark }}
            >
              <DiamondIcon size={14} inner={COLORS.tealLight} className="shrink-0" /> L&apos;application pour apprendre à lire
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl" style={{ fontFamily: 'var(--font-fraunces)' }}>
              Votre enfant apprend à lire.
              <br />
              <span style={{ color: COLORS.red }}>En 10 minutes par jour.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg" style={{ color: 'rgba(26,26,26,0.75)' }}>
              Lire, écrire et compter de 3 à 8 ans, avec les mots de chez nous : alloco, attiéké, balafon. Une
              petite leçon à faire ensemble, sur votre téléphone.
            </p>
            <p className="mt-4 text-base font-bold" style={{ color: COLORS.purple }}>
              Offre de lancement : {placesLine.charAt(0).toLowerCase() + placesLine.slice(1)}.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/commencer"
                data-track="Expo : première leçon"
                className="w-full rounded-full px-8 py-4 text-center text-lg font-bold shadow-md transition-opacity hover:opacity-90 sm:w-auto"
                style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
              >
                ▶ Commencer sa première leçon
              </Link>
              <WhatsAppButton label={cta} track="Expo : WhatsApp (haut)" outline />
            </div>
            <p className="mt-4 text-sm" style={{ color: 'rgba(26,26,26,0.7)' }}>
              <strong style={{ color: COLORS.tealDark }}>📲 Rien à télécharger : la leçon s&apos;ouvre tout de suite, sur votre téléphone.</strong>
              <br />
              La première leçon est gratuite : pas de compte, pas de carte. 🛡️ {GUARANTEE}.
            </p>
          </div>
        </section>

        {/* ── THE HOOK: words from home ── */}
        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.amber }}>
              Des mots qui lui ressemblent
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-fraunces)' }}>
              Le premier mot qu&apos;il lira : ALLOCO.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: 'rgba(26,26,26,0.75)' }}>
              Un enfant retient ce qu&apos;il connaît et ce qu&apos;il aime. Ici, il apprend avec les mots de sa maison,
              de son marché et de sa musique.
            </p>
            <ul className="mt-8 flex flex-wrap justify-center gap-3">
              {WORDS.map((w) => (
                <li
                  key={w.syllables.join('')}
                  className="rounded-2xl px-4 py-3 text-xl font-extrabold tracking-wide sm:text-2xl"
                  style={{ backgroundColor: COLORS.cream }}
                >
                  {w.syllables.map((s, i) => (
                    <span key={i} style={{ color: SYLLABLE_COLORS[i % SYLLABLE_COLORS.length] }}>
                      {s}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── WHAT THE CHILD LEARNS + the app in action ── */}
        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto grid max-w-4xl items-center gap-8 sm:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-fraunces)' }}>
                Un rituel court, des bases solides
              </h2>
              <ul className="mt-6 grid gap-4">
                {SKILLS.map((s) => (
                  <li key={s.title} className="flex gap-4">
                    <DiamondIcon size={22} color={s.color} className="mt-1 shrink-0" />
                    <p className="text-base" style={{ color: 'rgba(26,26,26,0.75)' }}>
                      <strong style={{ color: COLORS.ink }}>{s.title}.</strong> {s.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            {/* Loads only when tapped: the hall's network is not to be trusted. */}
            <video
              controls
              playsInline
              preload="none"
              poster="/promo/demo-app/miniature.jpg"
              className="mx-auto w-full max-w-[280px] rounded-3xl shadow-lg"
              style={{ aspectRatio: '9 / 16', backgroundColor: COLORS.ink }}
              aria-label="L'app Les Mounas en une minute"
            >
              <source src="/promo/demo-app/demo-app-voix.mp4" type="video/mp4" />
            </video>
          </div>
        </section>

        {/* ── THE OFFER ── */}
        <section id="offre" className="scroll-mt-6 px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-3xl p-8 text-center sm:p-12" style={{ backgroundColor: COLORS.purple, color: COLORS.cream }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.amber }}>
              Offre de lancement · Abidjan
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-fraunces)' }}>
              {`Les ${EXPO.places} Familles Fondatrices d’Abidjan`}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base" style={{ color: 'rgba(253,246,236,0.85)' }}>
              Les {EXPO.places} premières familles qui nous écrivent rejoignent Les Mounas pour un an, à un tarif que nous
              ne proposerons plus.
            </p>

            <p className="mt-8 text-5xl font-bold sm:text-6xl" style={{ fontFamily: 'var(--font-fraunces)' }}>
              {EXPO.price}
            </p>
            <p className="mt-2 text-base" style={{ color: 'rgba(253,246,236,0.85)' }}>
              pour un an, en une fois · soit {EXPO.pricePerMonth} par mois
            </p>

            <ul className="mx-auto mt-8 grid max-w-md gap-3 text-left">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-3">
                  <DiamondIcon size={18} color={COLORS.amber} inner={COLORS.purple} className="mt-1 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col items-center gap-3">
              <WhatsAppButton label={cta} track="Expo : WhatsApp (offre)" light />
              {EXPO_PAYMENT_LINK && !full && (
                <a
                  href={EXPO_PAYMENT_LINK}
                  data-track="Expo : payer par carte"
                  className="text-sm font-bold underline underline-offset-4"
                  style={{ color: COLORS.cream }}
                >
                  Payer directement par carte
                </a>
              )}
            </div>
            <p className="mt-5 text-sm font-bold" style={{ color: COLORS.tealLight }}>
              {placesLine} · 🛡️ {GUARANTEE}
            </p>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-3xl bg-white p-6" style={{ border: '1px solid rgba(26,26,26,0.08)' }}>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-base font-extrabold"
                  style={{ backgroundColor: COLORS.tealLight, color: COLORS.tealDark }}
                >
                  {s.n}
                </span>
                <h3 className="mt-3 text-xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>
                  {s.title}
                </h3>
                <p className="mt-2 text-sm" style={{ color: 'rgba(26,26,26,0.7)' }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHERE IT COMES FROM ── */}
        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <DiamondIcon size={22} />
            <blockquote
              className="mt-4 text-2xl font-bold leading-snug sm:text-3xl"
              style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.purple }}
            >
              « Elle a lu son premier mot après quelques jours sur Les Mounas. Et elle en redemande. »
            </blockquote>
            <p className="mt-3 text-sm font-bold uppercase tracking-widest" style={{ color: 'rgba(26,26,26,0.6)' }}>
              La fondatrice, à propos de sa fille
            </p>
            <h2 className="mt-10 text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'var(--font-fraunces)' }}>
              Née à la maison, testée en famille
            </h2>
            <p className="mt-4 text-lg" style={{ color: 'rgba(26,26,26,0.75)' }}>
              Les Mounas est née du souhait d&apos;une maman : que ses enfants apprennent à lire avec des mots et des
              histoires qui leur ressemblent. Chaque activité a d&apos;abord été faite avec ses propres enfants, sous le
              regard de leur père et de leurs grands-parents, avant d&apos;arriver chez vous.
            </p>
          </div>
        </section>

        {/* ── QUESTIONS ── */}
        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto grid max-w-2xl gap-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-3xl bg-white p-5" style={{ border: '1px solid rgba(26,26,26,0.08)' }}>
                <summary className="cursor-pointer text-lg font-bold">{f.q}</summary>
                <p className="mt-3 text-base" style={{ color: 'rgba(26,26,26,0.75)' }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── LAST CALL ── */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-fraunces)' }}>
              Sa première leçon peut commencer aujourd’hui
            </h2>
            <p className="mt-3 text-base font-bold" style={{ color: COLORS.purple }}>
              {placesLine}.
            </p>
            <div className="mt-7">
              <WhatsAppButton label={cta} track="Expo : WhatsApp (bas)" />
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 pb-8 text-center text-sm sm:px-6" style={{ color: 'rgba(26,26,26,0.6)' }}>
        Les Mounas · lesmounas.school
      </footer>
    </div>
  );
}
