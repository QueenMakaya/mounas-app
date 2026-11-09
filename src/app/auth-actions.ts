'use server';

import { randomInt, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { track } from '@vercel/analytics/server';
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
  signDemoSession,
  signSession,
} from '@/lib/session';
import { DEMO_CUSTOMER_ID, DEMO_EMAIL, DEMO_MINUTES, demoEnabled, demoLevelForAge, isDemo } from '@/lib/demo';
import { getActivitiesByFilters, getTodayActivity } from '@/lib/airtable';
import { createPortalUrl, findAccess, findAccessByPhone, normalizePhone, readLoginCode, saveLoginCode } from '@/lib/subscription';

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

/** "c•••@hotmail.com": enough for the parent to recognise their own address. */
function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 1)}•••@${domain}`;
}

/**
 * The parent types their email or the phone number they gave at checkout.
 * Either way the code goes to the subscription's email: a phone number only
 * helps find the account.
 */
async function requestCode(identifier: string): Promise<LoginState> {
  const base = { step: 'email' as const, email: identifier };
  const byPhone = !identifier.includes('@');
  let email: string;
  let customerId: string;

  if (byPhone) {
    const phone = normalizePhone(identifier);
    if (!phone) {
      return { ...base, status: 'error', message: 'Oups, ce numéro ou cette adresse email ne semble pas valide.' };
    }
    const access = await findAccessByPhone(phone);
    if (access.status === 'error') return { ...base, status: 'error', message: PROBLEM };
    if (access.status === 'none') {
      return {
        ...base,
        status: 'no_access',
        message:
          "On ne trouve pas d'abonnement actif avec ce numéro. Essaie avec ton adresse email, ou commence ton essai gratuit de 14 jours !",
      };
    }
    if (!access.email) {
      return {
        ...base,
        status: 'error',
        message: "Ton abonnement n'a pas d'adresse email. Écris-nous sur WhatsApp, on t'aide tout de suite.",
      };
    }
    email = access.email.toLowerCase();
    customerId = access.customerId;
  } else {
    if (!EMAIL_RE.test(identifier)) {
      return { ...base, status: 'error', message: 'Oups, cette adresse email ne semble pas valide.' };
    }
    const access = await findAccess(identifier);
    if (access.status === 'error') return { ...base, status: 'error', message: PROBLEM };
    if (access.status === 'none') {
      return {
        ...base,
        status: 'no_access',
        message:
          "On ne trouve pas d'abonnement actif avec cette adresse. Essaie avec ton numéro de téléphone, ou commence ton essai gratuit de 14 jours !",
      };
    }
    email = identifier;
    customerId = access.customerId;
  }

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
    email: identifier,
    status: 'sent',
    message: `On vient de t'envoyer un code à 6 chiffres à ${byPhone ? maskEmail(email) : email}. Pense à regarder dans tes indésirables.`,
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
  if (isDemo(session)) redirect('/abonnement');

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'www.lesmounas.school';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const url = await createPortalUrl(session.customerId, `${proto}://${host}/app`);
  redirect(url ?? '/app/compte?portail=indisponible');
}

/** /demo: opens the whole app for DEMO_MINUTES, no account (src/lib/demo.ts). */
export async function startDemo(formData?: FormData): Promise<void> {
  if (!demoEnabled()) redirect('/demo?indisponible=1');
  const store = await cookies();
  const current = await readSession(store.get(SESSION_COOKIE)?.value);
  // A real subscriber keeps their own session.
  if (current && !isDemo(current)) redirect('/app');

  const token = await signDemoSession(DEMO_EMAIL, DEMO_CUSTOMER_ID, DEMO_MINUTES);
  if (!token) redirect('/demo?indisponible=1');
  store.set(SESSION_COOKIE, token, { ...sessionCookieOptions, maxAge: DEMO_MINUTES * 60 });
  try {
    await track('Démo lancée');
  } catch (err) {
    console.warn('[analytics] event not recorded: Démo lancée', err);
  }
  // With an age (the buttons on /demo), the child lands straight in a word of
  // the right level: no home page, no extra click before playing.
  const level = demoLevelForAge(String(formData?.get('age') ?? ''));
  if (level) {
    const wordId = await demoWordFor(level);
    if (wordId) redirect(`/app/activity?id=${encodeURIComponent(wordId)}`);
  }
  redirect('/app');
}

/** Today's word if it has this level, else a word of this level that changes each day. */
async function demoWordFor(level: string): Promise<string | null> {
  try {
    const today = await getTodayActivity();
    if (today?.difficulty === level) return today.id;
    const words = (await getActivitiesByFilters(undefined, level)).filter((a) => a.id && a.frenchWord);
    if (words.length === 0) return today?.id ?? null;
    const day = Math.floor(Date.now() / 86_400_000);
    return words.sort((a, b) => a.id.localeCompare(b.id))[day % words.length].id;
  } catch {
    return null;
  }
}

/** "Quitter la démo": back to the site, ready for the next family. */
export async function endDemo(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/demo?fin=1');
}
