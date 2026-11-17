import type { Metadata } from 'next';
import OnboardingFlow, { type Access } from '@/components/onboarding/OnboardingFlow';
import { getSession } from '@/lib/auth';
import { isDemo } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Commencer avec Les Mounas : le premier mot de ton enfant en 1 minute',
  description:
    'Quelques questions toutes simples sur ton enfant, et son programme est prêt : le bon niveau, ses passions, le calcul et les échecs. Sans compte ni carte.',
};

/**
 * /commencer: the getting-started questionnaire (src/lib/onboarding.ts).
 * Full screen on purpose, without the site menu: one question at a time, and
 * nothing else to tap.
 */
export default async function CommencerPage() {
  const session = await getSession();
  const access: Access = !session ? 'free' : isDemo(session) ? 'demo' : 'member';

  return <OnboardingFlow access={access} />;
}
