import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Pressable, StyleProp, ViewStyle } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { useFavoritesStore } from '@/store/favoriteStore';

type Props = {
  listingId: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function HeartButton({ listingId, size = 22, color = '#4a7355', style }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isFavorite = useFavoritesStore((s) => s.ids.has(listingId));
  const ensureLoaded = useFavoritesStore((s) => s.ensureLoaded);
  const toggle = useFavoritesStore((s) => s.toggle);

  useEffect(() => {
    if (user) ensureLoaded(user.uid);
  }, [user, ensureLoaded]);

  const onPress = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    toggle(user.uid, listingId).catch(() =>
      Alert.alert('Erreur', 'Impossible de modifier vos favoris.')
    );
  };

  return (
    <Pressable onPress={onPress} hitSlop={10} style={style} accessibilityLabel="Favori">
      <Ionicons name={user && isFavorite ? 'heart' : 'heart-outline'} size={size} color={color} />
    </Pressable>
  );
}