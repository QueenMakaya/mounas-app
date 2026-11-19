import { EXPO, GUARANTEE } from '@/lib/config';

/**
 * The Abidjan launch offer, shown in place of the standard trial to families who came
 * through /abidjan (see src/lib/expo-client.ts). Sends them back to the offer.
 */
export default function ExpoOffer({
  className = '',
  title = 'Votre offre de lancement vous attend',
}: {
  className?: string;
  title?: string;
}) {
  return (
    <section className={`rounded-[28px] bg-mpurple p-6 text-center text-cream shadow-lg ${className}`}>
      <h2 className="font-display text-2xl font-bold leading-tight">{title}</h2>
      <p className="mt-2 text-sm text-cream/90">
        Les {EXPO.places} Familles Fondatrices d’Abidjan : un an de Mounas pour {EXPO.price}.
      </p>
      <a
        href="/abidjan#offre"
        data-track="Expo : retour à l'offre"
        className="mt-5 flex min-h-14 items-center justify-center rounded-full bg-cream px-6 text-center text-lg font-extrabold text-mpurple shadow-md active:scale-[0.98]"
      >
        Réserver ma place
      </a>
      <p className="mt-3 text-sm font-extrabold">🛡️ {GUARANTEE}</p>
    </section>
  );
}
