// api/stripe-webhook.js
// Gère automatiquement l'accès PLAN ME selon l'état de l'abonnement Stripe.
//
// Offre PLAN ME :
// - 29,90 €/mois pendant les 3 premiers mois
// - puis 39,90 €/mois
//
// IMPORTANT :
// Si une cliente résilie son abonnement, elle conserve l'accès
// jusqu'à la fin de la période déjà payée.
// Stripe enverra customer.subscription.deleted à la fin réelle
// de l'abonnement, et l'accès sera alors coupé.

import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

function readRawBody(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false;

  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');

    if (key === 't') {
      acc.timestamp = value;
    }

    if (key === 'v1') {
      acc.signatures = acc.signatures || [];
      acc.signatures.push(value);
    }

    return acc;
  }, {});

  if (!parts.timestamp || !parts.signatures?.length) {
    return false;
  }

  // Refuse les événements trop anciens (> 5 minutes)
  const eventTimestamp = Number(parts.timestamp);
  const now = Math.floor(Date.now() / 1000);

  if (
    !Number.isFinite(eventTimestamp) ||
    Math.abs(now - eventTimestamp) > 300
  ) {
    console.error('Webhook Stripe trop ancien');
    return false;
  }

  const signedPayload = `${parts.timestamp}.${rawBody}`;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return parts.signatures.some((signature) => {
    try {
      const receivedBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expected, 'hex');

      if (receivedBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
      );
    } catch (e) {
      return false;
    }
  });
}

async function patchSupabaseByEmail(email, data) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/users_approved?email=eq.${encodeURIComponent(
      email
    )}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.text();

    console.error(
      'Erreur mise à jour Supabase par email:',
      response.status,
      error
    );

    throw new Error(
      'Erreur mise à jour Supabase'
    );
  }
}

async function patchSupabaseBySubscription(
  subscriptionId,
  data
) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!subscriptionId) return;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/users_approved?stripe_subscription_id=eq.${encodeURIComponent(
      subscriptionId
    )}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.text();

    console.error(
      'Erreur mise à jour Supabase par abonnement:',
      response.status,
      error
    );

    throw new Error(
      'Erreur mise à jour Supabase'
    );
  }
}

