import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatPrice } from '@/api/listingsApi';
import { db } from '@/config/firebase';
import { Transaction } from '@/constants/propreties';
import { useAuthStore } from '@/store/authStore';
import { colors, fonts } from '@/theme';

const LINE = '#dfe6df';

type Mine = {
  id: string;
  title: string;
  price: number;
  currency: string;
  transaction: Transaction;
  city: string | null;
  coverUrl: string | null;
  status: string;
  views: number;
};

const STATUS_LABEL: Record<string, string> = {
  active: 'En ligne',
  archived: 'Archivée',
  draft: 'Brouillon',
  rejected: 'Refusée',
};

export default function MyListingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [items, setItems] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'listings'),
          where('ownerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
      );
      setItems(
        snap.docs.map((d) => {
          const x = d.data();
          const photos: string[] = Array.isArray(x.photos) ? x.photos : [];
          return {
            id: d.id,
            title: x.title ?? '',
            price: x.price ?? 0,
            currency: x.currency ?? 'TND',
            transaction: (x.transaction ?? 'vente') as Transaction,
            city: x.city ?? null,
            coverUrl: x.coverUrl ?? photos[0] ?? null,
            status: x.status ?? 'active',
            views: x.viewsCount ?? 0,
          };
        })
      );
    } catch {
      setError('Impossible de charger vos annonces.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const setStatus = async (item: Mine, status: 'active' | 'archived') => {
    setBusyId(item.id);
    try {
      await updateDoc(doc(db, 'listings', item.id), { status });
      setItems((list) => list.map((l) => (l.id === item.id ? { ...l, status } : l)));
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier cette annonce.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = (item: Mine) =>
    Alert.alert('Supprimer l\u2019annonce', `${item.title} sera supprimée définitivement.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setBusyId(item.id);
          try {
            await deleteDoc(doc(db, 'listings', item.id));
            setItems((list) => list.filter((l) => l.id !== item.id));
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer cette annonce.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);

  // ---------- Invité ----------
  if (!user) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.empty}>
          <Ionicons name="home-outline" size={64} color={colors.primary} />
          <Text style={styles.emptyTitle}>Connectez-vous pour voir vos annonces</Text>
          <Pressable style={styles.btn} onPress={() => router.push('/login' as any)}>
            <Text style={styles.btnText}>Se connecter</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: Mine }) => {
    const busy = busyId === item.id;
    const isActive = item.status === 'active';
    const canToggle = item.status === 'active' || item.status === 'archived';

    return (
      <View style={styles.card}>
        <Pressable
          style={styles.cardTop}
          onPress={() => router.push({ pathname: '/listing/[id]', params: { id: item.id } } as any)}
        >
          <View style={styles.photoWrap}>
            {item.coverUrl ? <Image source={{ uri: item.coverUrl }} style={styles.photo} /> : null}
          </View>

          <View style={styles.info}>
            <View style={[styles.status, isActive ? styles.statusOn : styles.statusOff]}>
              <Text style={[styles.statusText, isActive ? styles.statusTextOn : styles.statusTextOff]}>
                {STATUS_LABEL[item.status] ?? item.status}
              </Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.meta}>
              {[item.city, `${item.views} ${item.views > 1 ? 'vues' : 'vue'}`]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Text style={styles.price}>{formatPrice(item)}</Text>
          </View>
        </Pressable>

        <View style={styles.actions}>
          {canToggle && (
            <Pressable
              style={styles.action}
              disabled={busy}
              onPress={() => setStatus(item, isActive ? 'archived' : 'active')}
            >
              <Ionicons
                name={isActive ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.actionText}>{isActive ? 'Archiver' : 'Réactiver'}</Text>
            </Pressable>
          )}
          <Pressable style={styles.action} disabled={busy} onPress={() => confirmDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Supprimer</Text>
          </Pressable>
          {busy && <ActivityIndicator color={colors.primary} style={styles.busy} />}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={goBack} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Mes annonces</Text>
        <View style={styles.count}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        refreshing={loading && items.length > 0}
        onRefresh={load}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="home-outline" size={64} color={colors.primary} />
              <Text style={styles.emptyTitle}>Vous n'avez pas encore d'annonce</Text>
              <Pressable style={styles.btn} onPress={() => router.navigate('/publish' as any)}>
                <Text style={styles.btnText}>Publier une annonce</Text>
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
  error: { color: colors.error, textAlign: 'center', marginTop: 8, fontFamily: fonts.regular },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#fff',
    padding: 10,
  },
  cardTop: { flexDirection: 'row', gap: 14 },
  photoWrap: {
    width: 104,
    height: 104,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: LINE,
  },
  photo: { width: '100%', height: '100%' },
  info: { flex: 1 },
  status: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999 },
  statusOn: { backgroundColor: '#E6F2EB' },
  statusOff: { backgroundColor: '#EEF0EE' },
  statusText: { fontSize: 11, fontFamily: fonts.semibold },
  statusTextOn: { color: colors.primary },
  statusTextOff: { color: colors.muted },
  title: { marginTop: 6, fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  meta: { marginTop: 3, fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  price: { marginTop: 'auto', fontFamily: fonts.semibold, fontSize: 16, color: colors.primary },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  busy: { marginLeft: 'auto' },

  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 24 },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 24,
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  btn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary },
  btnText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 15 },
});