
// Importation du type ImageSourcePropType depuis React Native.
// Il permet de définir le type des images utilisées dans l'application.
import { ImageSourcePropType } from 'react-native';

// Déclaration d'un type personnalisé appelé OnboardingSlide.
// Il définit la structure que chaque écran d'onboarding doit respecter.
export type OnboardingSlide = {
  id: string; // Identifiant unique de chaque écran.
  title: string; // Titre affiché sur l'écran.
  text: string; // Description affichée sous le titre.
  image: ImageSourcePropType; // Image associée à l'écran.
  photo: boolean; // Indique le style de l'image :
                  // true = photo arrondie
                  // false = illustration.
};

// Création et exportation d'un tableau contenant les écrans d'onboarding.
// Chaque élément du tableau représente un écran.
export const slides: OnboardingSlide[] = [

  // Premier écran : présentation de la recherche immobilière.
  {
    id: '1', // Identifiant du premier écran.
    title: 'Trouvez votre chez-vous', // Titre de l'écran.
    text: 'Achetez, louez ou vendez\nvotre bien immobilier.',
    // Description. \n permet de passer à la ligne.
    image: require('../../assets/images/onboarding/maison.png'),
    // Chargement de l'image maison.png depuis le dossier assets.
    photo: true, // L'image sera affichée sous forme de photo arrondie.
  },

  // Deuxième écran : présentation de la localisation des biens.
  {
    id: '2', // Identifiant du deuxième écran.
    title: 'Localisez sur la carte',
    text: 'Repérez les biens et explorez\nles quartiers qui vous plaisent.',
    image: require('../../assets/images/onboarding/carte.png'),
    // Image représentant la carte.
    photo: true, // Affichage sous forme de photo arrondie.
  },

  // Troisième écran : présentation de la publication et de la communication.
  {
    id: '3', // Identifiant du troisième écran.
    title: 'Publiez et discutez',
    text: "Publiez des annonces\net contactez l'annonceur.",
    image: require('../../assets/images/onboarding/message.png'),
    // Image représentant la messagerie.
    photo: false, // Affichage sous forme d'illustration.
  },
];
