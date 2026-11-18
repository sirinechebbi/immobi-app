import { Lora_400Regular, Lora_500Medium, Lora_600SemiBold, Lora_700Bold, useFonts } from '@expo-google-fonts/lora';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { AnimatedSplash } from '@/components/AnimatedSplash';
import { auth } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { colors } from '@/theme';


SplashScreen.preventAutoHideAsync();

const MIN_SPLASH_MS = 1800;

export default function RootLayout() {
  const authInitializing = useAuthStore((s) => s.initializing);
  const setUser = useAuthStore((s: { setUser: any; }) => s.setUser);

  const seen = useOnboardingStore((s) => s.seen);
  const hydrated = useOnboardingStore((s) => s.hydrated);
  const hydrate = useOnboardingStore((s) => s.hydrate);

  // Les polices Lora de theme.ts n'étaient jamais chargées : on les charge ici.
  const [fontsLoaded, fontError] = useFonts({ Lora_400Regular, Lora_500Medium, Lora_600SemiBold, Lora_700Bold });

  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync(); // l'écran d'ouverture animé prend le relais
    hydrate();
    const unsubscribe = auth.onAuthStateChanged(setUser);
    const timer = setTimeout(() => setMinTimePassed(true), MIN_SPLASH_MS);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [hydrate, setUser]);

  const ready = hydrated && !authInitializing && minTimePassed && (fontsLoaded || !!fontError);
  if (!ready) return <AnimatedSplash />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Protected guard={!seen}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={seen}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="listing/[id]"
          options={{ headerShown: true, title: 'Annonce', headerTintColor: colors.primary }}
        />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}