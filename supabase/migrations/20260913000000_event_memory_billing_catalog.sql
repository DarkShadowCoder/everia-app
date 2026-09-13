-- ============================================================
-- EVERIA — EVENT MEMORY B2B2C BILLING CATALOG
-- ============================================================
-- Aligne les offres serveur avec la spécification produit 2026.
-- Les entitlements et limites restent des données : les écrans ne doivent
-- jamais déduire l'accès d'un simple nom de plan.
-- ============================================================

begin;

alter table public.billing_plans
  add column if not exists stripe_price_id text;

create unique index if not exists billing_plans_code_unique
  on public.billing_plans (code);

insert into public.billing_plans (
  code,
  name,
  description,
  price_cents,
  currency,
  billing_interval,
  plan_type,
  features,
  active
)
values
  (
    'free',
    'Free / Try',
    'Découvrir Everia et lancer un premier événement.',
    0,
    'EUR',
    'one_time',
    'event_pass',
    jsonb_build_object(
      'list', jsonb_build_array(
        '1 événement actif',
        '50 invités',
        '50 médias',
        'QR et lien',
        '3 défis',
        'Stockage court'
      ),
      'entitlements', jsonb_build_array('EVENT_BASIC'),
      'limits', jsonb_build_object(
        'active_events', 1,
        'guests', 50,
        'media', 50,
        'challenges', 3,
        'storage_months', 1
      )
    ),
    true
  ),
  (
    'memory_event',
    'Memory Event',
    'Collecter chaque perspective.',
    3900,
    'EUR',
    'one_time',
    'event_pass',
    jsonb_build_object(
      'list', jsonb_build_array(
        '300 photos et vidéos',
        'Invités illimités',
        'QR et lien personnalisés',
        '10 défis',
        '3 mois de conservation'
      ),
      'entitlements', jsonb_build_array(
        'EVENT_BASIC',
        'VIDEO_UPLOAD',
        'CUSTOM_BRANDING'
      ),
      'limits', jsonb_build_object(
        'media', 300,
        'challenges', 10,
        'storage_months', 3
      )
    ),
    true
  ),
  (
    'memory_experience',
    'Memory Experience',
    'Offrir une histoire à chacun.',
    8900,
    'EUR',
    'one_time',
    'event_pass',
    jsonb_build_object(
      'list', jsonb_build_array(
        'Tout Memory Event',
        'Live Wall et analytics avancées',
        'Replay collectif',
        '25 replays personnels',
        '12 mois de conservation'
      ),
      'entitlements', jsonb_build_array(
        'EVENT_EXPERIENCE',
        'VIDEO_UPLOAD',
        'AI_MEMORY',
        'AI_REPLAY',
        'ADVANCED_BRANDING',
        'ANALYTICS'
      ),
      'limits', jsonb_build_object(
        'media', 'fair_use',
        'challenges', 25,
        'personal_replays', 25,
        'storage_months', 12
      )
    ),
    true
  ),
  (
    'signature',
    'Signature',
    'Créer une expérience entièrement à votre image.',
    19900,
    'EUR',
    'one_time',
    'event_pass',
    jsonb_build_object(
      'list', jsonb_build_array(
        'Replays personnels illimités',
        'Thèmes, domaine et mini-site premium',
        'RSVP et tables',
        '24 mois de conservation',
        'Export complet'
      ),
      'entitlements', jsonb_build_array(
        'EVENT_SIGNATURE',
        'VIDEO_UPLOAD',
        'AI_MEMORY',
        'AI_REPLAY',
        'ADVANCED_BRANDING',
        'CUSTOM_DOMAIN',
        'EXTENDED_STORAGE',
        'EXPORT'
      ),
      'limits', jsonb_build_object(
        'media', 'fair_use',
        'challenges', 'unlimited',
        'personal_replays', 'unlimited',
        'storage_months', 24
      )
    ),
    true
  ),
  (
    'pro_solo',
    'Pro Solo',
    'Professionnaliser vos événements.',
    4900,
    'EUR',
    'month',
    'subscription',
    jsonb_build_object(
      'list', jsonb_build_array(
        '3 événements actifs',
        '300 invités par événement',
        '3 collaborateurs',
        'Branding professionnel',
        'Analytics et replays'
      ),
      'entitlements', jsonb_build_array(
        'PRO_SOLO',
        'VIDEO_UPLOAD',
        'AI_REPLAY',
        'CUSTOM_BRANDING',
        'ANALYTICS'
      ),
      'limits', jsonb_build_object(
        'active_events', 3,
        'guests_per_event', 300,
        'collaborators', 3
      )
    ),
    true
  ),
  (
    'pro_agency',
    'Pro Agency',
    'Industrialiser votre offre événementielle.',
    14900,
    'EUR',
    'month',
    'subscription',
    jsonb_build_object(
      'list', jsonb_build_array(
        '15 événements actifs',
        '10 collaborateurs',
        'Espaces clients et templates',
        'Reporting et duplication',
        'Branding agence'
      ),
      'entitlements', jsonb_build_array(
        'PRO_AGENCY',
        'VIDEO_UPLOAD',
        'AI_REPLAY',
        'CUSTOM_BRANDING',
        'CLIENT_PORTAL',
        'TEMPLATES',
        'ANALYTICS'
      ),
      'limits', jsonb_build_object(
        'active_events', 15,
        'collaborators', 10
      )
    ),
    true
  ),
  (
    'business_venue',
    'Business Venue',
    'Intégrer Everia à votre lieu ou activité.',
    39900,
    'EUR',
    'month',
    'subscription',
    jsonb_build_object(
      'list', jsonb_build_array(
        'Multi-événements',
        'Utilisateurs internes',
        'Branding du lieu',
        'Export CRM et API',
        'Support prioritaire'
      ),
      'entitlements', jsonb_build_array(
        'BUSINESS',
        'VIDEO_UPLOAD',
        'AI_REPLAY',
        'CUSTOM_BRANDING',
        'API',
        'ANALYTICS',
        'EXTENDED_STORAGE'
      ),
      'limits', jsonb_build_object(
        'active_events', 'custom',
        'collaborators', 'custom'
      )
    ),
    true
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  billing_interval = excluded.billing_interval,
  plan_type = excluded.plan_type,
  features = excluded.features,
  active = excluded.active;

commit;
