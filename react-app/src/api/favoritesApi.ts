import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { Listing, fetchListing } from '@/api/listingsApi';
import { db } from '@/config/firebase';

const favDoc = (uid: string, listingId: string) =>
  doc(db, 'users', uid, 'favorites', listingId);

export async function addFavorite(uid: string, listingId: string) {
  await setDoc(favDoc(uid, listingId), { listingId, createdAt: serverTimestamp() });
}

export async function removeFavorite(uid: string, listingId: string) {
  await deleteDoc(favDoc(uid, listingId));
}

// Identifiants des favoris, du plus récent au plus ancien
export async function fetchFavoriteIds(uid: string): Promise<string[]> {
  const q = query(collection(db, 'users', uid, 'favorites'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

// Annonces complètes. Une annonce supprimée ou archivée est ignorée.
export async function fetchFavoriteListings(uid: string): Promise<Listing[]> {
  const ids = await fetchFavoriteIds(uid);
  const results = await Promise.all(ids.map((id) => fetchListing(id).catch(() => null)));
  return results.filter((l): l is Listing => l !== null);
}