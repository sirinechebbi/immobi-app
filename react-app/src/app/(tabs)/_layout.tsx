import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;
const ICONS: Record<string, IconName> = {
  index: 'home-outline',
  search: 'search-outline',
  chat: 'chatbubble-outline',
  profile: 'person-outline',
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
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name]} size={size} color={color as string} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="search" options={{ title: 'Recherche' }} />
      <Tabs.Screen name="publish" options={{ title: 'Publier', tabBarButton: (p) => <PublishButton onPress={p.onPress} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
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