// app/onboarding.js
// ============================================================
// EVERIA — ACTIVATION ONBOARDING
// ============================================================
// Le parcours ne vend pas une galerie. Il fait vivre, dès les premières
// secondes, la promesse "un événement, des centaines d'histoires" et
// sépare clairement l'organisateur (créateur/payant) de l'invité (sans
// friction).
// ============================================================

import React, {
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  router,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import theme from '@/theme';
import Logo from '@/components/brand/Logo';
import Button from '@/components/ui/Button';

const {
  width: SCREEN_WIDTH,
} = Dimensions.get('window');

const SLIDES = [
  {
    eyebrow: 'UNE NOUVELLE FAÇON DE SE SOUVENIR',
    title: 'Un événement.{\n}Des histoires uniques.',
    body: 'Chaque photo, défi et message révèle une facette différente du même moment.',
    icon: 'sparkles-outline',
    color: '#F2C98A',
    label: '27 moments partagés',
  },
  {
    eyebrow: 'INVITÉS SANS FRICTION',
    title: 'Un scan.{\n}Puis ils participent.',
    body: 'Un QR code ou un lien suffit pour capturer, réagir et contribuer — sans installation obligatoire.',
    icon: 'qr-code-outline',
    color: '#CBA2EB',
    label: 'Accès instantané',
  },
  {
    eyebrow: 'LA PROMESSE EVERIA',
    title: 'Ils repartent avec{\n}leur propre histoire.',
    body: 'Après l’événement, Everia transforme les contributions de chacun en My Story et en Replay personnel.',
    icon: 'film-outline',
    color: '#8CD5C0',
    label: 'My Story prête',
  },
];

export default function Onboarding() {
  const [
    index,
    setIndex,
  ] = useState(0);

  const listRef = useRef(null);
  const pageOpacity = useRef(
    new Animated.Value(1)
  ).current;

  const isLastSlide =
    index === SLIDES.length - 1;

  const setSlide = (
    nextIndex
  ) => {
    setIndex(nextIndex);

    Animated.sequence([
      Animated.timing(
        pageOpacity,
        {
          toValue: 0.76,
          duration: theme.animation.fast,
          useNativeDriver: true,
        }
      ),
      Animated.timing(
        pageOpacity,
        {
          toValue: 1,
          duration: theme.animation.normal,
          useNativeDriver: true,
        }
      ),
    ]).start();
  };

  const goToNextSlide = () => {
    const nextIndex =
      Math.min(
        index + 1,
        SLIDES.length - 1
      );

    listRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });

    setSlide(nextIndex);
  };

  const finishForOrganizer = () => {
    router.replace('/(auth)/welcome');
  };

  const finishForGuest = () => {
    router.replace('/join');
  };

  return (
    <LinearGradient
      colors={theme.gradients.darkLuxury}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 1,
        y: 1,
      }}
      style={styles.container}
    >
      <StatusBar style="light" />

      <View
        pointerEvents="none"
        style={styles.ambientOne}
      />

      <View
        pointerEvents="none"
        style={styles.ambientTwo}
      />

      <SafeAreaView
        style={styles.safeArea}
        edges={[
          'top',
          'bottom',
        ]}
      >
        <View style={styles.header}>
          <Logo
            variant="full"
            size={98}
          />

          {!isLastSlide ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Passer la présentation"
              onPress={finishForOrganizer}
              hitSlop={12}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>
                Passer
              </Text>

              <Ionicons
                name="arrow-forward"
                size={14}
                color={theme.colors.white60}
              />
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item) => item.eyebrow}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(
              event.nativeEvent.contentOffset.x /
                SCREEN_WIDTH
            );

            if (nextIndex !== index) {
              setSlide(nextIndex);
            }
          }}
          renderItem={({
            item,
          }) => (
            <Animated.View
              style={[
                styles.slide,
                {
                  width: SCREEN_WIDTH,
                  opacity: pageOpacity,
                },
              ]}
            >
              <StoryPreview
                icon={item.icon}
                accent={item.color}
                label={item.label}
              />

              <Text style={styles.eyebrow}>
                {item.eyebrow}
              </Text>

              <Text style={styles.title}>
                {item.title}
              </Text>

              <Text style={styles.body}>
                {item.body}
              </Text>
            </Animated.View>
          )}
        />

        <View style={styles.footer}>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Étape ${index + 1} sur ${SLIDES.length}`}
            accessibilityValue={{
              min: 1,
              max: SLIDES.length,
              now: index + 1,
            }}
            style={styles.progressRow}
          >
            {SLIDES.map((slide, slideIndex) => (
              <View
                key={slide.eyebrow}
                style={[
                  styles.progressDot,
                  slideIndex === index &&
                    styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {isLastSlide ? (
            <View style={styles.finalActions}>
              <Button
                title="Créer mon événement gratuitement"
                icon="arrow-forward"
                iconPosition="right"
                onPress={finishForOrganizer}
                variant="gold"
              />

              <Pressable
                accessibilityRole="button"
                onPress={finishForGuest}
                style={styles.guestAction}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={17}
                  color={theme.colors.champagneLight}
                />

                <Text style={styles.guestActionText}>
                  J’ai une invitation
                </Text>
              </Pressable>
            </View>
          ) : (
            <Button
              title="Découvrir la suite"
              icon="arrow-forward"
              iconPosition="right"
              onPress={goToNextSlide}
              variant="gold"
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function StoryPreview({
  icon,
  accent,
  label,
}) {
  return (
    <View style={styles.previewFrame}>
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.16)',
          'rgba(255,255,255,0.04)',
        ]}
        style={StyleSheet.absoluteFillObject}
      />

      <View
        style={[
          styles.previewOrb,
          styles.previewOrbOne,
          {
            backgroundColor: accent,
          },
        ]}
      />

      <View
        style={[
          styles.previewOrb,
          styles.previewOrbTwo,
          {
            backgroundColor: accent,
          },
        ]}
      />

      <View style={styles.previewIcon}>
        <Ionicons
          name={icon}
          size={31}
          color={theme.colors.primaryDark}
        />
      </View>

      <View style={styles.previewFooter}>
        <View style={styles.previewAvatars}>
          {[
            0,
            1,
            2,
          ].map((value) => (
            <View
              key={value}
              style={[
                styles.previewAvatar,
                {
                  marginLeft: value === 0 ? 0 : -9,
                  opacity: 1 - value * 0.16,
                },
              ]}
            >
              <Ionicons
                name="person"
                size={13}
                color={theme.colors.primaryDark}
              />
            </View>
          ))}
        </View>

        <Text style={styles.previewLabel}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  ambientOne: {
    position: 'absolute',
    top: -150,
    right: -80,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: 'rgba(217,184,120,0.14)',
  },

  ambientTwo: {
    position: 'absolute',
    bottom: 120,
    left: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(127,72,147,0.28)',
  },

  header: {
    minHeight: 54,
    paddingHorizontal: theme.layout.screenHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerSpacer: {
    width: 64,
  },

  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },

  skipText: {
    color: theme.colors.white60,
    fontFamily: theme.typography.families.bodyMedium,
    fontSize: 13,
  },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.layout.screenHorizontal + 4,
    paddingBottom: theme.spacing.xl,
  },

  previewFrame: {
    width: 208,
    height: 208,
    borderRadius: 58,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewOrb: {
    position: 'absolute',
    borderRadius: 999,
  },

  previewOrbOne: {
    width: 118,
    height: 118,
    top: -50,
    right: -26,
    opacity: 0.36,
  },

  previewOrbTwo: {
    width: 84,
    height: 84,
    bottom: 8,
    left: -28,
    opacity: 0.22,
  },

  previewIcon: {
    width: 76,
    height: 76,
    borderRadius: 27,
    backgroundColor: theme.colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.gold,
  },

  previewFooter: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  previewAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  previewAvatar: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: theme.colors.primaryDark,
    backgroundColor: theme.colors.champagneLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewLabel: {
    color: theme.colors.white,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 10,
  },

  eyebrow: {
    color: theme.colors.champagneLight,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  title: {
    color: theme.colors.white,
    fontFamily: theme.typography.families.displaySemiBold,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -0.8,
    textAlign: 'center',
    marginTop: 13,
  },

  body: {
    color: theme.colors.white70,
    fontFamily: theme.typography.families.body,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 314,
    textAlign: 'center',
    marginTop: 15,
  },

  footer: {
    paddingHorizontal: theme.layout.screenHorizontal,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 19,
  },

  progressDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  progressDotActive: {
    width: 28,
    backgroundColor: theme.colors.champagne,
  },

  finalActions: {
    gap: 13,
  },

  guestAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  guestActionText: {
    color: theme.colors.champagneLight,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 13,
  },
});
