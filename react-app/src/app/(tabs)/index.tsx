import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Listing, fetchLatestListings } from '@/api/listingsApi';
import {
  DEFAULT_FILTERS,
  FilterSheet,
  Filters,
  countActiveFilters,
} from '@/components/FilterSheet'; // NEW: the filter bottom sheet
import { GridCard } from '@/components/GridCard';
import { HOME_CHIPS, PropertyType } from '@/constants/propreties';
import { useFavorites } from '@/hooks/use-favorites';
import { useUnreadCount } from '@/hooks/use-unread';
import { colors, fonts } from '@/theme';

const PAD = 16;
const GAP = 12;

// NEW: turns the text typed in a price field into a number (empty text = no limit)
function toNumber(text: string): number | null {
  const n = Number(text.replace(/\s/g, ''));
  return text.trim() !== '' && !Number.isNaN(n) ? n : null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardW = (width - PAD * 2 - GAP) / 2; // two cards per row

  const { ids: favIds, toggle, signedIn } = useFavorites();
  const unread = useUnreadCount(); // total unread messages (0 for visitors)

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chip, setChip] = useState<PropertyType | 'tout'>('tout'); // selected category
  const [q, setQ] = useState(''); // search text
  const [hideBanner, setHideBanner] = useState(false); // visitor closed the welcome banner

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS); // NEW: applied filters
  const [sheetOpen, setSheetOpen] = useState(false); // NEW: is the filter sheet open?

  // Loads the latest active listings from Firestore (readable without an account)
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setListings(await fetchLatestListings());
    } catch {
      setError('Impossible de charger les annonces.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // CHANGED: category + search + the new filters, then sorting.
  // Everything runs on the phone, on the listings already loaded.
  const data = useMemo(() => {
    const term = q.trim().toLowerCase();
    const minP = toNumber(filters.minPrice);
    const maxP = toNumber(filters.maxPrice);

    const list = listings
      .filter((l) => chip === 'tout' || l.propertyType === chip)
      .filter((l) => !term || `${l.title} ${l.city ?? ''}`.toLowerCase().includes(term))
      .filter((l) => filters.transaction === 'tout' || l.transaction === filters.transaction)
      .filter((l) => minP === null || l.price >= minP)
      .filter((l) => maxP === null || l.price <= maxP)
      .filter((l) => filters.minRooms === 0 || (l.rooms ?? 0) >= filters.minRooms);

    // "Plus récentes" is already the order coming from Firestore (createdAt desc)
    if (filters.sort === 'prix_asc') return [...list].sort((a, b) => a.price - b.price);
    if (filters.sort === 'prix_desc') return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [listings, chip, q, filters]);

  const activeCount = countActiveFilters(filters); // NEW: number shown on the filter button

  // CHANGED: also counts the filters from the sheet
  const filtersActive = chip !== 'tout' || q.trim() !== '' || activeCount > 0;

  // CHANGED: clears everything ("Tout voir" and the empty state use it)
  const resetFilters = () => {
    setChip('tout');
    setQ('');
    setFilters(DEFAULT_FILTERS);
  };

  // Browsing is free; only favorites need an account.
  const onFavorite = (id: string) =>
    signedIn ? toggle(id) : router.push({ pathname: '/login' } as any);

  const header = (
    <View style={styles.head}>
      {/* REMOVED: the "À proximité" row.
          CHANGED: the top row now only exists for signed-in users, because it only holds the bell */}
      {signedIn && (
        <View style={styles.top}>
          <Pressable
            onPress={() => router.navigate({ pathname: '/chat' } as any)}
            hitSlop={10}
            accessibilityLabel="Messages">
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unread > 0 && (
              <View style={styles.dot}>
                <Text style={styles.dotT}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </Pressable>
        </View>
      )}

      {/* Welcome banner: only for visitors, and only until they close it */}
      {!signedIn && !hideBanner && (
        <View style={styles.welcome}>
          <Pressable style={styles.close} onPress={() => setHideBanner(true)} hitSlop={10}>
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.welcomeTitle}>Bienvenue sur ImmoBi</Text>
          <Text style={styles.welcomeText}>
            Parcourez librement les annonces. Connectez-vous pour enregistrer vos favoris et
            contacter les annonceurs.
          </Text>

          <View style={styles.welcomeRow}>
            <Pressable
              style={styles.welcomeBtn}
              onPress={() => router.push({ pathname: '/login' } as any)}>
              <Text style={styles.welcomeBtnT}>Se connecter</Text>
            </Pressable>
            <Pressable
              style={styles.welcomeBtnOutline}
              onPress={() => router.push({ pathname: '/register' } as any)}>
              <Text style={styles.welcomeBtnOutlineT}>Créer un compte</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.h1}>Les bonnes trouvailles</Text>

      {/* Search bar + filter button */}
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            style={styles.input}
            placeholder="Que recherchez-vous ?"
            placeholderTextColor={colors.muted}
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
          />
        </View>

        {/* CHANGED: the button now opens the filter sheet, with a badge = active filters */}
        <Pressable
          style={styles.filter}
          onPress={() => setSheetOpen(true)}
          accessibilityLabel="Filtres">
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeT}>{activeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {HOME_CHIPS.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setChip(c.key)}
            style={[styles.chip, chip === c.key && styles.chipOn]}>
            <Text style={[styles.chipT, chip === c.key && styles.chipTOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sec}>
        <Text style={styles.secT}>Les dernières annonces</Text>
        <Pressable onPress={resetFilters}>
          <Text style={styles.all}>Tout voir</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.c} edges={['top']}>
      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(i) => i.id}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: PAD, marginBottom: 18 }}
        ListHeaderComponent={header}
        refreshing={loading && listings.length > 0} // pull-to-refresh spinner
        onRefresh={load}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyT}>
                {error ||
                  (filtersActive
                    ? 'Aucune annonce ne correspond à votre recherche.'
                    : 'Aucune annonce pour le moment.')}
              </Text>

              {/* Loading failed: retry */}
              {!!error && (
                <Pressable onPress={load}>
                  <Text style={styles.all}>Réessayer</Text>
                </Pressable>
              )}

              {/* Nothing matches the filters: clear them in one tap */}
              {!error && filtersActive && (
                <Pressable onPress={resetFilters}>
                  <Text style={styles.all}>Réinitialiser les filtres</Text>
                </Pressable>
              )}
            </View>
          )
        }
        renderItem={({ item }) => (
          <GridCard
            item={item}
            width={cardW}
            favorite={favIds.has(item.id)}
            onToggleFavorite={() => onFavorite(item.id)}
            onPress={() =>
              router.push({ pathname: '/listing/[id]', params: { id: item.id } } as any)
            }
          />
        )}
      />

      {/* NEW: the filter bottom sheet. "Appliquer" saves the filters and closes it */}
      <FilterSheet
        visible={sheetOpen}
        value={filters}
        onApply={(f: Filters) => {
          setFilters(f);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  head: { padding: PAD, gap: 14 },
  // CHANGED: the bell is alone in this row, so it goes to the right
  top: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  // REMOVED: the "loc" and "locT" styles (À proximité)
  h1: { fontFamily: fonts.bold, fontSize: 26, color: colors.primary },
  searchRow: { flexDirection: 'row', gap: 10 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  filter: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // NEW: number of active filters on the filter button
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeT: { fontFamily: fonts.bold, fontSize: 10, color: '#FFFFFF' },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary },
  chipT: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  chipTOn: { color: '#FFFFFF' },
  sec: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  secT: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  all: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  empty: { alignItems: 'center', marginTop: 40, gap: 8, paddingHorizontal: 24 },
  emptyT: { fontFamily: fonts.regular, color: colors.muted, textAlign: 'center' },

  // Welcome banner (visitors)
  welcome: { backgroundColor: colors.primary, borderRadius: 18, padding: 18, gap: 8 },
  welcomeTitle: { fontFamily: fonts.bold, fontSize: 18, color: '#FFFFFF', paddingRight: 24 },
  welcomeText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: '#FFFFFF' },
  welcomeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  welcomeBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeBtnT: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  welcomeBtnOutline: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeBtnOutlineT: { fontFamily: fonts.semibold, fontSize: 14, color: '#FFFFFF' },
  close: { position: 'absolute', top: 10, right: 10, zIndex: 1 },

  // Notification bell badge
  dot: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotT: { fontFamily: fonts.bold, fontSize: 10, color: '#FFFFFF' },
});