/**
 * Sends emails through Resend's REST API (server only): the 6-digit login
 * code and the free guide.
 *
 * Reads RESEND_API_KEY and LOGIN_EMAIL_FROM at call-time (never at import).
 * Without a key, local dev prints the code in the terminal instead, so the
 * whole login flow can be tried without sending real emails; production
 * reports `not_configured`.
 */

import { EXPO, whatsappLink } from '@/lib/config';

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
    `Et si tu essayais l'app avec ton enfant ce soir ? Toute l'app est ouverte pendant 60 minutes, sans compte, sans carte et sans rien télécharger (elle s'ouvre dans ton navigateur). 10 minutes suffisent :\n${demoUrl}\n\n` +
    `Une question ? Réponds à cet email ou écris-nous sur WhatsApp.\n\nÀ très vite,\nPam et Les Mounas`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1A1A1A;line-height:1.55;max-width:560px">
  <p>Bonjour !</p>
  <p>Merci de rejoindre Les Mounas 💜</p>
  ${guideHtml}
  <p style="margin-top:28px">Et si tu essayais l'app avec ton enfant ce soir ? Le mot du jour, les jeux de sons, la dictée, le calcul : toute l'app est ouverte pendant 60 minutes, <b>sans compte, sans carte et sans rien télécharger</b> (elle s'ouvre dans ton navigateur). 10 minutes suffisent.</p>
  <p><a href="${demoUrl}" style="display:inline-block;background:#5B1F8C;color:#FDF6EC;padding:12px 24px;border-radius:999px;font-weight:bold;text-decoration:none">👀 Essayer l'app gratuitement</a></p>
  <p>Une question ? Réponds à cet email ou écris-nous sur <a href="${whatsappLink()}">WhatsApp</a>.</p>
  <p>À très vite,<br>Pam et Les Mounas</p>
</div>`;
  return sendEmail(to, 'Ton guide gratuit Les Mounas 📖', text, html);
}

/**
 * Welcome email for the free trial without a card (/mobile-money and the
 * /abidjan offer): how to log in, until when, and the yearly price paid by
 * Mobile Money after the trial. « vous » when the form came from /abidjan.
 */
export async function sendMobileMoneyWelcome(
  to: string,
  { name, until, operator, vous = false }: { name: string; until: string; operator: string; vous?: boolean },
): Promise<SendResult> {
  const escape = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const say = (tu: string, v: string) => (vous ? v : tu);
  const loginUrl = `${SITE}/connexion`;
  const hello = name ? `Bonjour ${name} !` : 'Bonjour !';
  const offer = `${EXPO.price} pour un an`;

  const lines = {
    open: say('Ton essai gratuit Les Mounas est ouvert', 'Votre essai gratuit Les Mounas est ouvert'),
    how: say('Pour te connecter :', 'Pour vous connecter :'),
    step1: say('Ouvre', 'Ouvrez'),
    step2: say('Entre cette adresse :', 'Entrez cette adresse :'),
    step3: say(
      'Tu reçois un code à 6 chiffres par email (regarde aussi dans les indésirables)',
      'Vous recevez un code à 6 chiffres par email (regardez aussi dans les indésirables)',
    ),
    step4: say("Entre le code, et c'est parti !", "Entrez le code, et c'est parti !"),
    after: say(
      `10 minutes par jour suffisent. Tu ne paies rien pendant l'essai. Pour continuer ensuite, l'offre spéciale est à ${offer} (soit ${EXPO.pricePerMonth} par mois), à payer après l'essai par ${operator} : Pam t'écrit sur WhatsApp avant la fin. Pas de carte bancaire, rien n'est prélevé sans toi.`,
      `10 minutes par jour suffisent. Vous ne payez rien pendant l'essai. Pour continuer ensuite, l'offre spéciale est à ${offer} (soit ${EXPO.pricePerMonth} par mois), à régler après l'essai par ${operator} : Pam vous écrit sur WhatsApp avant la fin. Pas de carte bancaire, rien n'est prélevé sans vous.`,
    ),
    question: say('Une question ? Réponds à cet email ou écris-nous sur', 'Une question ? Répondez à cet email ou écrivez-nous sur'),
  };

  const text =
    `${hello}\n\n${lines.open} jusqu'au ${until} 🎉\n\n` +
    `${lines.how}\n1. ${lines.step1} ${loginUrl}\n2. ${lines.step2} ${to}\n3. ${lines.step3}\n4. ${lines.step4}\n\n` +
    `${lines.after}\n\n${lines.question} WhatsApp : ${whatsappLink()}\n\nÀ très vite,\nPam et Les Mounas`;

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1A1A1A;line-height:1.55;max-width:560px">
  <p>${escape(hello)}</p>
  <p>${lines.open} <b>jusqu'au ${escape(until)}</b> 🎉</p>
  <p><b>${lines.how}</b></p>
  <ol>
    <li>${lines.step1} <a href="${loginUrl}">lesmounas.school/connexion</a></li>
    <li>${lines.step2} <b>${escape(to)}</b></li>
    <li>${lines.step3}</li>
    <li>${lines.step4}</li>
  </ol>
  <p><a href="${loginUrl}" style="display:inline-block;background:#5B1F8C;color:#FDF6EC;padding:12px 24px;border-radius:999px;font-weight:bold;text-decoration:none">Me connecter</a></p>
  <p>${escape(lines.after)}</p>
  <p>${lines.question} <a href="${whatsappLink()}">WhatsApp</a>.</p>
  <p>À très vite,<br>Pam et Les Mounas</p>
</div>`;
  return sendEmail(to, say('Ton essai gratuit Les Mounas est ouvert 🎉', 'Votre essai gratuit Les Mounas est ouvert 🎉'), text, html);
}
