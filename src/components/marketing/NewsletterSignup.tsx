'use client';

import { useActionState } from 'react';
import { subscribeNewsletter } from '@/app/actions';
import { initialFormState } from '@/lib/form-state';
import { COLORS } from '@/lib/config';

export default function NewsletterSignup() {
  const [state, action, pending] = useActionState(subscribeNewsletter, initialFormState);

  return (
    <form action={action} className="mx-auto w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Ton adresse email
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          placeholder="ton@email.com"
          autoComplete="email"
          className="flex-1 rounded-full px-5 py-3 focus:outline-none focus:ring-2"
          style={{ backgroundColor: '#FFFFFF', color: COLORS.ink, border: '1px solid rgba(26,26,26,0.2)' }}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full px-6 py-3 font-bold shadow-md transition-opacity duration-200 disabled:opacity-60"
          style={{ backgroundColor: COLORS.purple, color: COLORS.cream }}
        >
          {pending ? 'Envoi…' : "S'inscrire"}
        </button>
      </div>

      {state.status !== 'idle' && (
        <p
          role="status"
          className="mt-3 text-sm font-medium"
          style={{ color: state.status === 'success' ? COLORS.tealDark : COLORS.red }}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
