// src/lib/supabase.js
// ------------------------------------------------------------
// Client Supabase partagé par toute l'application. On utilise
// AsyncStorage pour la persistance de session (RN n'a pas de
// localStorage) et un polyfill URL car Hermes ne l'implémente
// pas complètement.
// ------------------------------------------------------------

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants/config';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[Everia] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY manquants. ' +
      'Copier .env.example vers .env et renseigner les valeurs du projet Supabase.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// Supabase a besoin d'un coup de pouce manuel pour rafraîchir le token
// quand l'app repasse au premier plan (comportement recommandé RN).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
