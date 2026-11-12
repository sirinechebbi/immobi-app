
// =====================================================
// 1. IMPORTATION DES POLICES
// =====================================================

// Importation des différentes variantes de la police Lora.
// Chaque variante correspond à un style différent :
// 400 = Regular (normal)
// 500 = Medium (moyen)
// 600 = SemiBold (semi-gras)
// 700 = Bold (gras)
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  useFonts,
} from '@expo-google-fonts/lora';


// =====================================================
// 2. IMPORTATION DE LA NAVIGATION ET DU SPLASH SCREEN
// =====================================================

// Stack permet de gérer la navigation entre les écrans.
// Il permet d'afficher les pages sous forme de pile.
import { Stack } from 'expo-router';

// SplashScreen permet de contrôler l'écran de démarrage natif
// affiché automatiquement au lancement de l'application.
import * as SplashScreen from 'expo-splash-screen';


// =====================================================
// 3. IMPORTATION DE FIREBASE AUTHENTICATION
// =====================================================

// onAuthStateChanged permet de surveiller l'état de connexion.
// Cette fonction détecte si un utilisateur est connecté,
// déconnecté ou si son état de connexion change.
import { onAuthStateChanged } from 'firebase/auth';


// Importation des hooks React.
import { useEffect, useState } from 'react';


// =====================================================
// 4. IMPORTATION DES COMPOSANTS ET DES STORES
// =====================================================

// Composant qui affiche le logo avec une animation.
import { AnimatedSplash } from '@/components/AnimatedSplash';

// Instance Firebase Authentication configurée dans le projet.
import { auth } from '@/config/firebase';

// Store Zustand qui gère l'authentification de l'utilisateur.
import { useAuthStore } from '@/store/authStore';

// Store Zustand qui gère l'état de l'Onboarding.
import { useOnboardingStore } from '@/store/onboardingStore';


// =====================================================
// 5. CONFIGURATION DU SPLASH SCREEN NATIF
// =====================================================

// Empêche automatiquement la disparition du Splash Screen natif.
// Il restera affiché jusqu'à ce que l'application appelle
// explicitement SplashScreen.hideAsync().
SplashScreen.preventAutoHideAsync();


// Définition de la durée minimale du Splash Screen.
// 1800 millisecondes = 1,8 seconde.
const MIN_SPLASH_MS = 1800;


// =====================================================
// 6. COMPOSANT PRINCIPAL : ROOTLAYOUT
// =====================================================

// RootLayout est le composant racine de la navigation.
// Il contrôle le chargement de l'application et décide
// quels écrans doivent être accessibles.
export default function RootLayout() {


  // =====================================================
  // 7. CHARGEMENT DES POLICES
  // =====================================================

  // useFonts charge les différentes variantes de la police Lora.
  // fontsLoaded devient true lorsque toutes les polices sont chargées.
  const [fontsLoaded] = useFonts({

    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,

  });


  // =====================================================
  // 8. RÉCUPÉRATION DE L'ÉTAT D'AUTHENTIFICATION
  // =====================================================

  // Récupération de initializing depuis le store d'authentification.
  // Cette variable indique si Firebase a terminé
  // l'initialisation de l'état de connexion.
  const authInitializing = useAuthStore((s) => s.initializing);

  // Récupération de la fonction setUser.
  // Elle permet de mettre à jour l'utilisateur dans Zustand
  // lorsque Firebase détecte un changement de connexion.
  const setUser = useAuthStore((s) => s.setUser);


  // =====================================================
  // 9. RÉCUPÉRATION DE L'ÉTAT DE L'ONBOARDING
  // =====================================================

  // seen indique si l'utilisateur a déjà terminé l'Onboarding.
  const seen = useOnboardingStore((s) => s.seen);

  // hydrated indique si les données de l'Onboarding
  // ont été récupérées depuis AsyncStorage.
  const hydrated = useOnboardingStore((s) => s.hydrated);

  // hydrate permet de récupérer les données sauvegardées.
  const hydrate = useOnboardingStore((s) => s.hydrate);


  // =====================================================
  // 10. GESTION DE LA DURÉE MINIMALE DU SPLASH SCREEN
  // =====================================================

  // Création d'un état pour savoir si les 1,8 seconde
  // d'affichage minimum sont écoulées.
  // false = durée non écoulée.
  // true = durée écoulée.
  const [minTimePassed, setMinTimePassed] = useState(false);


  // =====================================================
  // 11. INITIALISATION DE L'APPLICATION
  // =====================================================

  useEffect(() => {

    // Masque le Splash Screen natif d'Expo.
    // Le composant AnimatedSplash prend ensuite le relais
    // tant que l'application n'est pas prête.
    SplashScreen.hideAsync();

    // Récupération de l'état de l'Onboarding
    // depuis AsyncStorage.
    hydrate();

    // Surveillance de l'état de connexion Firebase.
    // Lorsque l'état change, setUser met à jour le store.
    const unsubscribe = onAuthStateChanged(auth, setUser);

    // Création d'un minuteur de 1800 millisecondes.
    // À la fin du délai, minTimePassed devient true.
    const timer = setTimeout(
      () => setMinTimePassed(true),
      MIN_SPLASH_MS
    );

    // Fonction de nettoyage exécutée lorsque le composant
    // est démonté ou que les dépendances changent.
    return () => {

      // Arrête l'écoute des changements d'authentification.
      unsubscribe();

      // Annule le minuteur pour éviter une exécution inutile.
      clearTimeout(timer);
    };

  // Le useEffect dépend des fonctions hydrate et setUser.
  // Il est exécuté au montage du composant.
  }, [hydrate, setUser]);


  // =====================================================
  // 12. VÉRIFICATION : L'APPLICATION EST-ELLE PRÊTE ?
  // =====================================================

  // L'application est considérée comme prête uniquement si :
  // 1. Les polices sont chargées.
  // 2. Les données de l'Onboarding sont récupérées.
  // 3. Firebase a terminé son initialisation.
  // 4. Le délai minimum du Splash Screen est écoulé.
  const ready =
    fontsLoaded &&
    hydrated &&
    !authInitializing &&
    minTimePassed;


  // Si au moins une condition n'est pas satisfaite,
  // on affiche le logo animé.
  if (!ready) return <AnimatedSplash />;


  // =====================================================
  // 13. CONFIGURATION DE LA NAVIGATION
  // =====================================================

  // Lorsque toutes les conditions sont satisfaites,
  // on affiche le système de navigation de l'application.
  return (

    // Stack représente la navigation principale.
    <Stack
      screenOptions={{
        headerShown: false, // Masque les en-têtes de navigation.
        animation: 'fade', // Transition en fondu entre les écrans.
      }}
    >

      {/* PROTECTION DE L'ÉCRAN ONBOARDING */}

      {/* L'écran onboarding est accessible uniquement
          si seen = false, donc si l'utilisateur n'a pas
          encore terminé l'Onboarding. */}
      <Stack.Protected guard={!seen}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>


      {/* Le groupe (tabs) est accessible uniquement
          si seen = true, donc si l'Onboarding est terminé. */}
      <Stack.Protected guard={seen}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

    </Stack>
  );
}
