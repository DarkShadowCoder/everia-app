// src/store/uiStore.js
import { create } from 'zustand';

let toastTimer = null;

export const useUIStore = create((set) => ({
  toast: null, // { message, type: 'success' | 'error' | 'warning' | 'info' }

  showToast: (message, type = 'info', duration = 3000) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: { message, type, key: Date.now() } });
    toastTimer = setTimeout(() => set({ toast: null }), duration);
  },

  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: null });
  },
}));
