import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Conversation, otherName, parseConversation } from '@/api/chatApi';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';
import { colors, fonts } from '@/theme';

function timeLabel(ms: number | null): string {
  if (!ms) return '';
  const d = new Date(ms);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function ChatListScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid;

  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Index already in firestore.indexes.json: participants + lastMessageAt DESC
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc')
    );
    return onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map(parseConversation));
        setError('');
        setLoading(false);
      },
      (e) => {
        console.warn('conversations error', e);
        setError('Impossible de charger les messages.');
        setLoading(false);
      }
    );
  }, [uid]);

  // Visitor: invitation to sign in
  if (!user) {
    return (
      <SafeAreaView style={styles.c} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.muted}>
            Connectez-vous pour discuter avec les annonceurs.
          </Text>
          <Pressable style={styles.btn} onPress={() => router.push({ pathname: '/login' } as any)}>
            <Text style={styles.btnT}>Se connecter</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.c} edges={['top']}>
      <Text style={styles.header}>Messages</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c: Conversation) => c.id}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.muted}>
                {error || 'Aucune conversation. Contactez un annonceur depuis une annonce.'}
              </Text>
            </View>
          }
          renderItem={({ item }: { item: Conversation }) => {
            const name = otherName(item, user.uid);
            const unread = item.unread[user.uid] ?? 0;
            return (
              <Pressable
                style={styles.item}
                onPress={() =>
                  router.push({ pathname: '/conversation/[id]', params: { id: item.id } } as any)
                }>
                <View style={styles.avatar}>
                  <Text style={styles.avatarT}>{name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.line}>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    <Text style={styles.time}>{timeLabel(item.lastMessageAt)}</Text>
                  </View>
                  <Text style={styles.listing} numberOfLines={1}>{item.listingTitle}</Text>
                  <View style={styles.line}>
                    <Text
                      style={[styles.last, unread > 0 && styles.lastUnread]}
                      numberOfLines={1}>
                      {item.lastMessage || 'Nouvelle conversation'}
                    </Text>
                    {unread > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeT}>{unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  header: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, marginTop: 40 },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.primary },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center' },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnT: { fontFamily: fonts.semibold, fontSize: 15, color: '#FFFFFF' },
  item: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarT: { fontFamily: fonts.bold, fontSize: 18, color: '#FFFFFF' },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  time: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  listing: { fontFamily: fonts.medium, fontSize: 12, color: colors.primary, marginTop: 1 },
  last: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  lastUnread: { fontFamily: fonts.semibold, color: colors.text },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeT: { fontFamily: fonts.bold, fontSize: 11, color: '#FFFFFF' },
});