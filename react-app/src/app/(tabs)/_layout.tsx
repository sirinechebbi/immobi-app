import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useUnreadCount } from '@/hooks/use-unread';
import { colors, fonts } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { off: IconName; on: IconName }> = {
  index: { off: 'home-outline', on: 'home' },
  favorites: { off: 'heart-outline', on: 'heart' },
  chat: { off: 'chatbubble-outline', on: 'chatbubble' },
  profile: { off: 'person-outline', on: 'person' },
};

// Bouton central rond « Publier »
function PublishButton({ onPress }: { onPress?: (e: any) => void }) {
  return (
    <Pressable onPress={onPress} style={styles.pubWrap} accessibilityLabel="Publier une annonce">
      <View style={styles.fab}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </View>
      <Text style={styles.pubLabel}>Publier</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const unread = useUnreadCount();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarIcon: ({ color, size, focused }) => {
          const icon = ICONS[route.name];
          if (!icon) return null;
          return <Ionicons name={focused ? icon.on : icon.off} size={size} color={color as string} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoris' }} />
      <Tabs.Screen
        name="publish"
        options={{ title: 'Publier', tabBarButton: (p) => <PublishButton onPress={p.onPress} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Chat', tabBarBadge: unread > 0 ? unread : undefined }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />

      {/* Masqué dans la barre : la recherche est sur l'accueil. Le fichier reste disponible. */}
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pubWrap: { flex: 1, alignItems: 'center' },
  fab: {
    marginTop: -20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  pubLabel: { marginTop: 2, fontFamily: fonts.medium, fontSize: 11, color: colors.primary },
});