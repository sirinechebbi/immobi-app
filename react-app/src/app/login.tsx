import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
    ActivityIndicator,
    Alert,
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

import { authErrorMessage, signIn } from '@/api/authApi';
import { colors, fonts } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Attention', 'Veuillez remplir tous les champs.');
      return;
    }

    try {
      setLoading(true);

      await signIn(email, password);

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)' as never);
      }
    } catch (error) {
      Alert.alert('Connexion impossible', authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={styles.back}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.logo}>ImmoBi</Text>
            <Text style={styles.title}>Bon retour !</Text>
            <Text style={styles.subtitle}>
              Connectez-vous pour retrouver vos annonces favorites.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Adresse e-mail</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.muted}
              />
              <TextInput
                style={styles.input}
                placeholder="exemple@email.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.label}>Mot de passe</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.muted}
              />

              <TextInput
                style={styles.input}
                placeholder="Votre mot de passe"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />

              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            <Pressable
              style={styles.forgot}
              onPress={() => Alert.alert(
                'Mot de passe oublié',
                'La fonctionnalité de réinitialisation sera ajoutée ensuite.'
              )}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </Pressable>

            <Pressable
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginText}>Se connecter</Text>
              )}
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  back: {
    marginBottom: 35,
  },
  header: {
    marginBottom: 35,
  },
  logo: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.primary,
    marginBottom: 35,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 23,
  },
  form: {
    gap: 12,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
  },
  inputContainer: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginVertical: 8,
  },
  forgotText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primary,
  },
  loginButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  loginText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});