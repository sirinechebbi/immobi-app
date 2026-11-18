import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authErrorMessage } from '@/api/authApi';
import { createListing, uploadPhoto } from '@/api/publishApi';
import { PROPERTY_LABELS, PropertyType, Transaction } from '@/constants/propreties';
import { Coords, geocodeAddress, getCurrentCoords, reverseGeocode } from '@/services/location';
import { useAuthStore } from '@/store/authStore';

const VERT = '#4A6B53';
const GRIS = '#8A938C';
const MAX_PHOTOS = 10;

const TRANSACTIONS: { value: Transaction; label: string }[] = [
  { value: 'vente', label: 'Vente' },
  { value: 'location', label: 'Location' },
];

const PROPERTY_TYPES = (Object.keys(PROPERTY_LABELS) as PropertyType[]).map((value) => ({
  value,
  label: PROPERTY_LABELS[value],
}));

type Photo = { uri: string; base64: string };

function parseNumber(value: string): number | null {
  const cleaned = value.replace(/\s/g, '').replace(',', '.');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

export default function PublishScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [transaction, setTransaction] = useState<Transaction>('vente');
  const [propertyType, setPropertyType] = useState<PropertyType>('appartement');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [surface, setSurface] = useState('');
  const [rooms, setRooms] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  // ---------- Invité : demande de connexion ----------
  if (!user) {
    return (
      <SafeAreaView style={styles.guest}>
        <Text style={styles.title}>Publier une annonce</Text>
        <Text style={styles.guestText}>
          Connectez-vous ou créez un compte pour publier votre bien.
        </Text>
        <Pressable style={styles.button} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>Se connecter</Text>
        </Pressable>
        <Pressable style={styles.buttonOutline} onPress={() => router.push('/register')}>
          <Text style={styles.buttonOutlineText}>Créer un compte</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ---------- Photos ----------
  const pickPhotos = async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.6,
      base64: true,
    });
    if (!res.canceled) {
      const picked = res.assets
        .filter((a) => a.base64)
        .map((a) => ({ uri: a.uri, base64: a.base64 as string }));
      setPhotos((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (uri: string) =>
    setPhotos((prev) => prev.filter((p) => p.uri !== uri));

  // ---------- Position ----------
  const useMyLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      const c = await getCurrentCoords();
      setCoords(c);
      const place = await reverseGeocode(c);
      if (place) {
        if (!city.trim() && place.city) setCity(place.city);
        if (!address.trim() && place.address) setAddress(place.address);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Position indisponible.');
    } finally {
      setLocating(false);
    }
  };

  const locateFromAddress = async () => {
    const query = [address, city].filter((s) => s.trim()).join(', ');
    if (!query) {
      setError("Saisissez l'adresse ou la ville d'abord.");
      return;
    }
    setLocating(true);
    setError(null);
    try {
      const c = await geocodeAddress(query);
      if (!c) setError('Adresse introuvable. Essayez avec « Ma position ».');
      else setCoords(c);
    } catch {
      setError('Impossible de localiser cette adresse.');
    } finally {
      setLocating(false);
    }
  };

  // ---------- Publication ----------
  const validate = (): string | null => {
    if (title.trim().length < 5) return 'Le titre doit contenir au moins 5 caractères.';
    const p = parseNumber(price);
    if (p === null || p <= 0) return 'Indiquez un prix valide.';
    if (!city.trim()) return 'Indiquez la ville.';
    if (!coords) return "Enregistrez la position du bien (Ma position ou Depuis l'adresse).";
    if (photos.length === 0) return 'Ajoutez au moins une photo.';
    return null;
  };

  const resetForm = () => {
    setTransaction('vente');
    setPropertyType('appartement');
    setTitle('');
    setDescription('');
    setPrice('');
    setSurface('');
    setRooms('');
    setCity('');
    setAddress('');
    setCoords(null);
    setPhotos([]);
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        setProgress(`Envoi des photos ${i + 1}/${photos.length}…`);
        urls.push(await uploadPhoto(photos[i].base64));
      }
      setProgress("Création de l'annonce…");
      await createListing(
        {
          transaction,
          propertyType,
          title,
          description,
          price: parseNumber(price) as number,
          surfaceM2: parseNumber(surface),
          rooms: parseNumber(rooms),
          city,
          address,
          lat: coords!.lat,
          lng: coords!.lng,
          photos: urls,
        },
        user.uid,
        user.displayName
      );
      resetForm();
      Alert.alert('Annonce publiée', 'Votre annonce est maintenant en ligne.', [
        { text: 'OK', onPress: () => router.navigate('/') },
      ]);
    } catch (e) {
      setError(
        e instanceof FirebaseError
          ? authErrorMessage(e)
          : e instanceof Error
          ? e.message
          : 'Une erreur est survenue.'
      );
    } finally {
      setSubmitting(false);
      setProgress('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Publier une annonce</Text>

          {/* Vente / Location */}
          <View style={styles.segment}>
            {TRANSACTIONS.map((t) => (
              <Pressable
                key={t.value}
                style={[styles.segmentItem, transaction === t.value && styles.segmentActive]}
                onPress={() => setTransaction(t.value)}
              >
                <Text
                  style={[styles.segmentText, transaction === t.value && styles.segmentTextActive]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Type de bien */}
          <Text style={styles.label}>Type de bien</Text>
          <View style={styles.chips}>
            {PROPERTY_TYPES.map((t) => (
              <Pressable
                key={t.value}
                style={[styles.chip, propertyType === t.value && styles.chipActive]}
                onPress={() => setPropertyType(t.value)}
              >
                <Text style={[styles.chipText, propertyType === t.value && styles.chipTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Infos */}
          <Text style={styles.label}>Titre</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : Appartement S+2 vue mer"
            placeholderTextColor={GRIS}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Décrivez le bien : état, étage, équipements…"
            placeholderTextColor={GRIS}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            maxLength={5000}
          />

          <Text style={styles.label}>
            {transaction === 'vente' ? 'Prix (DT)' : 'Loyer mensuel (DT)'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : 280000"
            placeholderTextColor={GRIS}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Surface (m²)</Text>
              <TextInput
                style={styles.input}
                placeholder="95"
                placeholderTextColor={GRIS}
                value={surface}
                onChangeText={setSurface}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Pièces</Text>
              <TextInput
                style={styles.input}
                placeholder="3"
                placeholderTextColor={GRIS}
                value={rooms}
                onChangeText={setRooms}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Localisation */}
          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : Sousse"
            placeholderTextColor={GRIS}
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.label}>Adresse</Text>
          <TextInput
            style={styles.input}
            placeholder="Rue, quartier"
            placeholderTextColor={GRIS}
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.row}>
            <Pressable
              style={[styles.buttonOutline, styles.half]}
              onPress={useMyLocation}
              disabled={locating}
            >
              <Text style={styles.buttonOutlineText}>Ma position</Text>
            </Pressable>
            <Pressable
              style={[styles.buttonOutline, styles.half]}
              onPress={locateFromAddress}
              disabled={locating}
            >
              <Text style={styles.buttonOutlineText}>Depuis l'adresse</Text>
            </Pressable>
          </View>
          {locating && <ActivityIndicator color={VERT} style={styles.spacer} />}
          {coords && (
            <Text style={styles.ok}>
              ✓ Position enregistrée ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
            </Text>
          )}

          {/* Photos */}
          <Text style={styles.label}>
            Photos ({photos.length}/{MAX_PHOTOS})
          </Text>
          <View style={styles.photos}>
            {photos.map((p, i) => (
              <View key={p.uri} style={styles.photoBox}>
                <Image source={{ uri: p.uri }} style={styles.photo} />
                {i === 0 && (
                  <View style={styles.cover}>
                    <Text style={styles.coverText}>Couverture</Text>
                  </View>
                )}
                <Pressable style={styles.remove} onPress={() => removePhoto(p.uri)}>
                  <Text style={styles.removeText}>×</Text>
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable style={[styles.photoBox, styles.addPhoto]} onPress={pickPhotos}>
                <Text style={styles.addPhotoText}>+</Text>
              </Pressable>
            )}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <View style={styles.rowCenter}>
                <ActivityIndicator color="#fff" />
                <Text style={[styles.buttonText, styles.progress]}>{progress}</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Publier l'annonce</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 140 }, // marge pour la barre d'onglets
  title: { fontSize: 24, fontFamily: 'Lora_700Bold', color: VERT, marginBottom: 16 },
  label: {
    fontSize: 14,
    fontFamily: 'Lora_600SemiBold',
    color: '#333',
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1B2424',
  },
  multiline: { minHeight: 100 },
  row: { flexDirection: 'row', gap: 12, marginTop: 4 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  half: { flex: 1 },
  spacer: { marginTop: 10 },

  segment: { flexDirection: 'row', backgroundColor: '#F1F4F2', borderRadius: 12, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: VERT },
  segmentText: { fontFamily: 'Lora_600SemiBold', color: '#555' },
  segmentTextActive: { color: '#fff' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F4F2',
  },
  chipActive: { backgroundColor: VERT },
  chipText: { fontFamily: 'Lora_500Medium', color: '#444', fontSize: 14 },
  chipTextActive: { color: '#fff' },

  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoBox: { width: 96, height: 96, borderRadius: 12, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  cover: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 2,
  },
  coverText: { color: '#fff', fontSize: 11, textAlign: 'center' },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 16, lineHeight: 18 },
  addPhoto: {
    borderWidth: 1.5,
    borderColor: VERT,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: { fontSize: 32, color: VERT },

  ok: { color: VERT, marginTop: 8, fontFamily: 'Lora_500Medium' },
  error: { color: '#c0392b', marginTop: 16, textAlign: 'center' },

  button: {
    backgroundColor: VERT,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: 'Lora_600SemiBold' },
  progress: { marginLeft: 10 },
  buttonOutline: {
    borderWidth: 1,
    borderColor: VERT,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonOutlineText: { color: VERT, fontSize: 15, fontFamily: 'Lora_600SemiBold' },

  guest: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    gap: 12,
  },
  guestText: {
    fontSize: 16,
    fontFamily: 'Lora_400Regular',
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
});