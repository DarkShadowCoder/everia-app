// src/lib/productCatalog.js
// ============================================================
// EVERIA — PRODUCT CATALOG
// ============================================================
//
// Source de vérité côté produit pour les noms, prix affichés,
// bénéfices et entitlements des offres Everia.
//
// Les montants définitifs et l'activation restent pilotés côté base
// (`billing_plans`) : le catalogue permet à l'interface de rester
// cohérente, tandis que le serveur reste la source d'autorité pour
// l'accès et les paiements.
// ============================================================

export const PAYWALL_MODES = {
  EVENT: 'event',
  PROFESSIONAL: 'professional',
};

export const EVENT_PLAN_CODES = [
  'memory_event',
  'memory_experience',
  'signature',
];

export const PROFESSIONAL_PLAN_CODES = [
  'pro_solo',
  'pro_agency',
  'business_venue',
];

export const PRODUCT_CATALOG = {
  memory_event: {
    code: 'memory_event',
    mode: PAYWALL_MODES.EVENT,
    name: 'Memory Event',
    tagline: 'Collecter chaque perspective',
    priceCents: 3900,
    currency: 'EUR',
    billingInterval: 'one_time',
    planType: 'event_pass',
    outcome: 'Une galerie vivante que tout le monde peut enrichir.',
    included: [
      '300 photos et vidéos',
      'Invités illimités',
      'QR et lien personnalisés',
      '10 défis pour lancer la participation',
      '3 mois de conservation',
    ],
    entitlements: [
      'EVENT_BASIC',
      'VIDEO_UPLOAD',
      'CUSTOM_BRANDING',
    ],
  },

  memory_experience: {
    code: 'memory_experience',
    mode: PAYWALL_MODES.EVENT,
    name: 'Memory Experience',
    badge: 'LE PLUS CHOISI',
    tagline: 'Offrir une histoire à chacun',
    priceCents: 8900,
    currency: 'EUR',
    billingInterval: 'one_time',
    planType: 'event_pass',
    outcome: 'Chaque invité repart avec son histoire personnelle.',
    included: [
      'Tout Memory Event',
      'Live Wall et analytics avancées',
      'Replay collectif',
      'Jusqu’à 25 replays personnels',
      '12 mois de conservation et sans branding',
    ],
    entitlements: [
      'EVENT_EXPERIENCE',
      'VIDEO_UPLOAD',
      'AI_MEMORY',
      'AI_REPLAY',
      'ADVANCED_BRANDING',
      'ANALYTICS',
    ],
  },

  signature: {
    code: 'signature',
    mode: PAYWALL_MODES.EVENT,
    name: 'Signature',
    tagline: 'Créer une expérience qui marque',
    priceCents: 19900,
    currency: 'EUR',
    billingInterval: 'one_time',
    planType: 'event_pass',
    outcome: 'Une expérience événementielle entièrement à votre image.',
    included: [
      'Tout Memory Experience',
      'Replays personnels illimités',
      'Thèmes, domaine et mini-site premium',
      'RSVP, tables et contrôle d’accès avancés',
      '24 mois de conservation et export complet',
    ],
    entitlements: [
      'EVENT_SIGNATURE',
      'VIDEO_UPLOAD',
      'AI_MEMORY',
      'AI_REPLAY',
      'ADVANCED_BRANDING',
      'CUSTOM_DOMAIN',
      'EXTENDED_STORAGE',
      'EXPORT',
    ],
  },

  pro_solo: {
    code: 'pro_solo',
    mode: PAYWALL_MODES.PROFESSIONAL,
    name: 'Pro Solo',
    tagline: 'Professionnaliser vos événements',
    priceCents: 4900,
    currency: 'EUR',
    billingInterval: 'month',
    planType: 'subscription',
    outcome: 'Une offre premium prête à revendre à vos clients.',
    included: [
      '3 événements actifs',
      '300 invités par événement',
      '3 collaborateurs',
      'Branding professionnel et analytics',
      'Replays et bibliothèque de défis',
    ],
    entitlements: [
      'PRO_SOLO',
      'VIDEO_UPLOAD',
      'AI_REPLAY',
      'CUSTOM_BRANDING',
      'ANALYTICS',
    ],
  },

  pro_agency: {
    code: 'pro_agency',
    mode: PAYWALL_MODES.PROFESSIONAL,
    name: 'Pro Agency',
    badge: 'MEILLEURE VALEUR',
    tagline: 'Industrialiser votre offre',
    priceCents: 14900,
    currency: 'EUR',
    billingInterval: 'month',
    planType: 'subscription',
    outcome: 'Un espace pour déployer une expérience premium, client après client.',
    included: [
      '15 événements actifs',
      '10 collaborateurs et rôles avancés',
      'Espaces clients et templates d’agence',
      'Reporting et duplication d’événements',
      'Branding agence et sous-comptes',
    ],
    entitlements: [
      'PRO_AGENCY',
      'VIDEO_UPLOAD',
      'AI_REPLAY',
      'CUSTOM_BRANDING',
      'CLIENT_PORTAL',
      'TEMPLATES',
      'ANALYTICS',
    ],
  },

  business_venue: {
    code: 'business_venue',
    mode: PAYWALL_MODES.PROFESSIONAL,
    name: 'Business Venue',
    tagline: 'Intégrer Everia à votre lieu',
    priceCents: 39900,
    currency: 'EUR',
    billingInterval: 'month',
    planType: 'subscription',
    outcome: 'Une nouvelle ligne de valeur pour chaque événement accueilli.',
    included: [
      'Multi-événements et utilisateurs internes',
      'Branding et modèles réutilisables',
      'Analytics multi-événements',
      'Export CRM et API',
      'Stockage renforcé et support prioritaire',
    ],
    entitlements: [
      'BUSINESS',
      'VIDEO_UPLOAD',
      'AI_REPLAY',
      'CUSTOM_BRANDING',
      'API',
      'ANALYTICS',
      'EXTENDED_STORAGE',
    ],
  },
};

export function isPaywallMode(value) {
  return Object.values(PAYWALL_MODES).includes(value);
}

export function getPlanCodesForMode(mode) {
  return mode === PAYWALL_MODES.PROFESSIONAL
    ? PROFESSIONAL_PLAN_CODES
    : EVENT_PLAN_CODES;
}

export function getCatalogPlan(code) {
  return PRODUCT_CATALOG[code] || null;
}

export function getCatalogPlans(mode) {
  return getPlanCodesForMode(mode)
    .map(getCatalogPlan)
    .filter(Boolean);
}

/**
 * Fait prévaloir le plan activé côté serveur sur les valeurs d'affichage
 * intégrées, tout en conservant le contenu produit de la nouvelle offre.
 */
export function mergePlanWithCatalog(plan) {
  const catalogPlan = getCatalogPlan(plan?.code);

  if (!catalogPlan) {
    return plan || null;
  }

  return {
    ...catalogPlan,
    ...plan,
    priceCents: Number.isFinite(plan?.price_cents)
      ? plan.price_cents
      : catalogPlan.priceCents,
    currency: plan?.currency || catalogPlan.currency,
    billingInterval: plan?.billing_interval || catalogPlan.billingInterval,
    planType: plan?.plan_type || catalogPlan.planType,
  };
}
