// api/create-checkout-session.js
// Crée une session de paiement Stripe Checkout pour une prestataire déjà approuvée.
// Le tarif (early bird 69€ ou standard 79€) est déterminé automatiquement selon
// le nombre de prestataires déjà payantes (moins de 10 = early bird).

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email manquant' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
  const PRICE_EARLYBIRD = process.env.STRIPE_PRICE_EARLYBIRD;
  const PRICE_STANDARD = process.env.STRIPE_PRICE_STANDARD;
  const SITE_URL = process.env.SITE_URL || 'https://planme-dmr3.vercel.app';

  const cleanEmail = email.toLowerCase().trim();

  try {
    // 1) Vérifier que le compte est bien approuvé et pas déjà payé
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users_approved?email=eq.${encodeURIComponent(cleanEmail)}&select=approved,paid`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const rows = await checkRes.json();
    const user = Array.isArray(rows) && rows[0];

    if (!user) return res.status(404).json({ error: "Compte introuvable" });
    if (!user.approved) return res.status(403).json({ error: "Compte pas encore approuvé" });
    if (user.paid) return res.status(400).json({ error: "Cet abonnement est déjà actif" });

    // 2) Déterminer le tarif : early bird tant que moins de 10 prestataires payantes
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users_approved?paid=eq.true&select=email`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const paidRows = await countRes.json();
    const nbPaid = Array.isArray(paidRows) ? paidRows.length : 0;
    const priceId = nbPaid < 10 ? PRICE_EARLYBIRD : PRICE_STANDARD;

    // 3) Créer la session Stripe Checkout (abonnement récurrent)
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('customer_email', cleanEmail);
    params.append('success_url', `${SITE_URL}/?paiement=succes`);
    params.append('cancel_url', `${SITE_URL}/?paiement=annule`);
    params.append('metadata[email]', cleanEmail);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('Erreur création session Stripe:', session);
      return res.status(500).json({ error: "Erreur lors de la création du paiement" });
    }

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('Erreur create-checkout-session:', e);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
