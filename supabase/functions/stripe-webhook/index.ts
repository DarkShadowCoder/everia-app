// supabase/functions/stripe-webhook/index.ts
// ------------------------------------------------------------
// Reçoit les événements Stripe et met à jour `payments`,
// `user_subscriptions` et `event_entitlements`. C'est la SEULE
// source de vérité côté serveur pour l'état d'un paiement — le
// client ne doit jamais débloquer une fonctionnalité seulement
// parce que le PaymentSheet local a renvoyé un succès.
//
// Secrets requis: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// URL à enregistrer dans le dashboard Stripe:
//   https://<project-ref>.functions.supabase.co/stripe-webhook
// ------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@16.2.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (err) {
    console.error('Signature webhook invalide', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSucceeded(intent);
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: intent.last_payment_error?.message ?? 'Échec du paiement',
        })
        .eq('provider_payment_intent_id', intent.id);
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: mapStripeStatus(sub.status),
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          cancelled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        })
        .eq('provider_subscription_id', sub.id);
      break;
    }
    default:
      // Événement non géré, on acquitte quand même pour éviter les retries inutiles.
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

async function handlePaymentSucceeded(intent: Stripe.PaymentIntent) {
  const { plan_id, plan_code, event_id, supabase_user_id } = intent.metadata as Record<string, string>;

  await supabaseAdmin
    .from('payments')
    .update({ status: 'succeeded', paid_at: new Date().toISOString() })
    .eq('provider_payment_intent_id', intent.id);

  if (!plan_id || !supabase_user_id) return;

  const { data: plan } = await supabaseAdmin.from('billing_plans').select('*').eq('id', plan_id).single();
  if (!plan) return;

  if (plan.plan_type === 'event_pass' && event_id) {
    // Entitlement scopé à un événement précis (Event Pass ponctuel).
    // entitlement_type est un enum fermé qui ne contient pas 'event_pass' —
    // 'event' est la valeur la plus proche pour un accès complet à un événement.
    await supabaseAdmin.from('event_entitlements').insert({
      event_id,
      user_id: supabase_user_id,
      plan_id,
      entitlement_type: 'event',
      source: 'purchase',
      active: true,
      value: plan.features ?? {},
    });
  } else {
    // Abonnement récurrent (Everia+, Business). NOTE : ce flux simplifié crée
    // un PaymentIntent unique côté create-checkout-session plutôt qu'un
    // véritable objet Stripe Subscription (avec price_id récurrent) — pour un
    // vrai cycle de facturation automatique, remplacer par
    // stripe.subscriptions.create() et écouter customer.subscription.created.
    // `user_subscriptions` n'a pas de contrainte unique sur user_id (seulement
    // sur provider_subscription_id), donc chaque paiement réussi insère une
    // nouvelle ligne ; l'app lit toujours la plus récente (voir
    // fetchActiveSubscription dans lib/stripe.js).
    await supabaseAdmin.from('user_subscriptions').insert({
      user_id: supabase_user_id,
      plan_id,
      status: 'active',
      provider: 'stripe',
      provider_customer_id: intent.customer as string,
      current_period_start: new Date().toISOString(),
    });
  }
}

function mapStripeStatus(status: Stripe.Subscription.Status) {
  // public.subscription_status = 'trialing' | 'active' | 'past_due' | 'paused'
  // | 'cancelled' | 'expired' | 'incomplete' — ne contient PAS 'unpaid' ni
  // 'incomplete_expired', d'où le remappage vers les valeurs les plus proches.
  const map: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    incomplete: 'incomplete',
    incomplete_expired: 'expired',
    paused: 'paused',
  };
  return map[status] ?? 'incomplete';
}
