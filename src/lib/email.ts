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

/**
 * The free guide « Ta maison est déjà une école », sent right after the form.
 * GUIDE_URL (read at call-time) is the guide's public link, e.g. a PDF shared
 * from Drive. Without it the email still goes out, with the demo and a
 * WhatsApp link to get the guide in the conversation.
 */
export async function sendGuideEmail(to: string): Promise<SendResult> {
  const guideUrl = (process.env.GUIDE_URL ?? '').trim();
  const demoUrl = `${SITE}/demo?utm_source=email&utm_medium=guide&utm_campaign=guide`;
  const whatsappUrl = whatsappLink('Bonjour Les Mounas ! Je voudrais recevoir le guide gratuit « Ta maison est déjà une école ». 📖');

  const guideText = guideUrl
    ? `Voici ton guide « Ta maison est déjà une école » :\n${guideUrl}\n\n`
    : `Pour recevoir ton guide « Ta maison est déjà une école », écris-nous sur WhatsApp, on te l'envoie tout de suite :\n${whatsappUrl}\n\n`;
  const guideHtml = guideUrl
    ? `<p>Voici ton guide <b>« Ta maison est déjà une école »</b> :</p>
  <p><a href="${guideUrl}" style="display:inline-block;background:#E63946;color:#FDF6EC;padding:12px 24px;border-radius:999px;font-weight:bold;text-decoration:none">📖 Ouvrir le guide</a></p>`
    : `<p>Pour recevoir ton guide <b>« Ta maison est déjà une école »</b>, écris-nous sur WhatsApp, on te l'envoie tout de suite :</p>
  <p><a href="${whatsappUrl}" style="display:inline-block;background:#25D366;color:#FFFFFF;padding:12px 24px;border-radius:999px;font-weight:bold;text-decoration:none">💬 Recevoir le guide sur WhatsApp</a></p>`;

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
