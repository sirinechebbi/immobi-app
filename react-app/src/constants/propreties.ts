// Valeurs identiques à celles autorisées par firestore.rules (validListing)
export type PropertyType =
  | 'appartement'
  | 'maison'
  | 'villa'
  | 'studio'
  | 'terrain'
  | 'local_commercial'
  | 'bureau'
  | 'autre';

export type Transaction = 'vente' | 'location';

export const PROPERTY_LABELS: Record<PropertyType, string> = {
  appartement: 'Appartement',
  maison: 'Maison',
  villa: 'Villa',
  studio: 'Studio',
  terrain: 'Terrain',
  local_commercial: 'Local commercial',
  bureau: 'Bureau',
  autre: 'Autre',
};

// Puces de catégories de l'écran d'accueil
export const HOME_CHIPS: { key: PropertyType | 'tout'; label: string }[] = [
  { key: 'tout', label: 'Tout' },
  { key: 'appartement', label: 'Appartement' },
  { key: 'maison', label: 'Maison' },
  { key: 'villa', label: 'Villa' },
  { key: 'terrain', label: 'Terrain' },
];