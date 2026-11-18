import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';

const VERT = '#4A6B53';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  const seConnecter = async () => {
    if (!email.trim() || !motDePasse) {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }
    setErreur('');
    setChargement(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), motDePasse);
    } catch (e: any) {
      setErreur('Email ou mot de passe incorrect.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.titre}>Connexion</Text>
      <Text style={styles.sousTitre}>Bienvenue sur Labonté Immobilier</Text>

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

      {erreur !== '' && <Text style={styles.erreur}>{erreur}</Text>}

      <Pressable style={styles.bouton} onPress={seConnecter} disabled={chargement}>
        {chargement ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.boutonTexte}>Se connecter</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push('/register')}>
        <Text style={styles.lien}>
          Pas de compte ? <Text style={styles.lienGras}>S’inscrire</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
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