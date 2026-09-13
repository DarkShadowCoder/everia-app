// src/constants/config.js
// ============================================================
// EVERIA — PUBLIC APP CONFIG
// ============================================================

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export const EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  null;

export const APP_SCHEME =
  process.env.EXPO_PUBLIC_APP_SCHEME ||
  'everia';

export const APP_VERSION =
  process.env.EXPO_PUBLIC_APP_VERSION ||
  '1.0.0';

/**
 * URL publique de l'expérience invitée dans le navigateur.
 * Une valeur HTTPS est volontairement requise en production : le QR code
 * ne doit pas imposer d'installer l'application avant de participer.
 */
export const WEB_APP_URL =
  process.env.EXPO_PUBLIC_WEB_APP_URL ||
  null;

export const STORAGE_BUCKET =
  process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET ||
  'event-media';

export const PAGINATION = {
  defaultLimit:
    25,

  maxLimit:
    100,
};
