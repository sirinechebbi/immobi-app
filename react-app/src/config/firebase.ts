import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-ignore : la fonction existe à l'exécution mais manque dans les types TypeScript
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDJ3xfKDZS96-CtgKpFKCsWVgK5d0o5mKY",
  authDomain: "immo-app-b9a61.firebaseapp.com",
  projectId: "immo-app-b9a61",
  storageBucket: "immo-app-b9a61.firebasestorage.app",
  messagingSenderId: "180401763783",
  appId: "1:180401763783:web:1ebe3f4e2177965fa095e2",
  measurementId: "G-4HZFJF99YK"
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  try {
    // Garde la session ouverte après fermeture de l'app
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Déjà initialisé (rechargement à chaud)
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);