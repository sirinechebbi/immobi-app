import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Listing, fetchListing, formatPrice } from '@/api/listingsApi';
import { useFavorites } from '@/hooks/use-favorites';
import { colors, fonts } from '@/theme';

const LINE = '#dfe6df';

export default function FavoritesScreen() {
  const router = useRouter();
  const { ids, toggle, signedIn } = useFavorites();

  // Annonces déjà chargées (null = introuvable ou non accessible)
  const [byId, setById] = useState<Record<string, Listing | null>>({});
  const [loading, setLoading] = useState(false);

  const idList = useMemo(() => Array.from(ids).reverse(), [ids]);
  const idKey = idList.join(',');

  // Ne charge que les annonces pas encore en mémoire
  useEffect(() => {
    const missing = idList.filter((id) => !(id in byId));
    if (missing.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(
      missing.map(async (id) => [id, await fetchListing(id).catch(() => null)] as const)
    )
      .then((pairs) => {
        if (!cancelled) setById((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey]);

  const items = useMemo(
    () => idList.map((id) => byId[id]).filter((l): l is Listing => !!l),
    [idList, byId]
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // ---------- Invité ----------
  if (!signedIn) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color={colors.primary} />
          <Text style={styles.emptyTitle}>Vos favoris vous attendent</Text>
          <Text style={styles.emptyText}>
            Connectez-vous pour enregistrer les annonces qui vous plaisent.
          </Text>
          <Pressable style={styles.btn} onPress={() => router.push('/login' as any)}>
            <Text style={styles.btnText}>Se connecter</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: Listing }) => {
    const typeLabel = item.transaction === 'location' ? 'Location' : 'Vente';
    const details = [
      item.surfaceM2 ? `${item.surfaceM2} m²` : null,
      item.rooms ? `${item.rooms} ${item.rooms > 1 ? 'pièces' : 'pièce'}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push({ pathname: '/listing/[id]', params: { id: item.id } } as any)}
      >
        <View style={styles.photoWrap}>
          {item.coverUrl ? <Image source={{ uri: item.coverUrl }} style={styles.photo} /> : null}
          <View style={styles.tag}>
            <Text style={styles.tagText}>{typeLabel}</Text>
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.top}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Pressable
              onPress={() => toggle(item.id)}
              hitSlop={10}
              accessibilityLabel={`Retirer ${item.title} des favoris`}
            >
              <Ionicons name="heart" size={22} color={colors.primary} />
            </Pressable>
          </View>

          {item.city ? <Text style={styles.meta}>{item.city}</Text> : null}
          {details ? <Text style={styles.meta}>{details}</Text> : null}
          <Text style={styles.price}>{formatPrice(item)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={goBack} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Mes favoris</Text>
        <View style={styles.count}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={64} color={colors.primary} />
              <Text style={styles.emptyTitle}>Aucun favori pour le moment</Text>
              <Text style={styles.emptyText}>
                Appuyez sur le cœur d'une annonce pour la retrouver ici.
              </Text>
              <Pressable style={styles.btn} onPress={goBack}>
                <Text style={styles.btnText}>Parcourir les annonces</Text>
              </Pressable>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  count: {
    minWidth: 28,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  countText: { color: '#fff', fontSize: 13, fontFamily: fonts.semibold },

  list: { padding: 16, paddingTop: 8, paddingBottom: 140, flexGrow: 1 },

  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#fff',
  },
  photoWrap: {
    width: 120,
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: LINE,
  },
  photo: { width: '100%', height: '100%' },
  tag: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(58,92,68,0.9)',
  },
  tagText: { color: '#fff', fontSize: 11, fontFamily: fonts.medium },

  info: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  meta: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  price: { marginTop: 'auto', fontFamily: fonts.semibold, fontSize: 16, color: colors.primary },

  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontFamily: fonts.semibold, fontSize: 18, color: colors.text, textAlign: 'center' },
  emptyText: {
    marginTop: 6,
    marginBottom: 24,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  btn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary },
  btnText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 15 },
});