import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/config/firebase';

const VERT = '#4A6B53';

export default function Register() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  const sInscrire = async () => {
    if (!nom.trim() || !email.trim() || !motDePasse) {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }
    if (motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur('Les mots de passe ne correspondent pas.');
      return;
    }
    setErreur('');
    setChargement(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), motDePasse);
      await updateProfile(cred.user, { displayName: nom.trim() });
    } catch (e: any) {
      if (e?.code === 'auth/email-already-in-use') setErreur('Cet email est déjà utilisé.');
      else if (e?.code === 'auth/invalid-email') setErreur('Email invalide.');
      else setErreur('Erreur lors de l’inscription.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        <Text style={styles.titre}>Inscription</Text>
        <Text style={styles.sousTitre}>Créez votre compte Labonté Immobilier</Text>

        <TextInput style={styles.input} placeholder="Nom complet" value={nom} onChangeText={setNom} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          secureTextEntry
          value={motDePasse}
          onChangeText={setMotDePasse}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          secureTextEntry
          value={confirmation}
          onChangeText={setConfirmation}
        />

        {erreur !== '' && <Text style={styles.erreur}>{erreur}</Text>}

        <Pressable style={styles.bouton} onPress={sInscrire} disabled={chargement}>
          {chargement ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.boutonTexte}>S’inscrire</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace('/login')}>
          <Text style={styles.lien}>
            Déjà un compte ? <Text style={styles.lienGras}>Se connecter</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contenu: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  titre: { fontSize: 28, fontFamily: 'Lora_700Bold', textAlign: 'center', color: VERT },
  sousTitre: { fontSize: 15, fontFamily: 'Lora_400Regular', textAlign: 'center', color: '#555', marginBottom: 32 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 16, marginBottom: 14,
  },
  erreur: { color: '#c0392b', marginBottom: 12, textAlign: 'center' },
  bouton: { backgroundColor: VERT, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  boutonTexte: { color: '#fff', fontSize: 16, fontFamily: 'Lora_600SemiBold' },
  lien: { textAlign: 'center', marginTop: 20, color: '#555', fontFamily: 'Lora_400Regular' },
  lienGras: { color: VERT, fontFamily: 'Lora_700Bold' },
});