/**
 * Signed cookies for the subscriber area (no database).
 *
 * Two cookies, both httpOnly and HMAC-SHA256 signed with SESSION_SECRET via
 * Web Crypto, so this file works in proxy.ts, route handlers and server
 * actions alike:
 *   - mounas_session  {email, customerId, checkedAt, exp}  30 days
 *   - mounas_login    {email, customerId, exp}             10 minutes, only
 *     links the browser to a pending code. The code itself (hashed), its expiry
 *     and the attempt counter live in the Stripe customer's metadata, so
 *     replaying an old cookie can't reset the attempts.
 *
 * Format: base64url(JSON payload) + "." + base64url(HMAC). Reads the secret at
 * call-time (never at import) so the site still builds without it.
 */

export const SESSION_COOKIE = 'mounas_session';
export const LOGIN_COOKIE = 'mounas_login';

export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // seconds
export const LOGIN_MAX_AGE = 10 * 60; // seconds
/** Re-ask Stripe whether the subscription is still active after this long. */
export const RECHECK_AFTER_MS = 24 * 60 * 60 * 1000;

export type Session = { email: string; customerId: string; checkedAt: number; exp: number };
export type PendingLogin = { email: string; customerId: string; exp: number };

const encoder = new TextEncoder();
let warned = false;

function secret(): string | null {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    if (!warned) {
      console.warn('[session] SESSION_SECRET is missing or too short (16+ characters): login is disabled.');
      warned = true;
    }
    return null;
  }
  return value;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmac(key: string, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data)));
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Hex HMAC of a value, keyed with SESSION_SECRET (used to hash login codes). */
export async function keyedHash(value: string): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  return Array.from(await hmac(key, value), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sign(payload: object): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  return `${body}.${toBase64Url(await hmac(key, body))}`;
}

async function verify<T extends { exp: number }>(token: string | undefined): Promise<T | null> {
  const key = secret();
  if (!key || !token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  try {
    if (!sameBytes(fromBase64Url(signature), await hmac(key, body))) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as T;
    return typeof payload.exp === 'number' && payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export function signSession(email: string, customerId: string): Promise<string | null> {
  const now = Date.now();
  return sign({ email, customerId, checkedAt: now, exp: now + SESSION_MAX_AGE * 1000 } satisfies Session);
}

/** Same session, new checkedAt (and current customer); keeps the original 30-day expiry. */
export function refreshSession(session: Session, customerId: string): Promise<string | null> {
  return sign({ ...session, customerId, checkedAt: Date.now() } satisfies Session);
}

export async function readSession(token: string | undefined): Promise<Session | null> {
  const s = await verify<Session>(token);
  return s && typeof s.email === 'string' && typeof s.customerId === 'string' && typeof s.checkedAt === 'number' ? s : null;
}

export function signPendingLogin(email: string, customerId: string): Promise<string | null> {
  return sign({ email, customerId, exp: Date.now() + LOGIN_MAX_AGE * 1000 } satisfies PendingLogin);
}

export function readPendingLogin(token: string | undefined): Promise<PendingLogin | null> {
  return verify<PendingLogin>(token);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

export const loginCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/connexion',
  maxAge: LOGIN_MAX_AGE,
};

/** Only allow in-app return URLs ("/app/..."), never another site. */
export function safeNext(next: unknown, fallback = '/app'): string {
  if (typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  return next;
}
