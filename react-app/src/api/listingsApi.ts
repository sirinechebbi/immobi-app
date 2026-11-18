import {
    collection,
    doc,
    DocumentSnapshot,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import { PropertyType, Transaction } from '@/constants/propreties';

export type Listing = {
  id: string;
  ownerId: string;
  title: string;
  propertyType: PropertyType;
  transaction: Transaction;
  price: number;
  currency: string;
  surfaceM2: number | null;
  rooms: number | null;
  city: string | null;
  lat: number;
  lng: number;
  photos: string[];
  coverUrl: string | null;
  description: string;
  createdAt: number | null;
};

function fromDoc(snap: DocumentSnapshot): Listing {
  const x = snap.data() ?? {};
  const photos: string[] = Array.isArray(x.photos) ? x.photos : [];
  return {
    id: snap.id,
    ownerId: x.ownerId,
    title: x.title ?? '',
    propertyType: x.propertyType ?? 'autre',
    transaction: x.transaction ?? 'vente',
    price: x.price ?? 0,
    currency: x.currency ?? 'TND',
    surfaceM2: x.surfaceM2 ?? null,
    rooms: x.rooms ?? null,
    city: x.city ?? null,
    lat: x.lat,
    lng: x.lng,
    photos,
    // coverUrl est calculé par la Cloud Function onListingWritten
    coverUrl: x.coverUrl ?? photos[0] ?? null,
    description: x.description ?? '',
    createdAt: x.createdAt?.toMillis?.() ?? null,
  };
}

/**
 * Dernières annonces actives. Lisible SANS connexion :
 * firestore.rules autorise la lecture si status == 'active'
 * (la requête doit donc contenir where('status', '==', 'active')).
 * Index utilisé : status ASC + createdAt DESC (déjà dans firestore.indexes.json).
 */
export async function fetchLatestListings(max = 40): Promise<Listing[]> {
  const q = query(
    collection(db, 'listings'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map(fromDoc);
}

export async function fetchListing(id: string): Promise<Listing | null> {
  const snap = await getDoc(doc(db, 'listings', id));
  return snap.exists() ? fromDoc(snap) : null;
}

export function formatPrice(l: Pick<Listing, 'price' | 'currency' | 'transaction'>): string {
  const n = Math.round(l.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const cur = l.currency === 'TND' ? 'DT' : l.currency;
  return `${n} ${cur}${l.transaction === 'location' ? ' /mois' : ''}`;
}

export function timeAgo(ms: number | null): string {
  if (!ms) return "Aujourd'hui";
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  if (d <= 0) return "Aujourd'hui";
  if (d === 1) return 'Hier';
  return `Il y a ${d} j`;
}