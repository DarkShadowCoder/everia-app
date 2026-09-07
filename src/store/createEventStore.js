// src/store/createEventStore.js
// État temporaire du flux de création d'événement en plusieurs étapes
// (Nom -> Type -> Date/Lieu -> Confidentialité -> Révision -> Créer).
import { create } from 'zustand';

const initialDraft = {
  name: '',
  category: 'wedding',
  description: '',
  startAt: null,
  endAt: null,
  timezone: 'Europe/Paris',
  venueName: '',
  visibility: 'invite_only', // public | invite_only | code_only | private
};

export const useCreateEventStore = create((set) => ({
  draft: { ...initialDraft },
  isSubmitting: false,
  setField: (key, value) => set((state) => ({ draft: { ...state.draft, [key]: value } })),
  reset: () => set({ draft: { ...initialDraft }, isSubmitting: false }),
  setSubmitting: (v) => set({ isSubmitting: v }),
}));
