// api/stripe-webhook.js
// Écoute les événements Stripe (paiement confirmé, résiliation) et met à jour
// automatiquement Supabase — c'est ce qui rend le paiement 100% automatique,
// sans que tu aies besoin de cliquer quoi que ce soit dans le panneau admin.

import crypto from 'crypto';

// Important : on désactive le parsing JSON automatique de Vercel, car Stripe
// exige de vérifier la signature sur le corps BRUT de la requête (non modifié).
export const config = { api: { bodyParser: false } };

function readRawBody(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader) return false;
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    if (k === 't') acc.timestamp = v;
    if (k === 'v1') { acc.signatures = acc.signatures || []; acc.signatures.push(v); }
    return acc;
  }, {});
  if (!parts.timestamp || !parts.signatures) return false;

  const signedPayload = `${parts.timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');

  return parts.signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch (e) {
      return false; // longueurs différentes = signature invalide
    }
  });
}

// Envoie un email via l'API REST EmailJS (utilisable côté serveur, pas besoin
// du SDK navigateur). Réutilise le même template que le mail d'approbation,
// piloté entièrement par variables.
async function sendEmailJS({ subject, titre, message, lienAction, texteBouton, toEmail }) {
  const EMAILJS_SERVICE_ID = 'service_zrdnuog';
  const EMAILJS_TEMPLATE_ID = 'template_9rkca8s';
  const EMAILJS_PUBLIC_KEY = 'd-5YsA5j9C8wv8sVx';
  const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: toEmail,
        email_subject: subject,
        titre,
        message,
        lien_action: lienAction,
        texte_bouton: texteBouton,
      },
    }),
  });
  if (!res.ok) {
    const errTxt = await res.text();
    console.error('Erreur envoi EmailJS:', res.status, errTxt);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBodyBuffer = await readRawBody(req);
  const rawBody = rawBodyBuffer.toString('utf8');
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!verifyStripeSignature(rawBody, sig, secret)) {
    console.error('Signature webhook Stripe invalide — requête rejetée');
    return res.status(400).send('Signature invalide');
  }

  const event = JSON.parse(rawBody);

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
  const PRICE_EARLYBIRD = process.env.STRIPE_PRICE_EARLYBIRD;
  const PRICE_STANDARD = process.env.STRIPE_PRICE_STANDARD;

  try {
    // ── Paiement confirmé : on débloque l'accès ────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = (session.customer_email || session.metadata?.email || '').toLowerCase().trim();

      if (!email) {
        console.error('Webhook: email manquant dans la session Stripe', session.id);
        return res.status(200).json({ received: true });
      }

      // Récupérer le tarif réellement payé (early bird ou standard)
      const liRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items`,
        { headers: { Authorization: `Bearer ${STRIPE_SECRET}` } }
      );
      const liData = await liRes.json();
      const priceId = liData?.data?.[0]?.price?.id;
      const plan = priceId === PRICE_EARLYBIRD ? 'fondateur' : 'standard';
      const prix = priceId === PRICE_EARLYBIRD ? 69 : 79;

      await fetch(`${SUPABASE_URL}/rest/v1/users_approved?email=eq.${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paid: true,
          plan,
          prix,
          paid_at: new Date().toISOString(),
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        }),
      });

      // Mail de bienvenue automatique — envoyé dès que le paiement est confirmé,
      // sans aucune action manuelle de ta part.
      try {
        await sendEmailJS({
          toEmail: email,
          subject: 'Bienvenue sur Plan Me 🎉',
          titre: 'Bienvenue sur Plan Me !',
          message: "Ton paiement a bien été reçu, ton abonnement est activé ! Tu peux dès maintenant te connecter et commencer à gérer tes locations, ton catalogue et tes réservations.",
          lienAction: process.env.SITE_URL || 'https://planme-dmr3.vercel.app',
          texteBouton: 'Me connecter',
        });
      } catch (mailErr) {
        console.error('Erreur envoi mail de bienvenue:', mailErr);
        // On ne bloque pas le webhook pour un souci d'email — le paiement reste validé.
      }
    }

    // ── Abonnement résilié/impayé : on coupe l'accès ───────────────────
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      await fetch(
        `${SUPABASE_URL}/rest/v1/users_approved?stripe_subscription_id=eq.${sub.id}`,
        {
          method: 'PATCH',
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paid: false }),
        }
      );
    }

    return res.status(200).json({ received: true });
  } catch (e) {
    console.error('Erreur stripe-webhook:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
