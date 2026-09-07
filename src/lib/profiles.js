// src/lib/profiles.js
// ------------------------------------------------------------
// Beaucoup de tables (media.uploader_user_id, event_members.user_id,
// comments.user_id, guestbook_entries.user_id, user_badges.user_id,
// event_participation_profiles.user_id...) déclarent leur clé étrangère
// vers `auth.users(id)`, PAS vers `public.profiles(id)`. `public.profiles`
// référence lui aussi `auth.users(id)`, mais il n'existe pas de FK directe
// entre ces tables et `profiles` : PostgREST ne peut donc PAS résoudre un
// embed imbriqué du type `.select('*, profiles:user_id(display_name)')`
// dans ce schéma (il exigerait une contrainte de clé étrangère directe).
//
// On récupère donc les profils correspondants en une requête séparée et on
// les fusionne côté client avec ce helper, plutôt que de compter sur un
// embed qui échouerait silencieusement ou lèverait une erreur PostgREST.
// ------------------------------------------------------------

import { supabase } from './supabase';

export async function fetchProfilesByIds(ids) {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))];
  if (!uniqueIds.length) return {};
  const { data, error } = await supabase.from('profiles').select('id, display_name, avatar_path').in('id', uniqueIds);
  if (error) throw error;
  const map = {};
  (data || []).forEach((p) => {
    map[p.id] = p;
  });
  return map;
}

/** Associe à chaque ligne son profil via `userIdKey`, sous la clé `profileKey`. */
export function attachProfiles(rows, profilesById, userIdKey, profileKey = 'profile') {
  return (rows || []).map((row) => ({ ...row, [profileKey]: profilesById[row[userIdKey]] || null }));
}