// Email automatique via EmailJS
async function sendEmailJS({
  subject,
  titre,
  message,
  lienAction,
  texteBouton,
  toEmail,
}) {
  const EMAILJS_SERVICE_ID =
    'service_zrdnuog';

  const EMAILJS_TEMPLATE_ID =
    'template_9rkca8s';

  const EMAILJS_PUBLIC_KEY =
    'd-5YsA5j9C8wv8sVx';

  const EMAILJS_PRIVATE_KEY =
    process.env.EMAILJS_PRIVATE_KEY;

  if (!EMAILJS_PRIVATE_KEY) {
    console.error(
      'EMAILJS_PRIVATE_KEY manquante'
    );
    return;
  }

  const response = await fetch(
    'https://api.emailjs.com/api/v1.0/email/send',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    }
  );

  if (!response.ok) {
    const error = await response.text();

    console.error(
      'Erreur envoi EmailJS:',
      response.status,
      error
    );
  }
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const rawBodyBuffer =
    await readRawBody(req);

  const rawBody =
    rawBodyBuffer.toString('utf8');

  const signature =
    req.headers['stripe-signature'];

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (
    !verifyStripeSignature(
      rawBody,
      signature,
      webhookSecret
    )
  ) {
    console.error(
      'Signature webhook Stripe invalide — requête rejetée'
    );

    return res
      .status(400)
      .send('Signature invalide');
  }

  let event;

  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    console.error(
      'Impossible de lire le webhook Stripe'
    );

    return res
      .status(400)
      .send('Payload invalide');
  }

  try {
    /*
     * ---------------------------------------------------
     * 1. CHECKOUT TERMINÉ
     * ---------------------------------------------------
     */

    if (
      event.type ===
      'checkout.session.completed'
    ) {
      const session =
        event.data.object;

      const email = (
        session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.email ||
        ''
      )
        .toLowerCase()
        .trim();

      if (!email) {
        console.error(
          'Email manquant dans la session Stripe',
          session.id
        );

        return res
          .status(200)
          .json({
            received: true,
          });
      }

      if (
        session.payment_status !== 'paid' &&
        session.payment_status !==
          'no_payment_required'
      ) {
        console.log(
          'Checkout terminé mais paiement non confirmé:',
          session.id,
          session.payment_status
        );

        return res
          .status(200)
          .json({
            received: true,
          });
      }

      await patchSupabaseByEmail(
        email,
        {
          paid: true,
          plan: 'standard',

          // Tarif normal PLAN ME.
          // Stripe applique la réduction
          // pendant les 3 premiers mois.
          prix: 39.9,

          paid_at:
            new Date().toISOString(),

          stripe_customer_id:
            session.customer || null,

          stripe_subscription_id:
            session.subscription || null,
        }
      );

      // Email de bienvenue
      try {
        await sendEmailJS({
          toEmail: email,

          subject:
            'Bienvenue sur Plan Me 🎉',

          titre:
            'Bienvenue sur Plan Me !',

          message:
            "Ton paiement a bien été reçu et ton abonnement est activé ! Tu peux dès maintenant te connecter à Plan Me et gérer tes locations, ton catalogue et tes réservations.",

          lienAction:
            process.env.SITE_URL ||
            'https://planme-dmr3.vercel.app',

          texteBouton:
            'Me connecter',
        });
      } catch (mailError) {
        console.error(
          'Erreur mail bienvenue:',
          mailError
        );
      }
    }

    /*
     * ---------------------------------------------------
     * 2. FACTURE PAYÉE
     * ---------------------------------------------------
     *
     * À chaque renouvellement réussi,
     * on confirme l'accès.
     */

    if (
      event.type ===
      'invoice.paid'
    ) {
      const invoice =
        event.data.object;

      const subscriptionId =
        typeof invoice.subscription ===
        'string'
          ? invoice.subscription
          : invoice.subscription?.id;

      if (subscriptionId) {
        await patchSupabaseBySubscription(
          subscriptionId,
          {
            paid: true,
          }
        );
      }
    }

    /*
     * ---------------------------------------------------
     * 3. PAIEMENT ÉCHOUÉ
     * ---------------------------------------------------
     *
     * Un paiement réellement échoué
     * coupe l'accès.
     */

    if (
      event.type ===
      'invoice.payment_failed'
    ) {
      const invoice =
        event.data.object;

      const subscriptionId =
        typeof invoice.subscription ===
        'string'
          ? invoice.subscription
          : invoice.subscription?.id;

      if (subscriptionId) {
        await patchSupabaseBySubscription(
          subscriptionId,
          {
            paid: false,
          }
        );
      }
    }

    /*
     * ---------------------------------------------------
     * 4. ABONNEMENT SUPPRIMÉ
     * ---------------------------------------------------
     *
     * Si la cliente résilie à la fin
     * de sa période de facturation,
     * Stripe envoie normalement cet
     * événement lorsque l'abonnement
     * prend réellement fin.
     *
     * C'est donc ici qu'on coupe l'accès.
     */

    if (
      event.type ===
      'customer.subscription.deleted'
    ) {
      const subscription =
        event.data.object;

      await patchSupabaseBySubscription(
        subscription.id,
        {
          paid: false,
        }
      );
    }

    /*
     * ---------------------------------------------------
     * 5. CHANGEMENT D'ÉTAT DE L'ABONNEMENT
     * ---------------------------------------------------
     *
     * IMPORTANT :
     *
     * cancel_at_period_end = true
     * signifie seulement que la cliente
     * a demandé à résilier.
     *
     * Si son status est toujours "active",
     * elle conserve l'accès jusqu'à la
     * date de fin déjà payée.
     */

    if (
      event.type ===
      'customer.subscription.updated'
    ) {
      const subscription =
        event.data.object;

      const activeStatuses = [
        'active',
        'trialing',
      ];

      const accessAllowed =
        activeStatuses.includes(
          subscription.status
        );

      /*
       * Exemple :
       *
       * status = "active"
       * cancel_at_period_end = true
       *
       * => paid reste TRUE.
       *
       * On ne coupe donc PAS l'accès
       * simplement parce qu'une résiliation
       * a été demandée.
       */
      await patchSupabaseBySubscription(
        subscription.id,
        {
          paid: accessAllowed,
        }
      );
    }

    return res
      .status(200)
      .json({
        received: true,
      });
  } catch (e) {
    console.error(
      'Erreur stripe-webhook:',
      e
    );

    return res
      .status(500)
      .json({
        error: 'Erreur serveur',
      });
  }
}
