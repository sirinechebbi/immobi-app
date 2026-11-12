
// Importation des hooks React.
// useEffect : permet d'exécuter une action après le rendu du composant.
// useRef : permet de conserver une valeur entre les rendus.
import { useEffect, useRef } from 'react';

// Importation des composants et fonctionnalités de React Native.
import {
  Animated, // Permet de créer des animations.
  StyleSheet, // Permet de définir les styles.
  View, // Conteneur pour organiser les éléments.
  useWindowDimensions, // Récupère les dimensions de l'écran.
} from 'react-native';

// Importation des couleurs personnalisées du thème.
import { colors } from '@/theme';


// =====================================================
// 1. CRÉATION DU COMPOSANT ANIMATED SPLASH
// =====================================================

// Déclaration et exportation du composant AnimatedSplash.
// Il sera utilisé pour afficher le logo animé au démarrage.
export function AnimatedSplash() {

  // Récupération de la largeur de l'écran du téléphone.
  // Cette valeur permet d'adapter la taille du logo
  // aux différentes tailles d'écran.
  const { width } = useWindowDimensions();


  // =====================================================
  // 2. INITIALISATION DES VALEURS D'ANIMATION
  // =====================================================

  // Création d'une valeur animée pour gérer la transparence.
  // 0 = image invisible.
  // 1 = image totalement visible.
  // useRef conserve cette valeur entre les rendus.
  const opacity = useRef(new Animated.Value(0)).current;

  // Création d'une deuxième valeur animée pour gérer la taille.
  // 0.92 = logo légèrement réduit (92 % de sa taille).
  // 1 = taille normale (100 %).
  const scale = useRef(new Animated.Value(0.92)).current;


  // =====================================================
  // 3. LANCEMENT DE L'ANIMATION
  // =====================================================

  // useEffect permet de lancer l'animation après le rendu
  // initial du composant.
  useEffect(() => {

    // Animated.parallel permet d'exécuter plusieurs animations
    // simultanément.
    Animated.parallel([

      // PREMIÈRE ANIMATION : APPARITION PROGRESSIVE.

      Animated.timing(opacity, {

        toValue: 1, // La transparence passe de 0 à 1.
        duration: 700, // Durée de l'animation : 700 millisecondes.
        useNativeDriver: true, // Exécution de l'animation côté natif.

      }),

      // DEUXIÈME ANIMATION : AGRANDISSEMENT DU LOGO.

      Animated.spring(scale, {

        toValue: 1, // Le logo atteint sa taille normale.
        friction: 7, // Contrôle l'effet de rebond de l'animation.
        useNativeDriver: true, // Exécution de l'animation côté natif.

      }),

    // Démarrage simultané des deux animations.
    ]).start();

  // Dépendances de useEffect.
  // L'effet sera relancé si opacity ou scale change.
  }, [opacity, scale]);


  // =====================================================
  // 4. CALCUL DE LA TAILLE DU LOGO
  // =====================================================

  // La largeur du logo représente 55 % de la largeur de l'écran.
  const size = width * 0.55;


  // =====================================================
  // 5. AFFICHAGE DU LOGO ANIMÉ
  // =====================================================

  return (

    // Conteneur principal qui occupe tout l'écran.
    <View style={styles.container}>

      {/* Affichage du logo avec des animations */}
      <Animated.Image

        // Chargement de l'image locale du logo.
        source={require('../../assets/images/onboarding/logo.png')}

        // L'image conserve ses proportions sans être déformée.
        resizeMode="contain"

        // Application des dimensions et des animations.
        style={{

          width: size, // Largeur calculée du logo.
          height: size, // Hauteur calculée du logo.

          opacity, // Animation de transparence (apparition).

          // Animation de mise à l'échelle (agrandissement).
          transform: [{ scale }],
        }}
      />

    </View>
  );
}


// =====================================================
// 6. DÉFINITION DES STYLES
// =====================================================

const styles = StyleSheet.create({

  // Style du conteneur principal.
  container: {

    flex: 1, // Occupe tout l'espace disponible.

    alignItems: 'center',
    // Centre le logo horizontalement.

    justifyContent: 'center',
    // Centre le logo verticalement.

    backgroundColor: colors.background,
    // Applique la couleur de fond définie dans le thème.
  },

});
