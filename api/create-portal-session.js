// api/create-portal-session.js
// Ouvre le portail client Stripe pour permettre à une abonnée de gérer
// son moyen de paiement et son abonnement.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Email manquant" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
  const SITE_URL =
    process.env.SITE_URL || "https://planme-dmr3.vercel.app";

  if (!SUPABASE_URL || !SERVICE_KEY || !STRIPE_SECRET) {
    return res.status(500).json({
      error: "Configuration serveur incomplète",
    });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    // Récupère l'identifiant Stripe du compte depuis Supabase
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users_approved?email=eq.${encodeURIComponent(
        cleanEmail
      )}&select=stripe_customer_id`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );

    const rows = await userRes.json();

    const customerId =
      Array.isArray(rows) && rows[0]?.stripe_customer_id;

    if (!customerId) {
      return res.status(404).json({
        error: "Aucun abonnement Stripe trouvé pour ce compte.",
      });
    }

    // Création de la session Stripe Customer Portal
    const params = new URLSearchParams();

    params.append("customer", customerId);
    params.append("return_url", SITE_URL);

    const stripeRes = await fetch(
      "https://api.stripe.com/v1/billing_portal/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const session = await stripeRes.json();

    if (!stripeRes.ok || !session.url) {
      console.error("Stripe portal error:", session);

      return res.status(500).json({
        error: "Impossible d'ouvrir l'espace abonnement.",
      });
    }

    return res.status(200).json({
      url: session.url,
    });
  } catch (e) {
    console.error("create-portal-session:", e);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
}
