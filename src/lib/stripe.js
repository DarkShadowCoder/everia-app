// src/lib/stripe.js
// ------------------------------------------------------------
// Intégration Stripe. Principe important repris du spec produit :
// "Une application mobile ne doit jamais considérer qu'un paiement
// est réussi uniquement parce qu'elle a reçu le retour de son
// interface locale." Le flux est donc :
//
//   1. Le client demande une session de paiement à une Edge
//      Function Supabase (create-checkout-session), qui crée le
//      customer/PaymentIntent côté Stripe avec la clé secrète
//      (jamais exposée au client) et renvoie client_secret +
//      ephemeralKey + customerId.
//   2. Le client ouvre le PaymentSheet natif Stripe et confirme.
//   3. Le webhook Stripe (Edge Function stripe-webhook) est la
//      SEULE source de vérité : il écrit dans `payments` et
//      `user_subscriptions` / `event_entitlements` côté Supabase.
//   4. Le client attend la mise à jour de ces tables (realtime ou
//      polling court) avant de débloquer la fonctionnalité payée.
// ------------------------------------------------------------

import { supabase } from './supabase';

/**
 * Demande la création d'une session de paiement pour un plan donné.
 * @param {Object} params
 * @param {string} params.planCode - code du plan (billing_plans.code)
 * @param {string} [params.eventId] - événement concerné (Event Pass)
 */
export async function createCheckoutSession({ planCode, eventId }) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { planCode, eventId },
  });
  if (error) throw error;
  return data; // { clientSecret, ephemeralKey, customerId, paymentIntentId, publishableKey }
}

/**
 * Attend (polling léger, 2s x 15) que le paiement soit confirmé côté
 * base de données par le webhook Stripe, plutôt que de faire confiance
 * au seul retour du PaymentSheet natif.
 */
export async function waitForPaymentConfirmation(paymentIntentId, { attempts = 15, intervalMs = 2000 } = {}) {
  for (let i = 0; i < attempts; i += 1) {
    const { data, error } = await supabase
      .from('payments')
      .select('id,status,failure_reason')
      .eq('provider_payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (!error && data) {
      if (data.status === 'succeeded') return { confirmed: true, payment: data };
      if (data.status === 'failed') return { confirmed: false, payment: data };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { confirmed: false, timeout: true };
}

/** Récupère les plans actifs (billing_plans) pour l'écran d'abonnement. */
export async function fetchBillingPlans() {
  const { data, error } = await supabase
    .from('billing_plans')
    .select('*')
    .eq('active', true)
    .order('price_cents', { ascending: true });
  if (error) throw error;
  return data;
}

/** Abonnement actif courant de l'utilisateur. */
export async function fetchActiveSubscription(userId) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*, billing_plans(*)')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
