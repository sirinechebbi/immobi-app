
// Importation d'AsyncStorage.
// Il permet de sauvegarder des données localement sur le téléphone.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importation de create depuis Zustand.
// create permet de créer un store pour gérer l'état global.
import { create } from 'zustand';


// Clé utilisée pour identifier la donnée sauvegardée dans AsyncStorage.
// Cette clé permettra de retrouver l'information ultérieurement.
const KEY = 'onboarding_seen_v1';


// =====================================================
// 1. DÉFINITION DU TYPE ONBOARDINGSTATE
// =====================================================

// Déclaration du type OnboardingState.
// Il définit les variables et les fonctions disponibles dans le store.
type OnboardingState = {

  // Indique si l'utilisateur a déjà terminé l'onboarding.
  // false = onboarding non terminé.
  // true = onboarding terminé.
  seen: boolean;

  // Indique si les données sauvegardées ont été chargées.
  // false = chargement non terminé.
  // true = chargement terminé.
  hydrated: boolean;

  // Fonction asynchrone qui récupère l'état de l'onboarding
  // depuis AsyncStorage.
  hydrate: () => Promise<void>;

  // Fonction asynchrone appelée lorsque l'utilisateur termine
  // l'onboarding.
  complete: () => Promise<void>;

  // Fonction asynchrone qui réinitialise l'onboarding.
  reset: () => Promise<void>;
};


// =====================================================
// 2. CRÉATION DU STORE ZUSTAND
// =====================================================

// Création du store global useOnboardingStore.
// set permet de modifier les valeurs du store.
export const useOnboardingStore = create<OnboardingState>((set) => ({

  // État initial : l'utilisateur n'a pas encore terminé l'onboarding.
  seen: false,

  // État initial : les données ne sont pas encore chargées.
  hydrated: false,


  // =================================================
  // 3. FONCTION HYDRATE
  // =================================================

  // Cette fonction récupère les données sauvegardées
  // dans AsyncStorage au démarrage de l'application.
  hydrate: async () => {

    try {

      // Récupération de la valeur enregistrée sous la clé KEY.
      // getItem() retourne une chaîne de caractères ou null.
      const value = await AsyncStorage.getItem(KEY);

      // Mise à jour du store :
      // si value = '1', seen devient true.
      // sinon, seen devient false.
      // hydrated devient true car le chargement est terminé.
      set({ seen: value === '1', hydrated: true });

    } catch {

      // Si une erreur se produit pendant la lecture,
      // on considère que l'onboarding n'a pas été terminé.
      // hydrated passe quand même à true.
      set({ seen: false, hydrated: true });
    }
  },


  // =================================================
  // 4. FONCTION COMPLETE
  // =================================================

  // Cette fonction est appelée lorsque l'utilisateur
  // clique sur le bouton "Commencer".
  complete: async () => {

    // Mise à jour immédiate du store.
    // seen passe à true.
    set({ seen: true });

    try {

      // Sauvegarde de la valeur '1' dans AsyncStorage.
      // Cela permet de mémoriser que l'onboarding est terminé.
      await AsyncStorage.setItem(KEY, '1');

    } catch {

      // Si la sauvegarde échoue, aucune action supplémentaire
      // n'est effectuée.
    }
  },


  // =================================================
  // 5. FONCTION RESET
  // =================================================

  // Cette fonction permet de réinitialiser l'onboarding.
  reset: async () => {

    // Mise à jour immédiate du store.
    // seen repasse à false.
    set({ seen: false });

    try {

      // Suppression de la donnée sauvegardée dans AsyncStorage.
      // Au prochain démarrage, l'onboarding pourra être affiché.
      await AsyncStorage.removeItem(KEY);

    } catch {

      // Si la suppression échoue, aucune action supplémentaire
      // n'est effectuée.
    }
  },

}));
