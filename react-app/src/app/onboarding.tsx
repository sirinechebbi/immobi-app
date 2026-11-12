
// Importation des hooks React.
import { useRef, useState } from 'react';

// Importation des composants et fonctionnalités de React Native.
import {
  Animated, // Permet de créer des animations.
  FlatList, // Permet d'afficher une liste d'éléments.
  Image, // Permet d'afficher des images.
  NativeScrollEvent, // Type de l'événement de défilement.
  NativeSyntheticEvent, // Type de l'événement natif React Native.
  Pressable, // Composant permettant de détecter les clics.
  StyleSheet, // Permet de définir les styles.
  Text, // Permet d'afficher du texte.
  View, // Conteneur pour organiser les éléments.
  useWindowDimensions, // Récupère les dimensions de l'écran.
} from 'react-native';

// Importation de SafeAreaView pour respecter les zones de sécurité
// du téléphone (encoche, barre de statut, etc.).
import { SafeAreaView } from 'react-native-safe-area-context';

// Importation du type OnboardingSlide et du tableau des slides.
// Ces données sont définies dans constants/onboarding.
import { OnboardingSlide, slides } from '@/constants/onboarding';

// Importation du store qui permet de gérer l'état de l'onboarding.
// complete() indique que l'utilisateur a terminé l'onboarding.
import { useOnboardingStore } from '@/store/onboardingStore';

// Importation des couleurs et des polices personnalisées.
import { colors, fonts } from '@/theme';


// =====================================================
// 1. COMPOSANT SLIDE
// =====================================================

// Ce composant affiche un seul écran de l'onboarding.
// Il reçoit deux propriétés :
// item = les données de l'écran actuel.
// width = la largeur de l'écran du téléphone.

function Slide({ item, width }: { item: OnboardingSlide; width: number }) {

  // Calcul de la largeur du conteneur de l'image.
  // L'image occupera 78 % de la largeur de l'écran.
  const boxWidth = width * 0.78;

  return (
    // Conteneur principal de chaque slide.
    // Sa largeur correspond à celle de l'écran.
    <View style={[styles.slide, { width }]}>

      {/* Conteneur de l'image */}
      <View style={{ width: boxWidth, height: boxWidth * 0.75 }}>

        <Image
          source={item.image} // Image provenant des données de la slide.

          // Si photo = true : l'image remplit son conteneur.
          // Si photo = false : l'image conserve ses proportions.
          resizeMode={item.photo ? 'cover' : 'contain'}

          // Application du style général de l'image.
          // Si photo = true, on ajoute aussi le style photo.
          style={[styles.image, item.photo && styles.photo]}
        />
      </View>

      {/* Affichage du titre de la slide */}
      <Text style={styles.title}>{item.title}</Text>

      {/* Affichage du texte descriptif */}
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );
}


// =====================================================
// 2. COMPOSANT PRINCIPAL : ONBOARDING SCREEN
// =====================================================

