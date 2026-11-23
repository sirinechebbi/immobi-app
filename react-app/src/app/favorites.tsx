import { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Annonce = {
  id: string;
  title: string;
  location: string;
  type: "Vente" | "Location";
  price: number;
  surface: number;
  rooms: number;
  image: string;
};

// Données de démonstration : remplace-les par Firestore / ton store
const INITIAL_FAVORITES: Annonce[] = [
  {
    id: "1",
    title: "Villa avec piscine",
    location: "La Marsa, Tunis",
    type: "Vente",
    price: 1250000,
    surface: 320,
    rooms: 5,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600",
  },
  {
    id: "2",
    title: "Appartement S+2 vue mer",
    location: "Sousse, Corniche",
    type: "Location",
    price: 1800,
    surface: 95,
    rooms: 3,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
  },
  {
    id: "3",
    title: "Studio meublé centre-ville",
    location: "Tunis, Lafayette",
    type: "Location",
    price: 950,
    surface: 42,
    rooms: 1,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600",
  },
];

const GREEN = "#4a7355";
const GREEN_DARK = "#3a5c44";
const INK = "#2b3a30";
const MUTED = "#6f7d73";
const BG = "#f6f8f5";
const LINE = "#dfe6df";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

const formatPrice = (price: number, type: Annonce["type"]) =>
  `${price.toLocaleString("fr-FR")} DT${type === "Location" ? " / mois" : ""}`;

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Annonce[]>(INITIAL_FAVORITES);

  const removeFavorite = (id: string) =>
    setFavorites((list) => list.filter((a) => a.id !== id));

  const renderItem = ({ item }: { item: Annonce }) => (
    <Pressable
      style={styles.card}
      // adapte la route vers ta page de détail
      onPress={() => router.push(`/annonce/${item.id}` as any)}
    >
      <View style={styles.photoWrap}>
        <Image source={{ uri: item.image }} style={styles.photo} />
        <View style={styles.tag}>
          <Text style={styles.tagText}>{item.type}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.top}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Pressable
            onPress={() => removeFavorite(item.id)}
            hitSlop={10}
            accessibilityLabel={`Retirer ${item.title} des favoris`}
          >
            <Ionicons name="heart" size={22} color={GREEN} />
          </Pressable>
        </View>

        <Text style={styles.meta}>{item.location}</Text>
        <Text style={styles.meta}>
          {item.surface} m² · {item.rooms} {item.rooms > 1 ? "pièces" : "pièce"}
        </Text>
        <Text style={styles.price}>{formatPrice(item.price, item.type)}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          style={styles.back}
          onPress={() => router.back()}
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={22} color={GREEN} />
        </Pressable>
        <Text style={styles.headerTitle}>Mes favoris</Text>
        <View style={styles.count}>
          <Text style={styles.countText}>{favorites.length}</Text>
        </View>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={64} color={GREEN} />
            <Text style={styles.emptyTitle}>Aucun favori pour le moment</Text>
            <Text style={styles.emptyText}>
              Appuyez sur le cœur d'une annonce pour la retrouver ici.
            </Text>
            <Pressable style={styles.btn} onPress={() => router.back()}>
              <Text style={styles.btnText}>Parcourir les annonces</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: SERIF,
    fontSize: 22,
    color: INK,
  },
  count: {
    minWidth: 28,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: GREEN,
    alignItems: "center",
  },
  countText: { color: "#fff", fontSize: 13, fontFamily: SERIF },

  list: { padding: 16, paddingTop: 8, flexGrow: 1 },

  card: {
    flexDirection: "row",
    gap: 14,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#fff",
  },
  photoWrap: {
    width: 120,
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: LINE,
  },
  photo: { width: "100%", height: "100%" },
  tag: {
    position: "absolute",
    left: 6,
    bottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(58,92,68,0.9)",
  },
  tagText: { color: "#fff", fontSize: 11, fontFamily: SERIF },

  info: { flex: 1 },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: SERIF,
    fontSize: 16,
    fontWeight: "600",
    color: INK,
  },
  meta: { marginTop: 4, fontFamily: SERIF, fontSize: 13, color: MUTED },
  price: {
    marginTop: "auto",
    fontFamily: SERIF,
    fontSize: 16,
    fontWeight: "600",
    color: GREEN_DARK,
  },

  empty: { alignItems: "center", marginTop: 80, paddingHorizontal: 24 },
  emptyTitle: {
    marginTop: 16,
    fontFamily: SERIF,
    fontSize: 18,
    color: INK,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 6,
    marginBottom: 24,
    fontFamily: SERIF,
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
  },
  btn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: GREEN,
  },
  btnText: { color: "#fff", fontFamily: SERIF, fontSize: 15 },
});