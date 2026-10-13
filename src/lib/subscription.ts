/**
 * Subscription access, straight from Stripe's REST API (no SDK, server only).
 *
 * Reads STRIPE_SECRET_KEY at call-time (never at import) so the site still
 * builds/renders when it isn't set; every call then logs a warning and reports
 * an error instead of crashing. A restricted key is enough:
 *   - Customers: write          (lookup by email + login-code metadata)
 *   - Subscriptions: read
 *   - Checkout Sessions: read   (auto-login after paying)
 *   - Customer portal: write    ("Gérer mon abonnement")
 *
 * Access = ANY subscription of ANY customer with that email is `active` or
 * `trialing`, whatever the price, so the founding members keep access.
 */

const STRIPE_API = 'https://api.stripe.com/v1';
const ACCESS_STATUSES = new Set(['active', 'trialing']);
/** A Checkout Session id only logs in for this long after the payment. */
const CHECKOUT_LOGIN_WINDOW_S = 24 * 60 * 60;

export type AccessResult = { status: 'active'; customerId: string } | { status: 'none' } | { status: 'error' };

type StripeList<T> = { data: T[]; has_more: boolean };
type Customer = { id: string; email: string | null; deleted?: boolean; metadata?: Record<string, string> };
type Subscription = { id: string; status: string; customer: string };
type CheckoutSession = {
  id: string;
  created: number;
  status: string | null;
  customer: string | null;
  customer_details: { email: string | null } | null;
  subscription: Subscription | string | null;
};

class StripeError extends Error {}

async function stripe<T>(path: string, init?: { method?: 'GET' | 'POST'; form?: Record<string, string> }): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn('[subscription] STRIPE_SECRET_KEY is not set: subscriber access is unavailable.');
    throw new StripeError('not_configured');
  }
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      ...(init?.form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: init?.form ? new URLSearchParams(init.form).toString() : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error(`[subscription] Stripe ${init?.method ?? 'GET'} ${path.split('?')[0]} responded ${res.status}: ${detail}`);
    throw new StripeError(`stripe_${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * Every customer for this email. The `email` list filter is case-sensitive, so
 * we merge the address as typed, its lowercase form, and the (case-insensitive,
 * but slightly delayed) search index.
 */
async function customersByEmail(email: string): Promise<Customer[]> {
  const trimmed = email.trim();
  const variants = Array.from(new Set([trimmed, trimmed.toLowerCase()]));
  const lists = await Promise.all([
    ...variants.map((e) => stripe<StripeList<Customer>>(`/customers?limit=100&email=${encodeURIComponent(e)}`)),
    stripe<StripeList<Customer>>(
      `/customers/search?limit=100&query=${encodeURIComponent(`email:'${trimmed.replace(/['\\]/g, '')}'`)}`,
    ).catch(() => ({ data: [], has_more: false })),
  ]);
  const byId = new Map<string, Customer>();
  for (const list of lists) for (const c of list.data) if (!c.deleted) byId.set(c.id, c);
  return [...byId.values()];
}

async function customerHasAccess(customerId: string): Promise<boolean> {
  const subs = await stripe<StripeList<Subscription>>(
    `/subscriptions?limit=100&status=all&customer=${encodeURIComponent(customerId)}`,
  );
  return subs.data.some((s) => ACCESS_STATUSES.has(s.status));
}

/** Which customer (if any) gives this email access. */
export async function findAccess(email: string): Promise<AccessResult> {
  try {
    for (const customer of await customersByEmail(email)) {
      if (await customerHasAccess(customer.id)) return { status: 'active', customerId: customer.id };
    }
    return { status: 'none' };
  } catch {
    return { status: 'error' };
  }
}

export async function hasAccess(email: string): Promise<boolean> {
  return (await findAccess(email)).status === 'active';
}

/**
 * Right after a Payment Link checkout: who paid, and do they have access?
 * Only recent, completed sessions count, so an old URL can't log anyone in.
 */
export async function checkoutAccess(sessionId: string): Promise<{ email: string; customerId: string } | null> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  try {
    const session = await stripe<CheckoutSession>(
      `/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`,
    );
    const email = session.customer_details?.email;
    if (session.status !== 'complete' || !email || !session.customer) return null;
    if (Date.now() / 1000 - session.created > CHECKOUT_LOGIN_WINDOW_S) return null;

    // The subscription comes with the session, so we don't wait for the
    // customer search index to catch up with a brand-new customer.
    const sub = session.subscription;
    if (sub && typeof sub === 'object' && ACCESS_STATUSES.has(sub.status)) {
      return { email: email.toLowerCase(), customerId: session.customer };
    }
    const access = await findAccess(email);
    return access.status === 'active' ? { email: email.toLowerCase(), customerId: access.customerId } : null;
  } catch {
    return null;
  }
}

/** Stripe Billing Portal URL for this customer, or null if it can't be created. */
export async function createPortalUrl(customerId: string, returnUrl: string): Promise<string | null> {
  try {
    const portal = await stripe<{ url: string }>('/billing_portal/sessions', {
      method: 'POST',
      form: { customer: customerId, return_url: returnUrl },
    });
    return portal.url;
  } catch {
    return null;
  }
}

// ── Login codes (state kept server-side, in the customer's metadata) ──

export type LoginCodeState = { hash: string; exp: number; attempts: number };

export async function saveLoginCode(customerId: string, state: LoginCodeState | null): Promise<boolean> {
  try {
    await stripe<Customer>(`/customers/${encodeURIComponent(customerId)}`, {
      method: 'POST',
      // Stripe deletes a metadata key when it's set to an empty string.
      form: {
        'metadata[login_code_hash]': state?.hash ?? '',
        'metadata[login_code_exp]': state ? String(state.exp) : '',
        'metadata[login_code_attempts]': state ? String(state.attempts) : '',
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function readLoginCode(customerId: string): Promise<LoginCodeState | null | 'error'> {
  try {
    const customer = await stripe<Customer>(`/customers/${encodeURIComponent(customerId)}`);
    const m = customer.metadata ?? {};
    if (!m.login_code_hash) return null;
    return { hash: m.login_code_hash, exp: Number(m.login_code_exp) || 0, attempts: Number(m.login_code_attempts) || 0 };
  } catch {
    return 'error';
  }
}
