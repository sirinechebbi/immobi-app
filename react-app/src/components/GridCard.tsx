import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Listing, formatPrice, timeAgo } from '@/api/listingsApi';
import { PROPERTY_LABELS } from '@/constants/propreties';
import { colors, fonts } from '@/theme';

type Props = {
  item: Listing;
  width: number;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
};

export function GridCard({ item, width, favorite, onPress, onToggleFavorite }: Props) {
  const details = [
    PROPERTY_LABELS[item.propertyType],
    item.rooms ? `${item.rooms} p.` : null,
    item.surfaceM2 ? `${item.surfaceM2} m²` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable onPress={onPress} style={{ width }}>
      <View>
        <Image
          source={item.coverUrl ? { uri: item.coverUrl } : undefined}
          style={[styles.img, { height: width * 0.95 }]}
          contentFit="cover"
          transition={200}
        />
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          style={styles.fav}
          accessibilityLabel={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={18} color={colors.primary} />
        </Pressable>
      </View>
      <Text style={styles.price}>{formatPrice(item)}</Text>
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.meta} numberOfLines={1}>{details}</Text>
      <Text style={styles.meta} numberOfLines={1}>
        {item.city ?? 'Tunisie'} · {timeAgo(item.createdAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  img: { width: '100%', borderRadius: 16, backgroundColor: colors.surface },
  fav: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: { marginTop: 8, fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  title: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  meta: { marginTop: 1, fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
});