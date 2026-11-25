import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Conversation,
  Message,
  createConversation,
  markRead,
  otherName,
  parseConversation,
  sendMessage,
} from '@/api/chatApi';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';
import { colors, fonts } from '@/theme';

export default function ConversationScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { id, listingId, sellerId, title } = useLocalSearchParams<{
    id: string;
    listingId?: string;
    sellerId?: string;
    title?: string;
  }>();

  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const uid = user?.uid;
  const convId = conv?.id;

  // 1. Does the conversation already exist? (a first chat does not exist yet:
  //    Firestore answers "permission-denied" for a missing document, that is normal)
  useEffect(() => {
    if (!id || !uid) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'conversations', id));
        if (!cancelled && snap.exists()) setConv(parseConversation(snap));
      } catch {
        // new conversation
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, uid]);

  // 2. Live messages (newest first, the list is inverted)
  useEffect(() => {
    if (!convId) return;
    const q = query(
      collection(db, 'conversations', convId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    return onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => {
            const x = d.data({ serverTimestamps: 'estimate' });
            return {
              id: d.id,
              senderId: x.senderId,
              content: x.content,
              createdAt: x.createdAt?.toMillis?.() ?? Date.now(),
            };
          })
        );
      },
      (e) => console.warn('messages error', e)
    );
  }, [convId]);

  // 3. Reset my unread counter when I received something, and when I leave
  const lastSender = messages[0]?.senderId;
  useEffect(() => {
    if (convId && uid && lastSender && lastSender !== uid) markRead(convId, uid);
  }, [convId, uid, lastSender]);

  useEffect(() => {
    return () => {
      if (convId && uid) markRead(convId, uid);
    };
  }, [convId, uid]);

  const onSend = async () => {
    const content = text.trim();
    if (!content || !user || !id || sending) return;
    setSending(true);
    try {
      if (!conv) {
        if (!listingId || !sellerId) throw new Error('missing listing');
        await createConversation({
          listingId,
          listingTitle: title ?? '',
          sellerId,
          buyerId: user.uid,
          buyerName: user.displayName ?? user.email?.split('@')[0] ?? 'Utilisateur',
        });
        const snap = await getDoc(doc(db, 'conversations', id));
        if (snap.exists()) setConv(parseConversation(snap));
      }
      // The other person: from the conversation if it exists, otherwise the seller of the listing
        const otherId = conv
          ? conv.buyerId === user.uid
            ? conv.sellerId
            : conv.buyerId
          : (sellerId as string);
        await sendMessage(id, user.uid, otherId, content);
      setText('');
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  };

  const headerTitle = conv && uid ? otherName(conv, uid) : (title ?? 'Discussion');

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Connectez-vous pour discuter avec l'annonceur.</Text>
        <Pressable style={styles.btn} onPress={() => router.push({ pathname: '/login' } as any)}>
          <Text style={styles.btnT}>Se connecter</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.c} edges={['bottom']}>
      <Stack.Screen options={{ title: headerTitle }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {messages.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={44} color={colors.muted} />
            <Text style={styles.muted}>
              {conv ? 'Aucun message pour le moment.' : 'Écrivez votre premier message à l\'annonceur.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(m: Message) => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }: { item: Message }) => {
              const mine = item.senderId === user.uid;
              return (
                <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.msg, mine && styles.msgMine]}>{item.content}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Votre message..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={4000}
          />
          <Pressable
            onPress={onSend}
            disabled={sending || !text.trim()}
            style={[styles.send, (sending || !text.trim()) && styles.sendOff]}
            accessibilityLabel="Envoyer">
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
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
  list: { padding: 14, gap: 8 },
  row: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  msg: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.text },
  msgMine: { color: '#FFFFFF' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 44,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.4 },
});