'use client';

import { useActionState } from 'react';
import { login } from '@/app/auth-actions';
import { initialLoginState } from '@/lib/login-state';
import { COLORS, STRIPE_PAYMENT_LINK } from '@/lib/config';

const inputClass = 'w-full rounded-full px-5 py-3 text-lg focus:outline-none focus:ring-2';
const inputStyle = { backgroundColor: '#FFFFFF', color: COLORS.ink, border: '1px solid rgba(26,26,26,0.2)' };

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, initialLoginState);

  return (
    <div className="mx-auto w-full max-w-md">
      {state.step === 'email' ? (
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="intent" value="request" />
          <input type="hidden" name="next" value={next} />
          <label htmlFor="login-email" className="text-left font-bold" style={{ color: COLORS.ink }}>
            Ton email ou ton numéro de téléphone
          </label>
          <input
            id="login-email"
            type="text"
            name="email"
            required
            defaultValue={state.email}
            placeholder="ton@email.com ou 514 555 1234"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className={inputClass}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full px-6 py-3 text-lg font-bold shadow-md transition-opacity disabled:opacity-60"
            style={{ backgroundColor: COLORS.purple, color: COLORS.cream }}
          >
            {pending ? 'Un instant…' : 'Recevoir mon code'}
          </button>
        </form>
      ) : (
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="email" value={state.email} />
          <label htmlFor="login-code" className="text-left font-bold" style={{ color: COLORS.ink }}>
            Le code reçu par email
          </label>
          <input
            id="login-code"
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            placeholder="123456"
            className={`${inputClass} text-center text-2xl tracking-[0.4em]`}
            style={inputStyle}
            autoFocus
          />
          <button
            type="submit"
            name="intent"
            value="verify"
            disabled={pending}
            className="rounded-full px-6 py-3 text-lg font-bold shadow-md transition-opacity disabled:opacity-60"
            style={{ backgroundColor: COLORS.purple, color: COLORS.cream }}
          >
            {pending ? 'Vérification…' : 'Me connecter'}
          </button>
          <button
            type="submit"
            name="intent"
            value="restart"
            formNoValidate
            className="text-sm font-bold underline underline-offset-4"
            style={{ color: COLORS.purple }}
          >
            Changer d&apos;adresse ou recevoir un nouveau code
          </button>
        </form>
      )}

      {state.status !== 'idle' && (
        <p
          role="status"
          className="mt-4 text-sm font-medium"
          style={{ color: state.status === 'sent' ? COLORS.tealDark : state.status === 'no_access' ? COLORS.ink : COLORS.red }}
        >
          {state.message}
        </p>
      )}

      {state.status === 'no_access' && (
        <a
          href={STRIPE_PAYMENT_LINK}
          className="mt-4 inline-block rounded-full px-8 py-4 text-lg font-bold shadow-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
        >
          Commencer l&apos;essai gratuit
        </a>
      )}
    </div>
  );
}
