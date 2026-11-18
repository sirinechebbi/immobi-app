import * as Location from 'expo-location';

export type Coords = { lat: number; lng: number };

export async function getCurrentCoords(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Autorisation de localisation refusée.');
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

export async function geocodeAddress(query: string): Promise<Coords | null> {
  const results = await Location.geocodeAsync(query);
  if (!results.length) return null;
  return { lat: results[0].latitude, lng: results[0].longitude };
}

// Ville et rue à partir des coordonnées (pour préremplir le formulaire)
export async function reverseGeocode(
  coords: Coords
): Promise<{ city: string; address: string } | null> {
  try {
    const res = await Location.reverseGeocodeAsync({
      latitude: coords.lat,
      longitude: coords.lng,
    });
    if (!res.length) return null;
    const r = res[0];
    const street = [r.streetNumber, r.street].filter(Boolean).join(' ');
    return { city: r.city ?? r.subregion ?? r.region ?? '', address: street };
  } catch {
    return null;
  }
}