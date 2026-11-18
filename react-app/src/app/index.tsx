import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logOut } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';

const VERT = '#4A6B53';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Accueil</Text>

      {user ? (
        <View style={styles.block}>
          <Text style={styles.text}>Bienvenue {user.displayName ?? user.email}</Text>
          <Pressable style={styles.button} onPress={() => logOut()}>
            <Text style={styles.buttonText}>Se déconnecter</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.block}>
          <Text style={styles.text}>Vous naviguez en tant qu'invité.</Text>
          <Pressable style={styles.button} onPress={() => router.push('/login')}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </Pressable>
          <Pressable style={styles.buttonOutline} onPress={() => router.push('/register')}>
            <Text style={styles.buttonOutlineText}>Créer un compte</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontFamily: 'Lora_700Bold', color: VERT },
  block: { width: '100%', marginTop: 20, gap: 12 },
  text: { fontSize: 16, fontFamily: 'Lora_400Regular', color: '#555', textAlign: 'center', marginBottom: 8 },
  button: { backgroundColor: VERT, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: 'Lora_600SemiBold' },
  buttonOutline: { borderWidth: 1, borderColor: VERT, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonOutlineText: { color: VERT, fontSize: 16, fontFamily: 'Lora_600SemiBold' },
});