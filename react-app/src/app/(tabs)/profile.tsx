import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { User, updateProfile } from 'firebase/auth';
import { useFavorites } from '@/hooks/use-favorites';
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ComponentProps, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { logOut } from '@/api/authApi';
import { uploadPhoto } from '@/api/publishApi';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';

const VERT = '#2E7D4F';
const VERT_FONCE = '#1B5E3B';
const VERT_CLAIR = '#E6F2EB';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Met à jour users/{uid}. Si le document n'existe pas encore (compte créé
// sans profil), on le crée avec les champs autorisés par firestore.rules.
async function saveProfile(user: User, patch: { fullName?: string; avatarUrl?: string }) {
  const ref = doc(db, 'users', user.uid);
  try {
    await updateDoc(ref, patch);
  } catch (e) {
    if (e instanceof FirebaseError && e.code === 'not-found') {
      await setDoc(ref, {
        fullName: user.displayName ?? '',
        avatarUrl: null,
        ...patch,
        createdAt: serverTimestamp(),
      });
    } else {
      throw e;
    }
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ids: favIds } = useFavorites();
  const user = useAuthStore((s) => s.user);

  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);

  // Recharge profil et compteurs à chaque retour sur l'onglet
   const load = useCallback(async () => {
    if (!user) return;
    try {
      const [mine, profile] = await Promise.all([
        getCountFromServer(query(collection(db, 'listings'), where('ownerId', '==', user.uid))),
        getDoc(doc(db, 'users', user.uid)),
      ]);
      setListingCount(mine.data().count);
      const d = profile.data();
      setFullName(d?.fullName || user.displayName || '');
      setAvatar(d?.avatarUrl || user.photoURL || null);
    } catch {
      setFullName(user.displayName ?? '');
      setAvatar(user.photoURL ?? null);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ---------- Invité ----------
  if (!user) {
    return (
      <SafeAreaView style={styles.guest}>
        <Ionicons name="person-circle-outline" size={96} color={VERT} />
        <Text style={styles.guestTitle}>Votre profil</Text>
        <Text style={styles.guestText}>
          Connectez-vous pour gérer vos annonces, vos favoris et vos messages.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.primaryButtonText}>Se connecter</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={() => router.push('/register')}>
          <Text style={styles.outlineButtonText}>Créer un compte</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const displayName = fullName || user.displayName || 'Utilisateur';

  // ---------- Actions ----------
  const changeAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (res.canceled || !res.assets[0]?.base64) return;

    setBusy(true);
    try {
      const url = await uploadPhoto(res.assets[0].base64);
      await saveProfile(user, { avatarUrl: url });
      await updateProfile(user, { photoURL: url });
      setAvatar(url);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de changer la photo.');
    } finally {
      setBusy(false);
    }
  };

  const openEdit = () => {
    setDraftName(displayName);
    setEditing(true);
  };

  const saveName = async () => {
    const name = draftName.trim();
    if (name.length < 2) {
      Alert.alert('Nom trop court', 'Saisissez au moins 2 caractères.');
      return;
    }
    setSaving(true);
    try {
      await saveProfile(user, { fullName: name });
      await updateProfile(user, { displayName: name });
      setFullName(name);
      setEditing(false);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de enregistrer.');
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const items: { icon: IconName; title: string; subtitle: string; onPress: () => void }[] = [
    {
      icon: 'person',
      title: 'Mon profil',
      subtitle: 'Voir et modifier votre profil',
      onPress: openEdit,
    },
    {
      icon: 'information-circle',
      title: 'À propos',
      subtitle: `Version ${version}`,
      onPress: () =>
        Alert.alert('Labonté Immobilier', `Version ${version}\nRecherchez, louez, vendez.`),
    },
  ];
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------- En-tête ---------- */}
        <LinearGradient
          colors={[VERT, VERT_FONCE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.circleBig} />
          <View style={styles.circleSmall} />

          <Pressable style={[styles.gear, { top: insets.top + 12 }]} onPress={openEdit}>
            <Ionicons name="settings-outline" size={26} color="#fff" />
          </Pressable>

          <View style={styles.headerRow}>
            <View>
              <View style={styles.avatarRing}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                {busy && (
                  <View style={styles.avatarBusy}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </View>
              <Pressable style={styles.camera} onPress={changeAvatar} disabled={busy}>
                <Ionicons name="camera" size={18} color={VERT} />
              </Pressable>
            </View>

            <View style={styles.headerText}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
              {user.emailVerified && (
                <View style={styles.badge}>
                  <Ionicons name="shield-checkmark" size={16} color="#F4B400" />
                  <Text style={styles.badgeText}>Utilisateur vérifié</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

               {/* ---------- Statistiques ---------- */}
        <View style={styles.stats}>
          <Pressable
            style={({ pressed }) => [styles.stat, pressed && styles.statPressed]}
            onPress={() => router.push('/my-listings' as any)}
          >
            <Ionicons name="home" size={28} color={VERT} />
            <Text style={styles.statValue}>{listingCount ?? '–'}</Text>
            <Text style={styles.statLabel}>Mes annonces</Text>
          </Pressable>
          <View style={styles.statDivider} />
          <Pressable
            style={({ pressed }) => [styles.stat, pressed && styles.statPressed]}
            onPress={() => router.push('/favorites' as any)}
          >
            <Ionicons name="heart" size={28} color={VERT} />
            <Text style={styles.statValue}>{favIds.size}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </Pressable>
        </View>

        {/* ---------- Menu ---------- */}
        <View style={styles.menu}>
          {items.map((item, i) => (
            <Pressable
              key={item.title}
              style={({ pressed }) => [
                styles.row,
                i < items.length - 1 && styles.rowBorder,
                pressed && styles.rowPressed,
              ]}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={28} color={VERT} style={styles.rowIcon} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#8A938C" />
            </Pressable>
          ))}
        </View>

        {/* ---------- Déconnexion ---------- */}
        <Pressable style={styles.logout} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={24} color={VERT} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>

      {/* ---------- Modifier le nom ---------- */}
      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Modifier mon profil</Text>
            <Text style={styles.modalLabel}>Nom complet</Text>
            <TextInput
              style={styles.modalInput}
              value={draftName}
              onChangeText={setDraftName}
              autoCapitalize="words"
              placeholder="Votre nom"
              placeholderTextColor="#8A938C"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setEditing(false)} disabled={saving}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={saveName} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Enregistrer</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAF8' },
  content: { paddingBottom: 140 }, // marge pour la barre d'onglets

  // En-tête
  header: {
    paddingHorizontal: 20,
    paddingBottom: 70,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  circleBig: {
    position: 'absolute',
    right: -60,
    top: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circleSmall: {
    position: 'absolute',
    left: -40,
    bottom: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gear: { position: 'absolute', right: 20, zIndex: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: VERT_CLAIR,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: VERT_CLAIR },
  avatarInitial: { fontSize: 42, fontFamily: 'Lora_700Bold', color: VERT },
   avatarBusy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerText: { flex: 1, marginLeft: 18 },
  name: { fontSize: 24, fontFamily: 'Lora_700Bold', color: '#fff' },
  email: { fontSize: 14, fontFamily: 'Lora_400Regular', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Lora_600SemiBold' },

  // Statistiques
  stats: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -44,
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: VERT_CLAIR,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#C7DCCF', marginVertical: 6 },
  statValue: { fontSize: 26, fontFamily: 'Lora_700Bold', color: '#1B2424', marginTop: 4 },
  statLabel: { fontSize: 14, fontFamily: 'Lora_500Medium', color: '#4A5A50' },
  statPressed: { opacity: 0.55 },
  // Menu
  menu: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E6E2' },
  rowPressed: { backgroundColor: '#F4F8F5' },
  rowIcon: { width: 40 },
  rowText: { flex: 1, marginLeft: 8 },
  rowTitle: { fontSize: 16, fontFamily: 'Lora_600SemiBold', color: '#1B2424' },
  rowSubtitle: { fontSize: 13, fontFamily: 'Lora_400Regular', color: '#667070', marginTop: 2 },

  // Déconnexion
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: VERT,
    backgroundColor: '#fff',
  },
  logoutText: { fontSize: 17, fontFamily: 'Lora_600SemiBold', color: VERT },

  // Invité
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff', gap: 12 },
  guestTitle: { fontSize: 24, fontFamily: 'Lora_700Bold', color: VERT },
  guestText: {
    fontSize: 16,
    fontFamily: 'Lora_400Regular',
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
  primaryButton: {
    alignSelf: 'stretch',
    backgroundColor: VERT,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Lora_600SemiBold' },
  outlineButton: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: VERT,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  outlineButtonText: { color: VERT, fontSize: 16, fontFamily: 'Lora_600SemiBold' },

  // Modale
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Lora_700Bold', color: VERT, marginBottom: 14 },
  modalLabel: { fontSize: 14, fontFamily: 'Lora_600SemiBold', color: '#333', marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1B2424',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: VERT,
    alignItems: 'center',
  },
  modalCancelText: { color: VERT, fontFamily: 'Lora_600SemiBold', fontSize: 15 },
  modalSave: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: VERT, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontFamily: 'Lora_600SemiBold', fontSize: 15 },
});