'use server';

import { randomInt, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { sendLoginCode } from '@/lib/email';
import type { LoginState } from '@/lib/login-state';
import {
  keyedHash,
  LOGIN_COOKIE,
  LOGIN_MAX_AGE,
  loginCookieOptions,
  readPendingLogin,
  readSession,
  safeNext,
  SESSION_COOKIE,
  sessionCookieOptions,
  signPendingLogin,
  signSession,
} from '@/lib/session';
import { createPortalUrl, findAccess, readLoginCode, saveLoginCode } from '@/lib/subscription';

// NOTE: this file is 'use server': it may only export async functions.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTEMPTS = 5;
/** Don't send a new email if the last code went out less than this long ago. */
const RESEND_AFTER_MS = 60 * 1000;

const PROBLEM = 'Un problème est survenu. Merci de réessayer dans un instant.';

function codeHash(customerId: string, code: string) {
  return keyedHash(`login:${customerId}:${code}`);
}

function sameHex(a: string, b: string): boolean {
  return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function requestCode(email: string): Promise<LoginState> {
  const base = { step: 'email' as const, email };
  if (!EMAIL_RE.test(email)) {
    return { ...base, status: 'error', message: 'Oups, cette adresse email ne semble pas valide.' };
  }

  const access = await findAccess(email);
  if (access.status === 'error') return { ...base, status: 'error', message: PROBLEM };
  if (access.status === 'none') {
    return {
      ...base,
      status: 'no_access',
      message: "On ne trouve pas d'abonnement actif avec cette adresse. Tu peux commencer ton essai gratuit de 7 jours !",
    };
  }

  const { customerId } = access;
  const pending = await signPendingLogin(email, customerId);
  if (!pending) return { ...base, status: 'error', message: PROBLEM };

  // A code sent less than a minute ago is still on its way: don't spam.
  const current = await readLoginCode(customerId);
  const now = Date.now();
  const recent = current && current !== 'error' && current.exp - LOGIN_MAX_AGE * 1000 + RESEND_AFTER_MS > now;

  if (!recent) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const hash = await codeHash(customerId, code);
    if (!hash || !(await saveLoginCode(customerId, { hash, exp: now + LOGIN_MAX_AGE * 1000, attempts: 0 }))) {
      return { ...base, status: 'error', message: PROBLEM };
    }
    const sent = await sendLoginCode(email, code);
    if (!sent.ok) {
      return { ...base, status: 'error', message: "On n'a pas réussi à t'envoyer le code. Réessaie dans un instant." };
    }
  }

  (await cookies()).set(LOGIN_COOKIE, pending, loginCookieOptions);
  return {
    step: 'code',
    email,
    status: 'sent',
    message: `On vient de t'envoyer un code à 6 chiffres à ${email}. Pense à regarder dans tes indésirables.`,
  };
}

async function verifyCode(rawCode: string, next: string): Promise<LoginState> {
  const store = await cookies();
  const pending = await readPendingLogin(store.get(LOGIN_COOKIE)?.value);
  const expired: LoginState = {
    step: 'email',
    email: pending?.email ?? '',
    status: 'error',
    message: 'Ce code a expiré. Demande un nouveau code.',
  };
  if (!pending) return expired;

  const retry = (message: string): LoginState => ({ step: 'code', email: pending.email, status: 'error', message });
  const code = rawCode.replace(/\D/g, '');
  if (code.length !== 6) return retry('Le code contient 6 chiffres.');

  const state = await readLoginCode(pending.customerId);
  if (state === 'error') return retry(PROBLEM);
  if (!state || state.exp < Date.now()) {
    store.delete({ name: LOGIN_COOKIE, path: loginCookieOptions.path });
    return expired;
  }
  if (state.attempts >= MAX_ATTEMPTS) {
    await saveLoginCode(pending.customerId, null);
    store.delete({ name: LOGIN_COOKIE, path: loginCookieOptions.path });
    return { ...expired, message: 'Trop de tentatives. Demande un nouveau code.' };
  }

  const hash = await codeHash(pending.customerId, code);
  if (!hash) return retry(PROBLEM);

  if (!sameHex(hash, state.hash)) {
    const attempts = state.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await saveLoginCode(pending.customerId, null);
      store.delete({ name: LOGIN_COOKIE, path: loginCookieOptions.path });
      return { ...expired, message: 'Trop de tentatives. Demande un nouveau code.' };
    }
    await saveLoginCode(pending.customerId, { ...state, attempts });
    const left = MAX_ATTEMPTS - attempts;
    return retry(`Ce code ne correspond pas. Il te reste ${left} essai${left > 1 ? 's' : ''}.`);
  }

  // Right code: one use only.
  await saveLoginCode(pending.customerId, null);
  const session = await signSession(pending.email.toLowerCase(), pending.customerId);
  if (!session) return retry(PROBLEM);
  store.delete({ name: LOGIN_COOKIE, path: loginCookieOptions.path });
  store.set(SESSION_COOKIE, session, sessionCookieOptions);
  redirect(safeNext(next));
}

/** /connexion form: ask for a code, check it, or start over. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const intent = String(formData.get('intent') ?? '');
  const email = String(formData.get('email') ?? '').trim();
  const next = safeNext(formData.get('next'));

  if (intent === 'verify') return verifyCode(String(formData.get('code') ?? ''), next);
  if (intent === 'restart') {
    (await cookies()).delete({ name: LOGIN_COOKIE, path: loginCookieOptions.path });
    return { step: 'email', email, status: 'idle', message: '' };
  }
  return requestCode(email);
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/app');
}

/** "Gérer mon abonnement": off to the Stripe Billing Portal, back to /app. */
export async function openBillingPortal(): Promise<void> {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect('/connexion?next=/app');

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'www.lesmounas.school';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const url = await createPortalUrl(session.customerId, `${proto}://${host}/app`);
  redirect(url ?? '/app/compte?portail=indisponible');
}
