'use server';

import { track } from '@vercel/analytics/server';
import { sendGuideEmail } from '@/lib/email';
import { saveSignup, type SignupSource } from '@/lib/signups';
import type { FormState } from '@/lib/form-state';

// NOTE: this file is 'use server' — it may only export async functions.
// FormState and initialFormState therefore live in @/lib/form-state.

// Simple, permissive email check — enough to catch typos without rejecting
// valid addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handleSignup(source: SignupSource, formData: FormData, successMessage: string): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();

  if (!EMAIL_RE.test(email)) {
    return { status: 'error', message: 'Oups, cette adresse email ne semble pas valide.' };
  }

  const result = await saveSignup(email, source);

  if (result.ok) {
    await trackEvent(source === 'ebook' ? 'Guide demandé' : 'Newsletter');
    if (source === 'ebook') {
      // The form promises the guide by email: send it now. The signup is
      // already saved, so a failed send only changes the message.
      const sent = await sendGuideEmail(email);
      if (!sent.ok) {
        return {
          status: 'success',
          message: "C'est noté ! Notre email a du retard : écris-nous sur WhatsApp et on t'envoie le guide tout de suite. 📖",
        };
      }
    }
    return { status: 'success', message: successMessage };
  }

  if (result.error === 'not_configured') {
    return {
      status: 'error',
      message: "L'inscription n'est pas encore configurée. Réessaie bientôt !",
    };
  }

  return {
    status: 'error',
    message: "Un problème est survenu. Merci de réessayer dans un instant.",
  };
}

/** A Vercel Web Analytics event; never lets analytics break a signup. */
async function trackEvent(name: string): Promise<void> {
  try {
    await track(name);
  } catch (err) {
    console.warn('[analytics] event not recorded:', name, err);
  }
}

/** Newsletter / "Suivez-nous" capture. */
export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleSignup('newsletter', formData, 'Merci ! Tu es bien inscrit·e à la newsletter. 💌');
}

/** Free e-book request delivered by email. */
export async function requestEbookByEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleSignup('ebook', formData, "C'est noté ! Ton guide vient de partir : regarde ta boîte mail (et les spams). 📖");
}
