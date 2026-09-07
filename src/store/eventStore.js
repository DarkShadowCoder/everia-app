// src/store/eventStore.js
// ------------------------------------------------------------
// État de "l'événement actif" — celui dans lequel l'utilisateur
// navigue actuellement (Event Home, Galerie, Moments, Défis...).
// Centralise aussi le rôle du membre courant pour piloter l'UI
// (afficher ou non les actions organisateur, modération, etc).
// ------------------------------------------------------------

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

const ORGANIZER_ROLES = ['owner', 'admin', 'moderator'];

// NOTE IMPORTANT : pas de getters isOrganizer/isOwner sur l'état lui-même —
// voir l'explication détaillée dans authStore.js (Object.assign fige la
// valeur d'un getter au moment du merge). On expose des sélecteurs purs
// (selectIsOrganizer / selectIsOwner) et une fonction isOrganizerRole
// réutilisable partout où un rôle doit être testé.

export function isOrganizerRole(role) {
  return ORGANIZER_ROLES.includes(role);
}

export const useEventStore = create((set, get) => ({
  event: null,
  membership: null,
  participationProfile: null,
  isLoading: false,
  error: null,

  loadEvent: async (eventId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const [{ data: event, error: eventError }, { data: membership }, { data: participation }] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        userId
          ? supabase.from('event_members').select('*').eq('event_id', eventId).eq('user_id', userId).maybeSingle()
          : Promise.resolve({ data: null }),
        userId
          ? supabase
              .from('event_participation_profiles')
              .select('*')
              .eq('event_id', eventId)
              .eq('user_id', userId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (eventError) throw eventError;

      set({ event, membership, participationProfile: participation, isLoading: false });
      return event;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  joinByCode: async (eventCode, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const { data: membership, error } = await supabase.rpc('join_event', {
        p_event_code: eventCode.trim().toUpperCase(),
        p_display_name: displayName ?? null,
      });
      if (error) throw error;

      const { data: event } = await supabase.from('events').select('*').eq('id', membership.event_id).single();
      set({ event, membership, isLoading: false });
      return event;
    } catch (err) {
      set({ isLoading: false, error: mapJoinError(err.message) });
      throw err;
    }
  },

  refreshParticipation: async (userId) => {
    const eventId = get().event?.id;
    if (!eventId || !userId) return;
    const { data } = await supabase
      .from('event_participation_profiles')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
    set({ participationProfile: data });
  },

  clear: () => set({ event: null, membership: null, participationProfile: null, error: null }),
}));

export const selectIsOrganizer = (state) => isOrganizerRole(state.membership?.role);
export const selectIsOwner = (state) => state.membership?.role === 'owner';

function mapJoinError(message) {
  const map = {
    EVENT_NOT_FOUND: "Aucun événement ne correspond à ce code.",
    EVENT_CLOSED: 'Cet événement est terminé ou a été annulé.',
    JOIN_NOT_ALLOWED: "L'organisateur a désactivé l'accès par code pour cet événement.",
    UNAUTHENTICATED: 'Vous devez être connecté pour rejoindre un événement.',
  };
  return map[message] || message || "Impossible de rejoindre l'événement.";
}
