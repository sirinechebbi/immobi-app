import { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingSlide, slides } from '@/constants/onboarding';
import { useOnboardingStore } from '@/store/onboardingStore';
import { colors, fonts } from '@/theme';

function Slide({ item, width }: { item: OnboardingSlide; width: number }) {
  const boxWidth = width * 0.78;
  return (
    <View style={[styles.slide, { width }]}>
      <View style={{ width: boxWidth, height: boxWidth * 0.75 }}>
        <Image
          source={item.image}
          resizeMode={item.photo ? 'cover' : 'contain'}
          style={[styles.image, item.photo && styles.photo]}
        />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const complete = useOnboardingStore((s) => s.complete);

  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  const isLast = index === slides.length - 1;

  const onNext = () => {
    if (isLast) {
      complete();
    } else {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
    listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Slide item={item} width={width} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const backgroundColor = scrollX.interpolate({
              inputRange,
              outputRange: [colors.dot, colors.primary, colors.dot],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View key={i} style={[styles.dot, { width: dotWidth, backgroundColor }]} />
            );
          })}
        </View>

        <Pressable
          onPress={onNext}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{isLast ? 'Commencer' : 'Suivant'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  image: { width: '100%', height: '100%' },
  photo: { borderRadius: 26 },
  title: {
    marginTop: 34,
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
  },
  text: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.primary,
    textAlign: 'center',
  },
  footer: { alignItems: 'center', paddingBottom: 36 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 28 },
  dot: { height: 8, borderRadius: 4 },
  button: {
    width: '78%',
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { backgroundColor: colors.primaryDark },
  buttonText: { fontFamily: fonts.semibold, fontSize: 16, color: '#FFFFFF' },
});