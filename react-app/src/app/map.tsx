import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Listing, fetchLatestListings, formatPrice } from '@/api/listingsApi';
import { PROPERTY_LABELS, Transaction } from '@/constants/propreties';
import { colors, fonts } from '@/theme';

// Where the map starts (all of Tunisia) before it zooms on the listings
const TUNISIA = { latitude: 34.0, longitude: 9.5, latitudeDelta: 8, longitudeDelta: 8 };

const TX: { key: Transaction | 'tout'; label: string }[] = [
  { key: 'tout', label: 'Tout' },
  { key: 'vente', label: 'Acheter' },
  { key: 'location', label: 'Louer' },
];

// A listing can only be shown on the map if it has valid coordinates
function hasCoords(l: Listing): boolean {
  return (
    typeof l.lat === 'number' &&
    typeof l.lng === 'number' &&
    Math.abs(l.lat) <= 90 &&
    Math.abs(l.lng) <= 180 &&
    !(l.lat === 0 && l.lng === 0)
  );
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tx, setTx] = useState<Transaction | 'tout'>('tout'); // Acheter / Louer filter
  const [selected, setSelected] = useState<Listing | null>(null); // pin the user tapped
  const [ready, setReady] = useState(false); // the map finished loading

  // Loads the listings (readable without an account, like on the home)
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setListings(await fetchLatestListings(200));
    } catch {
      setError('Impossible de charger les annonces.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Only listings with a position, and matching the Acheter / Louer choice
  const shown = useMemo(
    () => listings.filter(hasCoords).filter((l) => tx === 'tout' || l.transaction === tx),
    [listings, tx]
  );

  // Zoom the map so every pin is visible
  useEffect(() => {
    if (!ready || shown.length === 0) return;
    const coords = shown.map((l) => ({ latitude: l.lat, longitude: l.lng }));
    if (coords.length === 1) {
      mapRef.current?.animateToRegion({ ...coords[0], latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
    } else {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 90, right: 50, bottom: 180, left: 50 },
        animated: true,
      });
    }
  }, [ready, shown]);

  return (
    <View style={styles.c}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={TUNISIA}
        onMapReady={() => setReady(true)}
        onPress={() => setSelected(null)} // tap on empty map = close the preview card
      >
        {shown.map((l) => (
          <Marker
            key={l.id}
            coordinate={{ latitude: l.lat, longitude: l.lng }}
            pinColor={selected?.id === l.id ? colors.error : colors.primary}
            onPress={() => setSelected(l)}
          />
        ))}
      </MapView>

      {/* Top bar: Acheter / Louer + number of listings */}
      <View style={styles.top}>
        <View style={styles.seg}>
          {TX.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => {
                setTx(t.key);
                setSelected(null);
              }}
              style={[styles.segBtn, tx === t.key && styles.segOn]}>
              <Text style={[styles.segT, tx === t.key && styles.segTOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
        {!loading && !error && (
          <View style={styles.count}>
            <Text style={styles.countT}>
              {shown.length} annonce{shown.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Loading / error / nothing to show */}
      {loading && <ActivityIndicator style={styles.center} color={colors.primary} size="large" />}
      {!loading && !!error && (
        <View style={styles.center}>
          <View style={styles.msg}>
            <Text style={styles.msgT}>{error}</Text>
            <Pressable onPress={load}>
              <Text style={styles.link}>Réessayer</Text>
            </Pressable>
          </View>
        </View>
      )}
      {!loading && !error && shown.length === 0 && (
        <View style={styles.center}>
          <View style={styles.msg}>
            <Text style={styles.msgT}>Aucune annonce avec une position sur la carte.</Text>
          </View>
        </View>
      )}

      {/* Preview card of the tapped pin: tap it to open the listing */}
      {selected && (
        <Pressable
          style={[styles.card, { bottom: insets.bottom + 16 }]}
          onPress={() =>
            router.push({ pathname: '/listing/[id]', params: { id: selected.id } } as any)
          }>
          <Image
            source={selected.coverUrl ? { uri: selected.coverUrl } : undefined}
            style={styles.cardImg}
            contentFit="cover"
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.cardPrice}>{formatPrice(selected)}</Text>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {selected.title}
            </Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {[PROPERTY_LABELS[selected.propertyType], selected.city].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  top: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  segBtn: { paddingHorizontal: 14, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.primary },
  segT: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  segTOn: { color: '#FFFFFF' },
  count: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  countT: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  msg: { backgroundColor: colors.background, borderRadius: 14, padding: 16, gap: 8, alignItems: 'center', marginHorizontal: 32 },
  msgT: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center' },
  link: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardImg: { width: 84, height: 84, borderRadius: 12, backgroundColor: colors.surface },
  cardPrice: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  cardMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
});