'use server';

import { saveSignup, type SignupSource } from '@/lib/signups';

export type FormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export const initialFormState: FormState = { status: 'idle', message: '' };

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

/** Newsletter / "Suivez-nous" capture. */
export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleSignup('newsletter', formData, 'Merci ! Tu es bien inscrit·e à la newsletter. 💌');
}

/** Free e-book request delivered by email. */
export async function requestEbookByEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  return handleSignup('ebook', formData, "C'est noté ! Ton guide arrive par email très vite. 📖");
}
