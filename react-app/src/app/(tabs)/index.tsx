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
import { GridCard } from '@/components/GridCard';
import { HOME_CHIPS, PropertyType } from '@/constants/propreties';
import { useFavorites } from '@/hooks/use-favorites';
import { colors, fonts } from '@/theme';

const PAD = 16;
const GAP = 12;

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardW = (width - PAD * 2 - GAP) / 2;

  const { ids: favIds, toggle, signedIn } = useFavorites();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chip, setChip] = useState<PropertyType | 'tout'>('tout');
  const [q, setQ] = useState('');

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

  const data = useMemo(() => {
    const term = q.trim().toLowerCase();
    return listings
      .filter((l) => chip === 'tout' || l.propertyType === chip)
      .filter((l) => !term || `${l.title} ${l.city ?? ''}`.toLowerCase().includes(term));
  }, [listings, chip, q]);

  // Parcourir est libre ; seuls les favoris demandent un compte.
  const onFavorite = (id: string) => (signedIn ? toggle(id) : router.push({ pathname: '/login' } as any));

  const header = (
    <View style={styles.head}>
      <View style={styles.top}>
        <View style={styles.loc}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.locT}>À proximité</Text>
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </View>
        <Ionicons name="notifications-outline" size={22} color={colors.text} />
      </View>
      
      {!signedIn && (
  <View style={styles.welcome}>
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
        <Pressable style={styles.filter} accessibilityLabel="Filtres">
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {HOME_CHIPS.map((c) => (
          <Pressable key={c.key} onPress={() => setChip(c.key)} style={[styles.chip, chip === c.key && styles.chipOn]}>
            <Text style={[styles.chipT, chip === c.key && styles.chipTOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sec}>
        <Text style={styles.secT}>Les dernières annonces</Text>
        <Pressable onPress={() => { setChip('tout'); setQ(''); }}>
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
        refreshing={loading && listings.length > 0}
        onRefresh={load}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyT}>{error || 'Aucune annonce pour le moment.'}</Text>
              {!!error && (
                <Pressable onPress={load}>
                  <Text style={styles.all}>Réessayer</Text>
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
            onPress={() => router.push({ pathname: '/listing/[id]', params: { id: item.id } } as any)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  head: { padding: PAD, gap: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locT: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  h1: { fontFamily: fonts.bold, fontSize: 26, color: colors.primary },
  searchRow: { flexDirection: 'row', gap: 10 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, height: 48 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  filter: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary },
  chipT: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  chipTOn: { color: '#FFFFFF' },
  sec: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  secT: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  all: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  empty: { alignItems: 'center', marginTop: 40, gap: 8 },
  emptyT: { fontFamily: fonts.regular, color: colors.muted },

 welcome: { backgroundColor: colors.primary, borderRadius: 18, padding: 18, gap: 8 },
welcomeTitle: { fontFamily: fonts.bold, fontSize: 18, color: '#FFFFFF' },
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
});