// supabase/functions/create-checkout-session/index.ts
// ------------------------------------------------------------
// Edge Function Deno. Crée (ou réutilise) le customer Stripe de
// l'utilisateur, puis un PaymentIntent pour le plan demandé, et
// renvoie tout ce qu'il faut au client pour ouvrir le PaymentSheet
// natif (@stripe/stripe-react-native). La clé secrète Stripe ne
// quitte jamais cette fonction.
//
// Secrets requis (supabase secrets set ...):
//   STRIPE_SECRET_KEY
//   SUPABASE_URL (auto-injecté)
//   SUPABASE_SERVICE_ROLE_KEY (auto-injecté)
// ------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@16.2.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: corsHeaders });
    }
    const user = userData.user;

    const { planCode, eventId } = await req.json();

    const { data: plan, error: planError } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('code', planCode)
      .eq('active', true)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan introuvable' }), { status: 404, headers: corsHeaders });
    }

    // Récupère ou crée le customer Stripe, et le mémorise dans user_settings.metadata
    const { data: profile } = await supabase.from('profiles').select('metadata').eq('id', user.id).single();
    let customerId = profile?.metadata?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from('profiles')
        .update({ metadata: { ...(profile?.metadata ?? {}), stripe_customer_id: customerId } })
        .eq('id', user.id);
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-06-20' }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price_cents,
      currency: plan.currency.toLowerCase(),
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        supabase_user_id: user.id,
        plan_id: plan.id,
        plan_code: plan.code,
        event_id: eventId ?? '',
      },
    });

    // Enregistre le paiement en `pending` — le webhook le fera passer à `succeeded`/`failed`.
    await supabase.from('payments').insert({
      user_id: user.id,
      event_id: eventId ?? null,
      plan_id: plan.id,
      provider: 'stripe',
      provider_customer_id: customerId,
      provider_payment_intent_id: paymentIntent.id,
      status: 'pending',
      amount_cents: plan.price_cents,
      currency: plan.currency,
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customerId,
        paymentIntentId: paymentIntent.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
