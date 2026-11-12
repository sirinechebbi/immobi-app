import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const KEY = 'onboarding_seen_v1';

type OnboardingState = {
  seen: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  seen: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const value = await AsyncStorage.getItem(KEY);
      set({ seen: value === '1', hydrated: true });
    } catch {
      set({ seen: false, hydrated: true });
    }
  },

  complete: async () => {
    set({ seen: true });
    try {
      await AsyncStorage.setItem(KEY, '1');
    } catch {}
  },

  reset: async () => {
    set({ seen: false });
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {}
  },
}));