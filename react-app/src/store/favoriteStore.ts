import { create } from 'zustand';

import { addFavorite, fetchFavoriteIds, removeFavorite } from '@/api/favoritesApi';

type State = {
  uid: string | null;
  ids: Set<string>;
  ensureLoaded: (uid: string) => Promise<void>;
  add: (uid: string, id: string) => Promise<void>;
  remove: (uid: string, id: string) => Promise<void>;
  toggle: (uid: string, id: string) => Promise<void>;
};

export const useFavoritesStore = create<State>((set, get) => ({
  uid: null,
  ids: new Set(),

  // Charge les favoris une seule fois par utilisateur
  ensureLoaded: async (uid) => {
    if (get().uid === uid) return;
    set({ uid, ids: new Set() });
    try {
      const ids = await fetchFavoriteIds(uid);
      if (get().uid === uid) set({ ids: new Set(ids) });
    } catch {
      set({ uid: null }); // réessaiera au prochain appel
    }
  },

  add: async (uid, id) => {
    set((s) => ({ ids: new Set(s.ids).add(id) }));
    try {
      await addFavorite(uid, id);
    } catch (e) {
      set((s) => {
        const next = new Set(s.ids);
        next.delete(id);
        return { ids: next };
      });
      throw e;
    }
  },

  remove: async (uid, id) => {
    set((s) => {
      const next = new Set(s.ids);
      next.delete(id);
      return { ids: next };
    });
    try {
      await removeFavorite(uid, id);
    } catch (e) {
      set((s) => ({ ids: new Set(s.ids).add(id) }));
      throw e;
    }
  },

  toggle: async (uid, id) => {
    if (get().ids.has(id)) await get().remove(uid, id);
    else await get().add(uid, id);
  },
}));