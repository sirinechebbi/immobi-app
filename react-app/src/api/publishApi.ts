import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@/config/cloudinary';
import { db } from '@/config/firebase';
import { PropertyType, Transaction } from '@/constants/propreties';

export type NewListingInput = {
  transaction: Transaction;
  propertyType: PropertyType;
  title: string;
  description: string;
  price: number;
  surfaceM2: number | null;
  rooms: number | null;
  city: string;
  address: string;
  lat: number;
  lng: number;
  photos: string[];
};

// Envoie une photo (en base64) sur Cloudinary et renvoie son URL sécurisée
export async function uploadPhoto(base64: string): Promise<string> {
  const form = new FormData();
  form.append('file', `data:image/jpeg;base64,${base64}`);
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );
  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message ?? "Échec de l'envoi de la photo.");
  }
  return data.secure_url as string;
}

// Crée l'annonce. Les champs respectent firestore.rules (validListing).
export async function createListing(
  input: NewListingInput,
  ownerId: string,
  ownerName: string | null
): Promise<string> {
  const title = input.title.trim();

  const ref = await addDoc(collection(db, 'listings'), {
    ownerId,
    ownerName,
    title,
    titleLower: title.toLowerCase(),
    description: input.description.trim(),
    propertyType: input.propertyType,
    transaction: input.transaction,
    price: input.price,
    currency: 'TND',
    surfaceM2: input.surfaceM2,
    rooms: input.rooms,
    city: input.city.trim(),
    address: input.address.trim(),
    lat: input.lat,
    lng: input.lng,
    geohash: geohashForLocation([input.lat, input.lng]),
    photos: input.photos,
    coverUrl: input.photos[0] ?? null,
    status: 'active',
    viewsCount: 0,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}