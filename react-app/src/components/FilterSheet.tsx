import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Transaction } from '@/constants/propreties';
import { colors, fonts } from '@/theme';

export type SortKey = 'recent' | 'prix_asc' | 'prix_desc';

export type Filters = {
  transaction: Transaction | 'tout';
  minPrice: string; // kept as text because it comes from a text input
  maxPrice: string;
  minRooms: number; // 0 = any number of rooms
  sort: SortKey;
};

// Values meaning "no filter"
export const DEFAULT_FILTERS: Filters = {
  transaction: 'tout',
  minPrice: '',
  maxPrice: '',
  minRooms: 0,
  sort: 'recent',
};

// How many filters are active (shown as a number on the filter button)
export function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.transaction !== 'tout') n++;
  if (f.minPrice || f.maxPrice) n++;
  if (f.minRooms > 0) n++;
  if (f.sort !== 'recent') n++;
  return n;
}

const TRANSACTIONS: { key: Transaction | 'tout'; label: string }[] = [
  { key: 'tout', label: 'Tout' },
  { key: 'vente', label: 'Acheter' },
  { key: 'location', label: 'Louer' },
];

const ROOMS = [0, 1, 2, 3, 4, 5];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Plus récentes' },
  { key: 'prix_asc', label: 'Prix croissant' },
  { key: 'prix_desc', label: 'Prix décroissant' },
];

type Props = {
  visible: boolean;
  value: Filters; // filters currently applied
  onApply: (f: Filters) => void;
  onClose: () => void;
};

// Small selectable pill, used in every section
function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipT, on && styles.chipTOn]}>{label}</Text>
    </Pressable>
  );
}

export function FilterSheet({ visible, value, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();

  // The user edits a copy (draft); it only becomes real when he taps "Appliquer"
  const [draft, setDraft] = useState<Filters>(value);

  // Each time the sheet opens, start again from the filters currently applied
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const set = (patch: Partial<Filters>) => setDraft((d: Filters) => ({ ...d, ...patch }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Dark background: tapping it closes the sheet */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Filtres</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Fermer">
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Buy or rent */}
            <Text style={styles.label}>Type d'annonce</Text>
            <View style={styles.wrap}>
              {TRANSACTIONS.map((t) => (
                <Chip
                  key={t.key}
                  label={t.label}
                  on={draft.transaction === t.key}
                  onPress={() => set({ transaction: t.key })}
                />
              ))}
            </View>

            {/* Price range */}
            <Text style={styles.label}>Prix (TND)</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.input}
                placeholder="Min"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={draft.minPrice}
                onChangeText={(t: string) => set({ minPrice: t.replace(/[^0-9]/g, '') })}
              />
              <Text style={styles.dash}>à</Text>
              <TextInput
                style={styles.input}
                placeholder="Max"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={draft.maxPrice}
                onChangeText={(t: string) => set({ maxPrice: t.replace(/[^0-9]/g, '') })}
              />
            </View>
            <Text style={styles.hint}>
              Astuce : choisissez d'abord Acheter ou Louer, les prix de vente et de location sont très différents.
            </Text>

            {/* Minimum number of rooms */}
            <Text style={styles.label}>Pièces minimum</Text>
            <View style={styles.wrap}>
              {ROOMS.map((n) => (
                <Chip
                  key={n}
                  label={n === 0 ? 'Tous' : `${n}+`}
                  on={draft.minRooms === n}
                  onPress={() => set({ minRooms: n })}
                />
              ))}
            </View>

            {/* Sorting */}
            <Text style={styles.label}>Trier par</Text>
            <View style={styles.wrap}>
              {SORTS.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  on={draft.sort === s.key}
                  onPress={() => set({ sort: s.key })}
                />
              ))}
            </View>
          </ScrollView>

          {/* Bottom buttons */}
          <View style={styles.footer}>
            <Pressable style={styles.btnOutline} onPress={() => setDraft(DEFAULT_FILTERS)}>
              <Text style={styles.btnOutlineT}>Réinitialiser</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => onApply(draft)}>
              <Text style={styles.btnT}>Appliquer</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    maxHeight: '88%',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.primary },
  body: { paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, marginTop: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.primary },
  chipT: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  chipTOn: { color: '#FFFFFF' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  dash: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnT: { fontFamily: fonts.semibold, fontSize: 15, color: '#FFFFFF' },
  btnOutline: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineT: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primary },
});