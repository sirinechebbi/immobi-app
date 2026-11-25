import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

export function ComingSoon({ title }: { title: string }) {
  return (
    <SafeAreaView style={styles.c} edges={['top']}>
      <View style={styles.box}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>Cet écran arrive bientôt.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.primary },
  text: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
});