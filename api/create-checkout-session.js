// api/create-checkout-session.js
// PLAN ME : abonnement à 39,90 €/mois
// Offre de lancement : 10 € de remise pendant les 3 premiers mois
// => 29,90 €/mois pendant 3 mois, puis 39,90 €/mois

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Email manquant' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

  // Nouveau tarif PLAN ME
  const PRICE_PLANME = process.env.STRIPE_PRICE_PLANME;

  // Remise de 10 € pendant 3 mois
  const COUPON_PLANME = process.env.STRIPE_COUPON_PLANME;

  const SITE_URL =
    process.env.SITE_URL || 'https://planme-dmr3.vercel.app';

  const cleanEmail = email.toLowerCase().trim();

  // Vérification des variables d'environnement
  if (
    !SUPABASE_URL ||
    !SERVICE_KEY ||
    !STRIPE_SECRET ||
    !PRICE_PLANME ||
    !COUPON_PLANME
  ) {
    console.error('Variables environnement manquantes');

    return res.status(500).json({
      error: "Configuration serveur incomplète",
    });
  }

  try {
    // 1) Vérifier que la prestataire existe,
    // qu'elle est approuvée et qu'elle n'a pas déjà un abonnement actif

    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users_approved?email=eq.${encodeURIComponent(
        cleanEmail
      )}&select=approved,paid`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );

    if (!checkRes.ok) {
      console.error(
        'Erreur Supabase vérification utilisateur:',
        await checkRes.text()
      );

      return res.status(500).json({
        error: "Impossible de vérifier le compte",
      });
    }

    const rows = await checkRes.json();
    const user = Array.isArray(rows) && rows[0];

    if (!user) {
      return res.status(404).json({
        error: "Compte introuvable",
      });
    }

    if (!user.approved) {
      return res.status(403).json({
        error: "Compte pas encore approuvé",
      });
    }

    if (user.paid) {
      return res.status(400).json({
        error: "Cet abonnement est déjà actif",
      });
    }

    // 2) Créer la session Stripe Checkout
    //
    // Prix normal : 39,90 €
    // Coupon : -10 € pendant les 3 premiers mois
    //
    // Résultat :
    // Mois 1 : 29,90 €
    // Mois 2 : 29,90 €
    // Mois 3 : 29,90 €
    // Mois 4+ : 39,90 €

    const params = new URLSearchParams();

    params.append('mode', 'subscription');

    // Tarif PLAN ME : 39,90 €/mois
    params.append('line_items[0][price]', PRICE_PLANME);
    params.append('line_items[0][quantity]', '1');

    // Remise automatique pendant 3 mois
    params.append('discounts[0][coupon]', COUPON_PLANME);

    // Cliente Stripe
    params.append('customer_email', cleanEmail);

    // Permet de retrouver facilement l'utilisatrice
    params.append('client_reference_id', cleanEmail);

    // Metadata de la Checkout Session
    params.append('metadata[email]', cleanEmail);
    params.append('metadata[plan]', 'standard');
    params.append('metadata[prix]', '39.90');
    params.append('metadata[offre]', '29.90_3_mois');

    // Metadata également enregistrée sur l'abonnement Stripe
    params.append(
      'subscription_data[metadata][email]',
      cleanEmail
    );
    params.append(
      'subscription_data[metadata][plan]',
      'standard'
    );
    params.append(
      'subscription_data[metadata][prix]',
      '39.90'
    );
    params.append(
      'subscription_data[metadata][offre]',
      '29.90_3_mois'
    );

    params.append(
      'success_url',
      `${SITE_URL}/?paiement=succes&session_id={CHECKOUT_SESSION_ID}`
    );

    params.append(
      'cancel_url',
      `${SITE_URL}/?paiement=annule`
    );

    // 3) Envoyer la demande à Stripe

    const stripeRes = await fetch(
      'https://api.stripe.com/v1/checkout/sessions',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },

        body: params.toString(),
      }
    );

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error(
        'Erreur création session Stripe:',
        session
      );

      return res.status(500).json({
        error: "Erreur lors de la création du paiement",
      });
    }

    // 4) Envoyer l'URL Stripe Checkout à PLAN ME

    return res.status(200).json({
      url: session.url,
    });

  } catch (e) {
    console.error(
      'Erreur create-checkout-session:',
      e
    );

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
}
