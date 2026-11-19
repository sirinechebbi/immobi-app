import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Listing, fetchListing, formatPrice } from '@/api/listingsApi';
import { PROPERTY_LABELS } from '@/constants/propreties';
import { useAuthStore } from '@/store/authStore';
import { colors, fonts } from '@/theme';
import { conversationId } from '@/api/chatApi';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const l = await fetchListing(id);
        if (cancelled) return;
        if (l) setListing(l);
        else setError('Annonce introuvable.');
      } catch {
        if (!cancelled) setError("Impossible de charger l'annonce.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />;
  }
  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error || 'Annonce introuvable.'}</Text>
      </View>
    );
  }

  const photos: string[] = listing.photos.length
    ? listing.photos
    : listing.coverUrl
      ? [listing.coverUrl]
      : [];

  const details = [
    PROPERTY_LABELS[listing.propertyType],
    listing.rooms ? `${listing.rooms} pièces` : null,
    listing.surfaceM2 ? `${listing.surfaceM2} m²` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // Visiteur : on l'envoie vers la connexion. Connecté : messagerie pas encore prête.
  const onContact = () => {
        if (!user) {
            router.push({ pathname: '/login' } as any);
            return;
        }
        if (user.uid === listing.ownerId) {
            Alert.alert('Votre annonce', 'Vous ne pouvez pas vous écrire à vous-même.');
            return;
        }
        router.push({
            pathname: '/conversation/[id]',
            params: {
            id: conversationId(listing.id, user.uid),
            listingId: listing.id,
            sellerId: listing.ownerId,
            title: listing.title,
            },
        } as any);
        };

  return (
    <View style={styles.c}>
      <ScrollView>
        {photos.length > 0 ? (
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri: string, i: number) => `${i}-${uri}`}
            renderItem={({ item }: { item: string }) => (
              <Image
                source={{ uri: item }}
                style={{ width, height: width * 0.75 }}
                contentFit="cover"
              />
            )}
          />
        ) : (
          <View style={{ width, height: width * 0.75, backgroundColor: colors.surface }} />
        )}

        <View style={styles.body}>
          <Text style={styles.price}>{formatPrice(listing)}</Text>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.muted}>{listing.city ?? 'Tunisie'}</Text>
          <Text style={styles.details}>{details}</Text>
          {!!listing.description && <Text style={styles.desc}>{listing.description}</Text>}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.btn} onPress={onContact}>
          <Text style={styles.btnT}>{user ? 'Contacter' : 'Se connecter pour contacter'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 6 },
  price: { fontFamily: fonts.bold, fontSize: 24, color: colors.primary },
  title: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  details: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  desc: { marginTop: 10, fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.text },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  btn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnT: { fontFamily: fonts.semibold, fontSize: 16, color: '#FFFFFF' },
});