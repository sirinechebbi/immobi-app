import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import { db } from '@/config/firebase';

// Show the notification even when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let currentToken: string | null = null;

// Asks permission, gets the Expo push token and saves it in users/{uid}/tokens/{token}
export async function registerForPush(uid: string): Promise<string | null> {
  if (!Device.isDevice) return null; // no push on emulators

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    console.warn('Push: projectId missing, run "npx eas-cli init"');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await setDoc(doc(db, 'users', uid, 'tokens', token), {
    platform: Platform.OS,
    updatedAt: serverTimestamp(),
  });
  currentToken = token;
  return token;
}

// Call it before signing out, so the next user of this phone does not get your pushes
export async function unregisterPush(uid: string) {
  if (!currentToken) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'tokens', currentToken));
  } catch {
    // not critical
  }
  currentToken = null;
}