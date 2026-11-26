'use client';

import Link from 'next/link';
import { useActionState, useSyncExternalStore } from 'react';
import { requestMobileMoneyTrial } from '@/app/mobile-money-actions';
import { COLORS, MOBILE_MONEY, whatsappLink } from '@/lib/config';
import { initialMobileMoneyState } from '@/lib/form-state';

const inputClass = 'w-full rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2';
const inputStyle = { backgroundColor: '#FFFFFF', color: COLORS.ink, border: '1px solid rgba(26,26,26,0.2)' };
const labelClass = 'mb-1 block text-left text-sm font-bold';

/** Where the visit came from, remembered by src/lib/funnel-client.ts. */
function visitSource(): string {
  try {
    return window.sessionStorage.getItem('mounas_source') ?? '';
  } catch {
    return '';
  }
}
const noSubscribe = () => () => {};

const AGES = ['0–2 ans', '3–4 ans', '5–6 ans', '7–8 ans', '9 ans et +'];

/** The no-card trial form on /mobile-money. */
export default function MobileMoneyTrial() {
  const [state, action, pending] = useActionState(requestMobileMoneyTrial, initialMobileMoneyState);
  const source = useSyncExternalStore(noSubscribe, visitSource, () => '');

  if (state.status === 'success' && state.email) {
    return (
      <div className="mx-auto w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-sm">
        <p className="text-4xl" aria-hidden="true">
          🎉
        </p>
        <p role="status" className="mt-3 text-lg font-bold" style={{ color: COLORS.ink }}>
          {state.message}
        </p>
        <p className="mt-3 text-base" style={{ color: 'rgba(26,26,26,0.75)' }}>
          Connecte-toi avec <b>{state.email}</b> : tu reçois un code à 6 chiffres par email (regarde aussi dans les
          indésirables).
        </p>
        <Link
          href="/connexion?next=/app"
          className="mt-6 flex min-h-12 items-center justify-center rounded-full px-6 text-lg font-bold shadow-md"
          style={{ backgroundColor: COLORS.purple, color: COLORS.cream }}
        >
          Me connecter maintenant
        </Link>
        <p className="mt-4 text-sm" style={{ color: 'rgba(26,26,26,0.7)' }}>
          Avant la fin de l’essai, Pam t’écrit sur WhatsApp pour continuer par Mobile Money.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-[28px] bg-white p-6 shadow-sm">
      <input type="hidden" name="source" value={source} />
      {/* Left empty by people; robots fill it in. */}
      <div aria-hidden="true" className="hidden">
        <label>
          Site web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="mm-name" className={labelClass} style={{ color: COLORS.ink }}>
          Ton prénom et ton nom
        </label>
        <input id="mm-name" name="name" required autoComplete="name" className={inputClass} style={inputStyle} />
      </div>

      <div>
        <label htmlFor="mm-email" className={labelClass} style={{ color: COLORS.ink }}>
          Ton adresse email
        </label>
        <input
          id="mm-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="ton@email.com"
          className={inputClass}
          style={inputStyle}
        />
        <p className="mt-1 text-left text-xs" style={{ color: 'rgba(26,26,26,0.65)' }}>
          C’est avec elle que tu te connectes : ton code d’entrée arrive par email.
        </p>
      </div>

      <div>
        <label htmlFor="mm-whatsapp" className={labelClass} style={{ color: COLORS.ink }}>
          Ton numéro WhatsApp
        </label>
        <input
          id="mm-whatsapp"
          name="whatsapp"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+225 07 00 00 00 00"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mm-country" className={labelClass} style={{ color: COLORS.ink }}>
            Ton pays
          </label>
          <select id="mm-country" name="country" required defaultValue="" className={inputClass} style={inputStyle}>
            <option value="" disabled>
              Choisir…
            </option>
            {MOBILE_MONEY.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mm-age" className={labelClass} style={{ color: COLORS.ink }}>
            Âge de l’enfant
          </label>
          <select id="mm-age" name="childAge" defaultValue="" className={inputClass} style={inputStyle}>
            <option value="">Facultatif</option>
            {AGES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={labelClass} style={{ color: COLORS.ink }}>
          Pour payer ensuite, tu préfères :
        </legend>
        <div className="flex flex-wrap gap-2">
          {MOBILE_MONEY.operators.map((op, i) => (
            <label
              key={op}
              className="flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold has-[:checked]:ring-2"
              style={{ border: '1px solid rgba(26,26,26,0.2)', color: COLORS.ink }}
            >
              <input type="radio" name="operator" value={op} defaultChecked={i === 0} />
              {op}
            </label>
          ))}
        </div>
      </fieldset>

      {state.status === 'error' && (
        <p role="alert" className="rounded-2xl px-4 py-3 text-left text-sm font-bold" style={{ backgroundColor: '#FDE8EA', color: '#9B1C28' }}>
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-full px-6 py-3 text-lg font-bold shadow-md transition-opacity disabled:opacity-60"
        style={{ backgroundColor: COLORS.red, color: COLORS.cream }}
      >
        {pending ? 'Un instant…' : 'Ouvrir mon essai gratuit'}
      </button>

      <a
        href={whatsappLink('Bonjour Les Mounas ! Je voudrais essayer l’app et payer par Mobile Money. 📱')}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-sm font-semibold underline underline-offset-4"
        style={{ color: 'rgba(26,26,26,0.7)' }}
      >
        Plutôt écrire sur WhatsApp ?
      </a>
    </form>
  );
}
