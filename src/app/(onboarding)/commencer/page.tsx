import type { Metadata } from 'next';
import OnboardingFlow, { type Access } from '@/components/onboarding/OnboardingFlow';
import { getAllThemes } from '@/lib/airtable';
import { getSession } from '@/lib/auth';
import { isDemo } from '@/lib/demo';
import { KNOWN_THEMES } from '@/lib/themes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Commencer avec Les Mounas : le premier mot de ton enfant en 2 minutes',
  description:
    'Quelques questions toutes simples sur ton enfant, et son programme est prêt : le bon niveau, ses thèmes préférés, votre rythme. Sans compte ni carte.',
};

/**
 * /commencer: the getting-started questionnaire (src/lib/onboarding.ts).
 * Full screen on purpose, without the site menu: one question at a time, and
 * nothing else to tap.
 */
export default async function CommencerPage() {
  const [session, themes] = await Promise.all([getSession(), getAllThemes()]);
  const access: Access = !session ? 'free' : isDemo(session) ? 'demo' : 'member';

  return <OnboardingFlow themes={themes.length > 0 ? themes : KNOWN_THEMES} access={access} />;
}
