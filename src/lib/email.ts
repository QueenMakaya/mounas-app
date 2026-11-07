/**
 * Sends emails through Resend's REST API (server only): the 6-digit login
 * code and the free guide.
 *
 * Reads RESEND_API_KEY and LOGIN_EMAIL_FROM at call-time (never at import).
 * Without a key, local dev prints the code in the terminal instead, so the
 * whole login flow can be tried without sending real emails; production
 * reports `not_configured`.
 */

import { whatsappLink } from '@/lib/config';

const DEFAULT_FROM = 'Les Mounas <contact@lesmounas.school>';

export type SendResult = { ok: true } | { ok: false; error: 'not_configured' | 'send_error' };

function resendKey(): string {
  // Same repairs as airtableToken(): stray spaces/new lines, wrapping quotes or
  // a "Bearer " prefix picked up when pasting the key into Vercel.
  return (process.env.RESEND_API_KEY ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^Bearer\s+/i, '')
    .trim();
}

async function sendEmail(to: string, subject: string, text: string, html: string): Promise<SendResult> {
  const apiKey = resendKey();
  const from = process.env.LOGIN_EMAIL_FROM || DEFAULT_FROM;

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[email] RESEND_API_KEY is not set. Dev only, not sent to ${to}:\n${text}`);
      return { ok: true };
    }
    console.error('[email] RESEND_API_KEY is not set: emails cannot be sent.');
    return { ok: false, error: 'not_configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
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

export async function sendLoginCode(to: string, code: string): Promise<SendResult> {
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
  return sendEmail(to, `Ton code Les Mounas : ${code}`, text, html);
}

const SITE = 'https://www.lesmounas.school';

/** The guide's public link: GUIDE_URL overrides the PDF served by the site. */
export const DEFAULT_GUIDE_URL = `${SITE}/guide/ta-maison-est-deja-une-ecole.pdf`;

/**
 * Tells Pam something happened (a new trial, a guide request…), by email to
 * NOTIFY_EMAIL (read at call-time; comma-separated for several people).
 * Never throws: a missing address or a failed send is only logged.
 */
export async function notifyOwner(subject: string, lines: string[]): Promise<void> {
  const to = (process.env.NOTIFY_EMAIL ?? '')
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);
  if (to.length === 0) {
    console.warn(`[notify] NOTIFY_EMAIL is not set, not sent: ${subject}`);
    return;
  }
  const escape = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const text = lines.join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1A1A1A;line-height:1.6">${lines
    .map((l) => `<p style="margin:0 0 8px">${escape(l)}</p>`)
    .join('')}</div>`;
  for (const address of to) {
    const sent = await sendEmail(address, subject, text, html).catch(() => null);
    if (!sent?.ok) console.error(`[notify] could not send: ${subject}`);
  }
}

/**
 * The free guide « Ta maison est déjà une école », sent right after the form.
 * The PDF lives in public/guide/; GUIDE_URL (read at call-time) can point the
 * email at another copy, e.g. an updated version shared from Drive.
 */
export async function sendGuideEmail(to: string): Promise<SendResult> {
  const guideUrl = (process.env.GUIDE_URL ?? '').trim() || DEFAULT_GUIDE_URL;
  const demoUrl = `${SITE}/demo?utm_source=email&utm_medium=guide&utm_campaign=guide`;

  const guideText = `Voici ton guide « Ta maison est déjà une école » :\n${guideUrl}\n\n`;
  const guideHtml = `<p>Voici ton guide <b>« Ta maison est déjà une école »</b> :</p>
  <p><a href="${guideUrl}" style="display:inline-block;background:#E63946;color:#FDF6EC;padding:12px 24px;border-radius:999px;font-weight:bold;text-decoration:none">📖 Ouvrir le guide</a></p>`;

  const text =
    `Bonjour !\n\nMerci de rejoindre Les Mounas 💜\n\n${guideText}` +
    `Et si tu essayais l'app avec ton enfant ce soir ? Toute l'app est ouverte pendant 60 minutes, sans compte et sans carte. 10 minutes suffisent :\n${demoUrl}\n\n` +
    `Une question ? Réponds à cet email ou écris-nous sur WhatsApp.\n\nÀ très vite,\nPam et Les Mounas`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1A1A1A;line-height:1.55;max-width:560px">
  <p>Bonjour !</p>
  <p>Merci de rejoindre Les Mounas 💜</p>
  ${guideHtml}
  <p style="margin-top:28px">Et si tu essayais l'app avec ton enfant ce soir ? Le mot du jour, les jeux de sons, la dictée, le calcul : toute l'app est ouverte pendant 60 minutes, <b>sans compte et sans carte</b>. 10 minutes suffisent.</p>
  <p><a href="${demoUrl}" style="display:inline-block;background:#5B1F8C;color:#FDF6EC;padding:12px 24px;border-radius:999px;font-weight:bold;text-decoration:none">👀 Essayer l'app gratuitement</a></p>
  <p>Une question ? Réponds à cet email ou écris-nous sur <a href="${whatsappLink()}">WhatsApp</a>.</p>
  <p>À très vite,<br>Pam et Les Mounas</p>
</div>`;
  return sendEmail(to, 'Ton guide gratuit Les Mounas 📖', text, html);
}
