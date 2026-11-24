import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Listing, fetchListing, formatPrice } from '@/api/listingsApi';
import { PROPERTY_LABELS } from '@/constants/propreties';
import { useAuthStore } from '@/store/authStore';
import { colors, fonts } from '@/theme';
import { conversationId } from '@/api/chatApi';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

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
        // Is this listing mine?
const isMine = !!user && user.uid === listing.ownerId;
// Does this listing have a usable position?
const hasLocation = typeof listing.lat === 'number' && typeof listing.lng === 'number';

// Opens the phone's own maps app on this position
const openInMaps = () => {
  const label = encodeURIComponent(listing.title);
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?ll=${listing.lat},${listing.lng}&q=${label}`
      : `geo:${listing.lat},${listing.lng}?q=${listing.lat},${listing.lng}(${label})`;
  Linking.openURL(url).catch(() =>
    Alert.alert('Erreur', "Impossible d'ouvrir l'application de cartes.")
  );
};
// Archive = hidden from visitors but kept; your rules allow the owner to do it
const onArchive = () =>
  Alert.alert('Archiver', 'Cette annonce ne sera plus visible par les visiteurs.', [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Archiver',
      onPress: async () => {
        try {
          await updateDoc(doc(db, 'listings', listing.id), { status: 'archived' });
          router.back();
        } catch {
          Alert.alert('Erreur', "Impossible d'archiver l'annonce.");
        }
      },
    },
  ]);

const onDelete = () =>
  Alert.alert('Supprimer', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'listings', listing.id));
            router.back();
          } catch {
            Alert.alert('Erreur', "Impossible de supprimer l'annonce.");
          }
        },
    },
  ]);

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
          {hasLocation && (
  <View style={styles.mapBox}>
    <Text style={styles.mapTitle}>Localisation</Text>
    {/* Small fixed map: gestures are off so it does not fight with the page scroll */}
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: listing.lat,
        longitude: listing.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      onPress={openInMaps}>
      <Marker
        coordinate={{ latitude: listing.lat, longitude: listing.lng }}
        pinColor={colors.primary}
      />
    </MapView>
    <Pressable onPress={openInMaps}>
      <Text style={styles.mapLink}>Ouvrir dans l'application de cartes</Text>
    </Pressable>
  </View>
)}
        </View>
      </ScrollView>

      <View style={styles.footer}>
  {isMine ? (
    <View style={{ gap: 10 }}>
      <Text style={styles.muted}>C'est votre annonce</Text>
      {/* TODO: link to the edit screen when the Publier page exists */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable style={[styles.btn, { flex: 1 }]} onPress={onArchive}>
          <Text style={styles.btnT}>Archiver</Text>
        </Pressable>
        <Pressable style={[styles.btnDanger, { flex: 1 }]} onPress={onDelete}>
          <Text style={styles.btnDangerT}>Supprimer</Text>
        </Pressable>
      </View>
    </View>
  ) : (
    <Pressable style={styles.btn} onPress={onContact}>
      <Text style={styles.btnT}>{user ? 'Contacter' : 'Se connecter pour contacter'}</Text>
    </Pressable>
  )}
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
  btnDanger: {
  height: 52,
  borderRadius: 14,
  borderWidth: 1.5,
  borderColor: colors.error,
  alignItems: 'center',
  justifyContent: 'center',
},
btnDangerT: { fontFamily: fonts.semibold, fontSize: 16, color: colors.error },
mapBox: { marginTop: 16, gap: 10 },
mapTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
map: { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden' },
mapLink: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
});