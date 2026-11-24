import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  useFonts,
} from '@expo-google-fonts/lora';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { AnimatedSplash } from '@/components/AnimatedSplash';
import { auth } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const MIN_SPLASH_MS = 1800;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
  });

  const authInitializing = useAuthStore((s) => s.initializing);
  const setUser = useAuthStore((s) => s.setUser);

  const seen = useOnboardingStore((s) => s.seen);
  const hydrated = useOnboardingStore((s) => s.hydrated);
  const hydrate = useOnboardingStore((s) => s.hydrate);

  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync(); // the animated splash takes over
    hydrate();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    const timer = setTimeout(() => setMinTimePassed(true), MIN_SPLASH_MS);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [hydrate, setUser]);

  const ready = hydrated && !authInitializing && minTimePassed && (fontsLoaded || !!fontError);
  const user = useAuthStore((s) => s.user);



// Open the right conversation when a notification is tapped
useEffect(() => {
  if (!ready) return;
  const open = (n?: Notifications.Notification) => {
    const data = n?.request.content.data as { conversationId?: string } | undefined;
    if (data?.conversationId) {
      router.push({
        pathname: '/conversation/[id]',
        params: { id: data.conversationId },
      } as any);
    }
  };
  Notifications.getLastNotificationResponseAsync().then((r) => open(r?.notification));
  const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification));
  return () => sub.remove();
}, [ready]);
  if (!ready) return <AnimatedSplash />;

  // No check on the user here: visitors reach (tabs) as soon as the onboarding is seen.
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Protected guard={!seen}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={seen} >
        <Stack.Screen
            name="map"
            options={{ headerShown: true, title: 'Carte', headerTintColor: colors.primary }}
          />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="listing/[id]"
          options={{ headerShown: true, title: 'Annonce', headerTintColor: colors.primary }}
        />
        <Stack.Screen
          name="conversation/[id]"
          options={{ headerShown: true, title: 'Discussion', headerTintColor: colors.primary }}
        />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}