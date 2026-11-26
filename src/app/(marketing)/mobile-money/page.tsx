import type { Metadata } from 'next';
import MobileMoneyTrial from '@/components/marketing/MobileMoneyTrial';
import { COLORS, GUARANTEE, TRIAL_DAYS } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Essai gratuit sans carte, Mobile Money | Les Mounas',
  description: `Pas de carte bancaire ? Essaie Les Mounas ${TRIAL_DAYS} jours gratuitement, puis continue avec Wave, Orange Money ou MTN MoMo.`,
};

const STEPS = [
  { emoji: '📝', text: 'Tu remplis ce petit formulaire : ton essai s’ouvre tout de suite.' },
  { emoji: '📧', text: 'Tu te connectes avec ton email : un code à 6 chiffres, pas de mot de passe.' },
  { emoji: '💬', text: `Avant la fin des ${TRIAL_DAYS} jours, Pam t’écrit sur WhatsApp pour continuer.` },
  { emoji: '📱', text: 'Tu paies par Mobile Money si tu veux continuer. Sinon, l’essai s’arrête tout seul.' },
];

export default function MobileMoneyPage() {
  return (
    <main className="px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-2xl text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest"
          style={{ backgroundColor: COLORS.tealLight, color: COLORS.tealDark }}
        >
          Sans carte bancaire
        </span>
        <h1
          className="mt-5 text-4xl font-bold leading-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-fraunces)', color: COLORS.ink }}
        >
          {TRIAL_DAYS} jours gratuits, puis Mobile Money
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: 'rgba(26,26,26,0.75)' }}>
          Pas de carte ? Pas de souci. Essaie toute l’app avec ton enfant, et continue ensuite avec Wave, Orange Money
          ou MTN MoMo.
        </p>

        <ol className="mx-auto mt-8 grid max-w-xl gap-3 text-left">
          {STEPS.map((s) => (
            <li key={s.text} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
              <span className="text-2xl" aria-hidden="true">
                {s.emoji}
              </span>
              <span className="font-semibold" style={{ color: COLORS.ink }}>
                {s.text}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <MobileMoneyTrial />
        </div>

        <p className="mt-6 text-sm font-bold" style={{ color: COLORS.tealDark }}>
          🛡️ {GUARANTEE}. Rien n’est prélevé sans toi.
        </p>
      </div>
    </main>
  );
}
