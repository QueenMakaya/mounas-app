'use client';

import { useActionState, useState } from 'react';
import { requestEbookByEmail, initialFormState } from '@/app/actions';
import { COLORS, whatsappLink } from '@/lib/config';

const WHATSAPP_MESSAGE =
  'Bonjour Les Mounas ! Je voudrais recevoir le guide gratuit « Ta maison est déjà une école ». 📖';

type Choice = 'email' | 'whatsapp';

export default function EbookSignup() {
  const [choice, setChoice] = useState<Choice>('email');
  const [state, action, pending] = useActionState(requestEbookByEmail, initialFormState);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    backgroundColor: active ? COLORS.ink : 'transparent',
    color: active ? COLORS.cream : COLORS.ink,
  });

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Choice: email or WhatsApp */}
      <div
        className="mb-6 flex rounded-full p-1"
        style={{ backgroundColor: 'rgba(26,26,26,0.06)' }}
        role="tablist"
        aria-label="Comment recevoir le guide"
      >
        <button
          type="button"
          role="tab"
          aria-selected={choice === 'email'}
          onClick={() => setChoice('email')}
          className="flex-1 rounded-full py-2 text-sm font-bold transition-colors"
          style={tabStyle(choice === 'email')}
        >
          📧 Par email
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={choice === 'whatsapp'}
          onClick={() => setChoice('whatsapp')}
          className="flex-1 rounded-full py-2 text-sm font-bold transition-colors"
          style={tabStyle(choice === 'whatsapp')}
        >
          💬 Par WhatsApp
        </button>
      </div>

      {choice === 'email' ? (
        <form action={action}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="ebook-email" className="sr-only">
              Ton adresse email
            </label>
            <input
              id="ebook-email"
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
              style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
            >
              {pending ? 'Envoi…' : 'Recevoir le guide'}
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
      ) : (
        <div className="text-center">
          <a
            href={whatsappLink(WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full px-8 py-3 font-bold shadow-md transition-opacity duration-200 hover:opacity-90"
            style={{ backgroundColor: '#25D366', color: '#FFFFFF' }}
          >
            💬 Recevoir le guide sur WhatsApp
          </a>
          <p className="mt-3 text-sm" style={{ color: 'rgba(26,26,26,0.6)' }}>
            On t&apos;envoie le guide directement dans la conversation.
          </p>
        </div>
      )}
    </div>
  );
}
