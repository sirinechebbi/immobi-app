import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '@/config/firebase';

export async function signIn(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUp(fullName: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: fullName.trim() });

  // Profil public : les règles Firestore n'autorisent que ces 3 champs
  await setDoc(doc(db, 'users', cred.user.uid), {
    fullName: fullName.trim(),
    avatarUrl: null,
    createdAt: serverTimestamp(),
  });
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export function logOut() {
  return signOut(auth);
}

export function authErrorMessage(e: unknown): string {
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'auth/invalid-email':
        return 'Adresse e-mail invalide.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou mot de passe incorrect.';
      case 'auth/email-already-in-use':
        return 'Cette adresse e-mail est déjà utilisée.';
      case 'auth/weak-password':
        return 'Mot de passe trop faible (6 caractères minimum).';
      case 'auth/network-request-failed':
        return 'Pas de connexion internet.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Réessayez plus tard.';
      case 'auth/operation-not-allowed':
        return 'Connexion par e-mail non activée dans Firebase.';
      case 'permission-denied':
        return 'Accès refusé par les règles de sécurité.';
    }
    return `Erreur (${e.code}).`;
  }
  return 'Une erreur est survenue.';
}