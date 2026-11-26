'use server';

import { headers } from 'next/headers';
import { after } from 'next/server';
import { EXPO, MOBILE_MONEY } from '@/lib/config';
import { notifyOwner, sendMobileMoneyWelcome } from '@/lib/email';
import type { MobileMoneyState } from '@/lib/form-state';
import { funnelRow, logFunnel } from '@/lib/funnel-log';
import { frenchDate, openMobileMoneyTrial } from '@/lib/mobile-money';
import { findAccess } from '@/lib/subscription';

// NOTE: this file is 'use server': it may only export async functions.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v: FormDataEntryValue | null, max = 120) => String(v ?? '').trim().slice(0, max);

/** Free trial without a card, paid afterwards by Mobile Money (/mobile-money). */
export async function requestMobileMoneyTrial(_prev: MobileMoneyState, formData: FormData): Promise<MobileMoneyState> {
  // Hidden field only robots fill in: pretend it worked, store nothing.
  if (clean(formData.get('website'))) return { status: 'success', message: 'Merci !' };

  const name = clean(formData.get('name'), 80);
  const email = clean(formData.get('email'), 200).toLowerCase();
  const whatsappRaw = clean(formData.get('whatsapp'), 40);
  const country = clean(formData.get('country'), 40);
  const operatorRaw = clean(formData.get('operator'), 40);
  const childAge = clean(formData.get('childAge'), 40);
  const source = clean(formData.get('source'), 200);
  const page = clean(formData.get('page'), 40) === '/abidjan' ? '/abidjan' : '/mobile-money';
  // « vous » on /abidjan (trade-show parents), « tu » on the rest of the site.
  const vous = formData.get('formal') === '1';
  const say = (tu: string, v: string) => (vous ? v : tu);

  if (!name) return { status: 'error', message: say('Indique ton prénom et ton nom.', 'Indiquez votre prénom et votre nom.') };
  if (!EMAIL_RE.test(email)) {
    return {
      status: 'error',
      message: say(
        'Oups, cette adresse email ne semble pas valide. C’est avec elle que tu te connecteras.',
        'Cette adresse email ne semble pas valide. C’est avec elle que vous vous connecterez.',
      ),
    };
  }
  const digits = whatsappRaw.replace(/[^0-9]/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return {
      status: 'error',
      message: say(
        'Indique ton numéro WhatsApp avec l’indicatif du pays (ex. +225 07 00 00 00 00).',
        'Indiquez votre numéro WhatsApp avec l’indicatif du pays (ex. +225 07 00 00 00 00).',
      ),
    };
  }
  const whatsapp = `+${digits}`;
  const operator = (MOBILE_MONEY.operators as readonly string[]).includes(operatorRaw) ? operatorRaw : MOBILE_MONEY.operators[0];
  const countryOk = (MOBILE_MONEY.countries as readonly string[]).includes(country) ? country : 'Autre pays';

  // Already a subscriber, or already an open access: just log in.
  const access = await findAccess(email);
  if (access.status === 'active') {
    return {
      status: 'success',
      message: say('Tu as déjà accès à toute l’app : connecte-toi avec cette adresse.', 'Vous avez déjà accès à toute l’app : connectez-vous avec cette adresse.'),
      email,
    };
  }

  const result = await openMobileMoneyTrial({ email, name, whatsapp, country: countryOk, operator, childAge, page });

  if (!result.ok) {
    if (result.error === 'already_used') {
      return {
        status: 'error',
        message: say(
          'Un essai a déjà été ouvert avec cette adresse. Écris-nous sur WhatsApp et on regarde ensemble comment continuer. 💬',
          'Un essai a déjà été ouvert avec cette adresse. Écrivez-nous sur WhatsApp et nous regardons ensemble comment continuer. 💬',
        ),
      };
    }
    return {
      status: 'error',
      message: say(
        'Un problème est survenu de notre côté. Réessaie dans un instant, ou écris-nous sur WhatsApp.',
        'Un problème est survenu de notre côté. Réessayez dans un instant, ou écrivez-nous sur WhatsApp.',
      ),
    };
  }

  const until = frenchDate(result.until);
  const h = await headers();
  const row = funnelRow(
    { event: 'mobile', page, source },
    h.get('user-agent') ?? '',
    h.get('x-vercel-ip-country') ?? '',
  );

  const sent = await sendMobileMoneyWelcome(email, { name: name.split(/\s+/)[0], until, operator, vous });

  after(async () => {
    if (row) await logFunnel(row);
    const firstName = name.split(/\s+/)[0];
    const reply = `https://wa.me/${digits}?text=${encodeURIComponent(
      `Bonjour ${firstName} ! C'est Pam, des Mounas 🌱 Ton essai gratuit est ouvert jusqu'au ${until}. Est-ce que la connexion a marché ?`,
    )}`;
    await notifyOwner(`📱 Nouvel essai Mobile Money : ${name} (${countryOk})`, [
      `${name} vient d'ouvrir un essai gratuit sans carte (depuis ${page}). Son accès est ouvert tout de suite, jusqu'au ${until} inclus.`,
      `Email : ${email}`,
      `WhatsApp : ${whatsapp} (écrire : ${reply})`,
      `Pays : ${countryOk} · Paiement souhaité : ${operator}${childAge ? ` · Enfant : ${childAge}` : ''}`,
      sent.ok ? "L'email d'accueil (comment se connecter) lui a été envoyé." : "⚠️ L'email d'accueil n'est PAS parti : envoie-lui le lien de connexion sur WhatsApp.",
      `Offre annoncée : ${EXPO.price} pour un an, à payer après l'essai.`,
      `À faire avant le ${until} : lui envoyer sur WhatsApp les détails de paiement ${operator} (${EXPO.price}). Paiement reçu → dans Airtable « Accès offerts », repousser « Expire le » d'un an, mettre « Offre » sur « Famille Fondatrice Abidjan » si c'est une place de l'offre, et remplir « Référence paiement ». Sans paiement, l'accès se ferme tout seul.`,
    ]);
  });

  return {
    status: 'success',
    message: sent.ok
      ? say(
          `C’est ouvert ! Ton essai gratuit dure jusqu’au ${until}. On vient de t’envoyer un email pour te connecter.`,
          `C’est ouvert ! Votre essai gratuit dure jusqu’au ${until}. Nous venons de vous envoyer un email pour vous connecter.`,
        )
      : say(
          `C’est ouvert ! Ton essai gratuit dure jusqu’au ${until}. Connecte-toi avec ton adresse email.`,
          `C’est ouvert ! Votre essai gratuit dure jusqu’au ${until}. Connectez-vous avec votre adresse email.`,
        ),
    email,
    until,
  };
}