export default function OnboardingScreen() {

  // Récupération de la largeur de l'écran du téléphone.
  // Cette largeur permet d'adapter les slides à la taille de l'écran.
  const { width } = useWindowDimensions();

  // Récupération de la fonction complete depuis le store.
  // Elle sera appelée lorsque l'utilisateur termine l'onboarding.
  const complete = useOnboardingStore((s) => s.complete);

  // Création d'une référence vers FlatList.
  // Elle permet de contrôler la liste et de passer à une slide précise.
  const listRef = useRef<FlatList<OnboardingSlide>>(null);

  // Création d'une valeur animée pour suivre le défilement horizontal.
  // Elle sera utilisée pour animer les indicateurs (points).
  const scrollX = useRef(new Animated.Value(0)).current;

  // État qui mémorise l'index de la slide actuellement affichée.
  // Au début, l'utilisateur se trouve sur la première slide (index 0).
  const [index, setIndex] = useState(0);

  // Vérification si l'utilisateur est sur la dernière slide.
  // slides.length = nombre total de slides.
  // L'index commence à 0, donc la dernière position est length - 1.
  const isLast = index === slides.length - 1;


  // =====================================================
  // 3. FONCTION DU BOUTON SUIVANT
  // =====================================================

  const onNext = () => {

    // Si l'utilisateur est sur la dernière slide :
    if (isLast) {

      // On indique que l'onboarding est terminé.
      // Le store peut alors enregistrer cette information.
      complete();

    } else {

      // Sinon, on passe à la slide suivante.
      // index + 1 représente la position suivante.
      // animated: true active une transition animée.
      listRef.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
    }
  };


  // =====================================================
  // 4. GESTION DU DÉFILEMENT ET DES ANIMATIONS
  // =====================================================

  // Animated.event permet de récupérer automatiquement
  // la position horizontale du défilement.
  const onScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            x: scrollX, // Stocke la position horizontale dans scrollX.
          },
        },
      },
    ],
    {
      // false permet d'utiliser aussi le listener JavaScript.
      useNativeDriver: false,

      // Cette fonction est appelée pendant le défilement.
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {

        // Récupération de la position horizontale actuelle.
        // Division par la largeur pour obtenir la slide affichée.
        // Math.round arrondit le résultat à l'entier le plus proche.
        setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
      },
    }
  );


  // =====================================================
  // 5. AFFICHAGE DE L'INTERFACE
  // =====================================================

  return (

    // Conteneur principal qui respecte les zones de sécurité.
    <SafeAreaView style={styles.container}>

      {/* Liste horizontale contenant les trois slides */}
      <FlatList
        ref={listRef} // Référence pour contrôler le défilement.

        data={slides} // Tableau contenant les données des slides.

        // Chaque slide possède un identifiant unique.
        keyExtractor={(item) => item.id}

        // Fonction qui affiche chaque élément du tableau.
        // Elle transmet les données et la largeur au composant Slide.
        renderItem={({ item }) => (
          <Slide item={item} width={width} />
        )}

        horizontal // Affichage horizontal des slides.

        pagingEnabled // Passage d'un écran complet à un autre.

        showsHorizontalScrollIndicator={false}
        // Masque la barre de défilement horizontale.

        bounces={false}
        // Désactive l'effet de rebond aux extrémités.

        onScroll={onScroll}
        // Appelle onScroll pendant le défilement.

        scrollEventThrottle={16}
        // Fréquence de mise à jour des événements de défilement.

        getItemLayout={(_, i) => ({
          length: width, // Largeur de chaque slide.
          offset: width * i, // Position de chaque slide.
          index: i, // Index de la slide.
        })}
        // Permet à FlatList de connaître directement
        // la position et la taille de chaque élément.
      />


      {/* =================================================
          6. PIED DE PAGE : INDICATEURS ET BOUTON
         ================================================= */}

      <View style={styles.footer}>

        {/* Conteneur des indicateurs de progression */}
        <View style={styles.dots}>

          {/* Création d'un indicateur pour chaque slide */}
          {slides.map((_, i) => {

            // Définition des positions de l'animation.
            // L'indicateur précédent, actuel et suivant.
            const inputRange = [
              (i - 1) * width,
              i * width,
              (i + 1) * width,
            ];

            // Animation de la largeur du point.
            // Le point actif devient plus large (24).
            // Les autres points restent petits (8).
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });

            // Animation de la couleur du point.
            // Le point actif prend la couleur principale.
            // Les autres utilisent la couleur secondaire.
            const backgroundColor = scrollX.interpolate({
              inputRange,
              outputRange: [
                colors.dot,
                colors.primary,
                colors.dot,
              ],
              extrapolate: 'clamp',
            });

            // Affichage du point animé.
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    backgroundColor,
                  },
                ]}
              />
            );
          })}
        </View>


        {/* Bouton de navigation */}
        <Pressable

          // Appel de onNext lors du clic.
          onPress={onNext}

          // Modification du style lorsque le bouton est pressé.
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >

          {/* Le texte change selon la slide actuelle.
              Dernière slide : Commencer.
              Autres slides : Suivant. */}
          <Text style={styles.buttonText}>
            {isLast ? 'Commencer' : 'Suivant'}
          </Text>

        </Pressable>
      </View>
    </SafeAreaView>
  );
}


// =====================================================
// 7. STYLES DE L'ONBOARDING
// =====================================================

const styles = StyleSheet.create({

  // Style du conteneur principal.
  container: {
    flex: 1, // Occupe tout l'espace disponible.
    backgroundColor: colors.background, // Couleur de fond.
  },

  // Style de chaque slide.
  slide: {
    flex: 1,
    alignItems: 'center', // Centre horizontalement les éléments.
    justifyContent: 'center', // Centre verticalement les éléments.
    paddingHorizontal: 24, // Espacement horizontal.
  },

  // Style général de l'image.
  image: {
    width: '100%',
    height: '100%',
  },

  // Style supplémentaire pour les photos.
  photo: {
    borderRadius: 26, // Coins arrondis.
  },

  // Style du titre.
  title: {
    marginTop: 34, // Espace au-dessus du titre.
    fontFamily: fonts.bold, // Police en gras.
    fontSize: 22, // Taille du texte.
    color: colors.primary, // Couleur du titre.
    textAlign: 'center', // Centrage du texte.
  },

  // Style de la description.
  text: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22, // Hauteur entre les lignes.
    color: colors.primary,
    textAlign: 'center',
  },

  // Style du pied de page.
  footer: {
    alignItems: 'center',
    paddingBottom: 36, // Espace en bas de l'écran.
  },

  // Style des indicateurs.
  dots: {
    flexDirection: 'row', // Points alignés horizontalement.
    alignItems: 'center',
    gap: 6, // Espace entre les points.
    marginBottom: 28,
  },

  // Style de base de chaque point.
  dot: {
    height: 8,
    borderRadius: 4, // Forme arrondie.
  },

  // Style du bouton.
  button: {
    width: '78%',
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Style appliqué lorsque le bouton est pressé.
  buttonPressed: {
    backgroundColor: colors.primaryDark,
  },

  // Style du texte du bouton.
  buttonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
