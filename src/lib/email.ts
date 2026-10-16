/**
 * Sends the 6-digit login code through Resend's REST API (server only).
 *
 * Reads RESEND_API_KEY and LOGIN_EMAIL_FROM at call-time (never at import).
 * Without a key, local dev prints the code in the terminal instead, so the
 * whole login flow can be tried without sending real emails; production
 * reports `not_configured`.
 */

const DEFAULT_FROM = 'Les Mounas <contact@lesmounas.school>';

export type SendResult = { ok: true } | { ok: false; error: 'not_configured' | 'send_error' };

export async function sendLoginCode(to: string, code: string): Promise<SendResult> {
  // Same repairs as airtableToken(): stray spaces/new lines, wrapping quotes or
  // a "Bearer " prefix picked up when pasting the key into Vercel.
  const apiKey = (process.env.RESEND_API_KEY ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  const from = process.env.LOGIN_EMAIL_FROM || DEFAULT_FROM;

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[email] RESEND_API_KEY is not set. Dev only, login code for ${to}: ${code}`);
      return { ok: true };
    }
    console.error('[email] RESEND_API_KEY is not set: login codes cannot be sent.');
    return { ok: false, error: 'not_configured' };
  }

  const text =
    `Bonjour !\n\nVoici ton code pour te connecter à Les Mounas : ${code}\n\n` +
    `Il est valable 10 minutes. Si tu n'as rien demandé, tu peux ignorer ce message.\n\nÀ très vite,\nLes Mounas`;
  const html = `<div style="font-family:Arial,sans-serif;color:#1A1A1A;line-height:1.5">
  <p>Bonjour !</p>
  <p>Voici ton code pour te connecter à Les Mounas :</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#5B1F8C">${code}</p>
  <p>Il est valable 10 minutes. Si tu n'as rien demandé, tu peux ignorer ce message.</p>
  <p>À très vite,<br>Les Mounas</p>
</div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: `Ton code Les Mounas : ${code}`, text, html }),
      cache: 'no-store',
    });
    if (!res.ok) {
      // The key's prefix and length (never the key) help spot a wrong or truncated paste.
      console.error(
        `[email] Resend responded ${res.status}: ${await res.text().catch(() => '')} ` +
          `| key starts "${apiKey.slice(0, 3)}" (len ${apiKey.length}) from="${from}"`,
      );
      return { ok: false, error: 'send_error' };
    }
    return { ok: true };
  } catch (err) {
    console.error('[email] Request to Resend failed:', err);
    return { ok: false, error: 'send_error' };
  }
}
