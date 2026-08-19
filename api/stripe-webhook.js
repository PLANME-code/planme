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
