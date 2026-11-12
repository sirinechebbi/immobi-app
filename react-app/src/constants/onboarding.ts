import { ImageSourcePropType } from 'react-native';

export type OnboardingSlide = {
  id: string;
  title: string;
  text: string;
  image: ImageSourcePropType;
  photo: boolean; // true = photo arrondie, false = illustration
};

export const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Trouvez votre chez-vous',
    text: 'Achetez, louez ou vendez\nvotre bien immobilier.',
    image: require('../../assets/images/onboarding/maison.png'),
    photo: true,
  },
  {
    id: '2',
    title: 'Localisez sur la carte',
    text: 'Repérez les biens et explorez\nles quartiers qui vous plaisent.',
    image: require('../../assets/images/onboarding/carte.png'),
    photo: true,
  },
  {
    id: '3',
    title: 'Publiez et discutez',
    text: "Publiez des annonces\net contactez l'annonceur.",
    image: require('../../assets/images/onboarding/message.png'),
    photo: false,
  },
];