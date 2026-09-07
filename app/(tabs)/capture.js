// app/(tabs)/capture.js
// ------------------------------------------------------------
// Point d'entrée de l'onglet Capture.
//
// La capture étant toujours liée à un événement, cet écran :
// 1. détecte les événements actifs auxquels l'utilisateur participe ;
// 2. redirige automatiquement s'il n'y en a qu'un seul ;
// 3. propose une sélection premium lorsqu'il y en a plusieurs ;
// 4. affiche une expérience Empty State éditoriale lorsqu'il n'y en a aucun.
//
// La vraie caméra reste dans app/event/[id]/capture.js.
// ------------------------------------------------------------

import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';

import ScreenContainer from '@/components/ui/ScreenContainer';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import EventStatusBadge from '@/components/event/EventStatusBadge';
import { useAuthStore } from '@/store/authStore';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { mediaThumbnail } from '@/lib/storage';
import { formatEventDate } from '@/lib/format';
import theme from '@/theme';

export default function CaptureEntry() {
  const { user } = useAuthStore();

  const {
    data: liveEvents,
    isLoading,
    refresh,
  } = useSupabaseQuery(
    async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('event_members')
        .select('events(*)')
        .eq('user_id', user.id)
        .in('status', ['joined'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || [])
        .map((membership) => membership.events)
        .filter(
          (event) =>
            event &&
            ['live', 'active'].includes(event.status)
        );
    },
    [user?.id]
  );

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (liveEvents && liveEvents.length === 1) {
      router.replace(
        `/event/${liveEvents[0].id}/capture`
      );
    }
  }, [liveEvents]);

  if (isLoading) {
    return (
      <ScreenContainer
        background="gradient-dark"
        edges={['top']}
      >
        <LoadingOverlay
          dark
          fullscreen
          label="Recherche d'un événement en direct..."
        />
      </ScreenContainer>
    );
  }

  if (!liveEvents || liveEvents.length === 0) {
    return <NoLiveEventState />;
  }

  if (liveEvents.length === 1) {
    return (
      <ScreenContainer
        background="gradient-dark"
        edges={['top']}
      >
        <View style={styles.redirectFallback}>
          <View style={styles.redirectIcon}>
            <Ionicons
              name="camera-outline"
              size={24}
              color={theme.colors.champagneLight}
            />
          </View>

          <Text style={styles.redirectTitle}>
            Ouverture de la caméra
          </Text>

          <Text style={styles.redirectText}>
            Préparation de votre espace de capture…
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      noPadding
      background="gradient-dark"
      edges={['top']}
      scroll
      contentContainerStyle={styles.screenContent}
    >
      <StatusBar style="light" />

      <CaptureHero count={liveEvents.length} />

      <View style={styles.contentBody}>
        <View style={styles.introRow}>
          <View style={styles.introCopy}>
            <Text style={styles.eyebrow}>
              CAPTURE
            </Text>

            <Text style={styles.title}>
              Choisissez votre moment.
            </Text>

            <Text style={styles.subtitle}>
              Sélectionnez l'événement dans lequel vous souhaitez
              partager votre prochain souvenir.
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countValue}>
              {liveEvents.length}
            </Text>

            <Text style={styles.countLabel}>
              en direct
            </Text>
          </View>
        </View>

        <View style={styles.captureTip}>
          <View style={styles.tipIcon}>
            <Ionicons
              name="sparkles-outline"
              size={17}
              color={theme.colors.champagneDark}
            />
          </View>

          <View style={styles.tipCopy}>
            <Text style={styles.tipTitle}>
              Capturez l'instant, pas la perfection.
            </Text>

            <Text style={styles.tipText}>
              Une photo suffit pour faire partie du souvenir collectif.
            </Text>
          </View>
        </View>

        <View style={styles.eventsHeader}>
          <Text style={styles.eventsEyebrow}>
            ÉVÉNEMENTS ACTIFS
          </Text>

          <View style={styles.eventsHeaderLine} />
        </View>

        <View style={styles.eventsList}>
          {liveEvents.map((event, index) => (
            <CaptureEventCard
              key={event.id}
              event={event}
              featured={index === 0}
              onPress={() =>
                router.push(
                  `/event/${event.id}/capture`
                )
              }
            />
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

function CaptureHero({ count }) {
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={theme.gradients.darkLuxury}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.heroOrbLarge} />
      <View style={styles.heroOrbSmall} />

      <View style={styles.heroTopRow}>
        <View>
          <Text style={styles.heroEyebrow}>
            EVERIA
          </Text>

          <Text style={styles.heroTitle}>
            Capturez le moment.
          </Text>
        </View>

        <View style={styles.heroCameraBadge}>
          <Ionicons
            name="camera"
            size={19}
            color={theme.colors.champagneLight}
          />
        </View>
      </View>

      <View style={styles.heroVisual}>
        <View style={styles.heroFrameOuter}>
          <View style={styles.heroFrameInner}>
            <Ionicons
              name="aperture-outline"
              size={42}
              color={theme.colors.champagneLight}
            />
          </View>
        </View>

        <View style={styles.heroVisualLabel}>
          <View style={styles.heroPulse} />

          <Text style={styles.heroVisualText}>
            {count === 1
              ? 'UN MOMENT À CAPTURER'
              : `${count} MOMENTS DISPONIBLES`}
          </Text>
        </View>
      </View>

      <View style={styles.heroBottomRow}>
        <View style={styles.heroStatementWrap}>
          <Text style={styles.heroStatement}>
            Vos yeux voient un instant.
            {'\n'}
            Everia en fait un souvenir.
          </Text>
        </View>

        <View style={styles.heroLivePill}>
          <View style={styles.heroLiveDot} />

          <Text style={styles.heroLiveText}>
            LIVE
          </Text>
        </View>
      </View>
    </View>
  );
}

function CaptureEventCard({
  event,
  featured,
  onPress,
}) {
  const cover = event.cover_path
    ? mediaThumbnail({
        display_path: event.cover_path,
      })
    : null;

  const typeSpec = theme.helpers.getEventType(
    event.category
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Capturer dans l'événement ${event.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.eventCard,
        featured && styles.eventCardFeatured,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.eventImageWrap}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={styles.eventImage}
            contentFit="cover"
            transition={180}
          />
        ) : (
          <LinearGradient
            colors={theme.gradients.luxury}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        <LinearGradient
          colors={[
            'rgba(22,10,24,0.02)',
            'rgba(22,10,24,0.62)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.eventImageTop}>
          <EventStatusBadge
            status={event.status}
            size="sm"
          />
        </View>

        <View style={styles.eventImageBottom}>
          <View style={styles.eventIconCircle}>
            <Ionicons
              name={typeSpec.icon}
              size={13}
              color={theme.colors.champagneLight}
            />
          </View>

          <View style={styles.captureNowPill}>
            <Ionicons
              name="camera-outline"
              size={11}
              color={theme.colors.primaryDark}
            />

            <Text style={styles.captureNowText}>
              CAPTURER
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.eventBody}>
        <View style={styles.eventTypeRow}>
          <Text style={styles.eventType}>
            {typeSpec.label}
          </Text>

          {featured && (
            <View style={styles.recommendedBadge}>
              <Ionicons
                name="sparkles"
                size={9}
                color={theme.colors.champagneDark}
              />

              <Text style={styles.recommendedText}>
                À LA UNE
              </Text>
            </View>
          )}
        </View>

        <Text
          style={styles.eventTitle}
          numberOfLines={2}
        >
          {event.name}
        </Text>

        <View style={styles.eventMetaRow}>
          <Ionicons
            name="calendar-outline"
            size={13}
            color={theme.colors.textMuted}
          />

          <Text
            style={styles.eventMeta}
            numberOfLines={1}
          >
            {formatEventDate(event.start_at)}
          </Text>
        </View>

        {!!event.venue_name && (
          <View style={styles.eventMetaRow}>
            <Ionicons
              name="location-outline"
              size={13}
              color={theme.colors.textMuted}
            />

            <Text
              style={styles.eventMeta}
              numberOfLines={1}
            >
              {event.venue_name}
            </Text>
          </View>
        )}

        <View style={styles.eventFooter}>
          <View style={styles.eventActionCopy}>
            <Text style={styles.eventActionEyebrow}>
              VOTRE POINT DE VUE
            </Text>

            <Text style={styles.eventActionText}>
              Ouvrir la caméra
            </Text>
          </View>

          <View style={styles.eventArrow}>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={theme.colors.white}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function NoLiveEventState() {
  return (
    <ScreenContainer
      noPadding
      background="gradient-dark"
      edges={['top']}
      scroll
      contentContainerStyle={styles.emptyScreen}
    >
      <StatusBar style="light" />

      <LinearGradient
        colors={theme.gradients.darkLuxury}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyHero}
      >
        <View style={styles.emptyOrbTop} />

        <View style={styles.emptyTopRow}>
          <View>
            <Text style={styles.emptyEyebrow}>
              EVERIA
            </Text>

            <Text style={styles.emptyTitle}>
              Votre caméra attend
            </Text>
          </View>

          <View style={styles.emptyHeroIcon}>
            <Ionicons
              name="camera-outline"
              size={20}
              color={theme.colors.champagneLight}
            />
          </View>
        </View>

        <View style={styles.emptyVisual}>
          <View style={styles.emptyVisualRingLarge}>
            <View style={styles.emptyVisualRingSmall}>
              <Ionicons
                name="camera-outline"
                size={43}
                color={theme.colors.champagneLight}
              />
            </View>
          </View>
        </View>

        <Text style={styles.emptyHeroStatement}>
          Chaque grand souvenir commence par
          un simple geste.
        </Text>
      </LinearGradient>

      <View style={styles.emptyBody}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyCardIcon}>
            <Ionicons
              name="videocam-outline"
              size={21}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.emptyCardCopy}>
            <Text style={styles.emptyCardTitle}>
              Aucun événement en direct
            </Text>

            <Text style={styles.emptyCardText}>
              Rejoignez un événement actif pour pouvoir
              photographier et filmer les moments qui comptent.
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Rejoindre un événement"
          onPress={() => router.push('/join')}
          style={({ pressed }) => [
            styles.joinButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.joinButtonIcon}>
            <Ionicons
              name="enter-outline"
              size={18}
              color={theme.colors.primaryDark}
            />
          </View>

          <Text style={styles.joinButtonText}>
            Rejoindre un événement
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color={theme.colors.primaryDark}
          />
        </Pressable>

        <View style={styles.emptySecondaryCard}>
          <View style={styles.secondaryStep}>
            <Text style={styles.secondaryStepNumber}>
              01
            </Text>

            <Text style={styles.secondaryStepText}>
              Entrez le code de l'événement
            </Text>
          </View>

          <View style={styles.secondaryDivider} />

          <View style={styles.secondaryStep}>
            <Text style={styles.secondaryStepNumber}>
              02
            </Text>

            <Text style={styles.secondaryStepText}>
              Ouvrez l'espace de capture
            </Text>
          </View>

          <View style={styles.secondaryDivider} />

          <View style={styles.secondaryStep}>
            <Text style={styles.secondaryStepNumber}>
              03
            </Text>

            <Text style={styles.secondaryStepText}>
              Partagez votre perspective
            </Text>
          </View>
        </View>

        <Text style={styles.emptyFooter}>
          One Event. Many Perspectives. One Everia.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 110,
  },

  hero: {
    minHeight: 380,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.layout.screenHorizontal,
    paddingBottom: theme.spacing.xxl,
    overflow: 'hidden',
    position: 'relative',
  },

  heroOrbLarge: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -170,
    right: -75,
    backgroundColor: 'rgba(217,184,120,0.10)',
  },

  heroOrbSmall: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    bottom: -150,
    left: -105,
    backgroundColor: 'rgba(147,101,150,0.15)',
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  heroEyebrow: {
    color: theme.colors.champagne,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing:
      theme.typography.letterSpacing.luxury,
  },

  heroTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 30,
    lineHeight: 37,
    marginTop: 3,
    maxWidth: 270,
  },

  heroCameraBadge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.12)',
  },

  heroVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  heroFrameOuter: {
    width: 152,
    height: 152,
    borderRadius: 48,
    borderWidth: 1,
    borderColor:
      'rgba(217,184,120,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },

  heroFrameInner: {
    width: 108,
    height: 108,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.12)',
    transform: [{ rotate: '-45deg' }],
  },

  heroVisualLabel: {
    marginTop: -5,
    minHeight: 28,
    paddingHorizontal: 11,
    borderRadius: theme.radius.pill,
    backgroundColor:
      'rgba(22,10,24,0.64)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.eventLive,
    marginRight: 6,
  },

  heroVisualText: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 7,
    letterSpacing: 0.9,
  },

  heroBottomRow: {
    marginTop: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  heroStatementWrap: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },

  heroStatement: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displayMedium,
    fontSize: 17,
    lineHeight: 24,
  },

  heroLivePill: {
    minHeight: 32,
    paddingHorizontal: 9,
    borderRadius: theme.radius.pill,
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.eventLive,
    marginRight: 5,
  },

  heroLiveText: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 7.5,
    letterSpacing: 0.8,
  },

  contentBody: {
    paddingTop: theme.spacing.xxxl,
  },

  introRow: {
    paddingHorizontal:
      theme.layout.screenHorizontal,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  introCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },

  eyebrow: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing:
      theme.typography.letterSpacing.uppercase,
  },

  title: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 23,
    lineHeight: 29,
    marginTop: 2,
  },

  subtitle: {
    color: theme.colors.white,
    opacity: 0.62,
    fontFamily: theme.typography.families.body,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 4,
    maxWidth: 325,
  },

  countBadge: {
    minWidth: 58,
    minHeight: 58,
    paddingHorizontal: 7,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
  },

  countValue: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 18,
    lineHeight: 22,
  },

  countLabel: {
    color: theme.colors.white,
    opacity: 0.56,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 7.5,
    lineHeight: 11,
    marginTop: 1,
  },

  captureTip: {
    marginTop: theme.spacing.xl,
    marginHorizontal:
      theme.layout.screenHorizontal,
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.09)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      theme.colors.champagnePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  tipCopy: {
    flex: 1,
  },

  tipTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11.5,
    lineHeight: 16,
  },

  tipText: {
    color: theme.colors.white,
    opacity: 0.52,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 2,
  },

  eventsHeader: {
    paddingHorizontal:
      theme.layout.screenHorizontal,
    marginTop: theme.spacing.xxxl,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  eventsEyebrow: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8.5,
    lineHeight: 12,
    letterSpacing: 1,
  },

  eventsHeaderLine: {
    flex: 1,
    height: 1,
    marginLeft: 10,
    backgroundColor:
      'rgba(255,255,255,0.08)',
  },

  eventsList: {
    paddingBottom: theme.spacing.xl,
  },

  eventCard: {
    marginHorizontal:
      theme.layout.screenHorizontal,
    marginBottom: theme.spacing.lg,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      theme.colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
    ...theme.shadows.md,
  },

  eventCardFeatured: {
    borderColor:
      'rgba(217,184,120,0.28)',
  },

  eventImageWrap: {
    height: 162,
    backgroundColor:
      theme.colors.primaryDark,
    position: 'relative',
    overflow: 'hidden',
  },

  eventImage: {
    width: '100%',
    height: '100%',
  },

  eventImageTop: {
    position: 'absolute',
    top: 10,
    left: 10,
  },

  eventImageBottom: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eventIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(22,10,24,0.58)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
  },

  captureNowPill: {
    minHeight: 31,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    backgroundColor:
      theme.colors.champagne,
    flexDirection: 'row',
    alignItems: 'center',
  },

  captureNowText: {
    color: theme.colors.primaryDark,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 7.5,
    letterSpacing: 0.8,
    marginLeft: 4,
  },

  eventBody: {
    padding: theme.spacing.md,
  },

  eventTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eventType: {
    color: theme.colors.textGold,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8.5,
    lineHeight: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  recommendedBadge: {
    minHeight: 22,
    paddingHorizontal: 7,
    borderRadius: theme.radius.pill,
    backgroundColor:
      theme.colors.champagnePale,
    flexDirection: 'row',
    alignItems: 'center',
  },

  recommendedText: {
    color: theme.colors.champagneDark,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 6.5,
    letterSpacing: 0.55,
    marginLeft: 3,
  },

  eventTitle: {
    color: theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 20,
    lineHeight: 25,
    marginTop: 4,
  },

  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  eventMeta: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
    lineHeight: 14,
    marginLeft: 5,
  },

  eventFooter: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor:
      theme.colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eventActionCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },

  eventActionEyebrow: {
    color: theme.colors.textGold,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.8,
  },

  eventActionText: {
    color: theme.colors.textSecondary,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 1,
  },

  eventArrow: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.primary,
  },

  emptyScreen: {
    paddingBottom: 80,
    backgroundColor:
      theme.colors.darkBackground,
  },

  emptyHero: {
    minHeight: 455,
    paddingTop: theme.spacing.xl,
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingBottom: theme.spacing.xxxl,
    overflow: 'hidden',
    position: 'relative',
  },

  emptyOrbTop: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    top: -165,
    right: -75,
    backgroundColor:
      'rgba(217,184,120,0.10)',
  },

  emptyTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  emptyEyebrow: {
    color: theme.colors.champagne,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing:
      theme.typography.letterSpacing.luxury,
  },

  emptyTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 29,
    lineHeight: 36,
    marginTop: 3,
    maxWidth: 280,
  },

  emptyHeroIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },

  emptyVisualRingLarge: {
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(217,184,120,0.22)',
    backgroundColor:
      'rgba(255,255,255,0.025)',
  },

  emptyVisualRingSmall: {
    width: 124,
    height: 124,
    borderRadius: 62,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
  },

  emptyHeroStatement: {
    color: theme.colors.white,
    opacity: 0.86,
    fontFamily:
      theme.typography.families.displayMedium,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 27,
    marginTop: 36,
    maxWidth: 315,
    alignSelf: 'center',
  },

  emptyBody: {
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingTop: theme.spacing.xl,
  },

  emptyCard: {
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.09)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  emptyCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor:
      theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  emptyCardCopy: {
    flex: 1,
  },

  emptyCardTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
  },

  emptyCardText: {
    color: theme.colors.white,
    opacity: 0.58,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  joinButton: {
    minHeight: 58,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      theme.colors.champagne,
    flexDirection: 'row',
    alignItems: 'center',
  },

  joinButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.35)',
    marginRight: theme.spacing.sm,
  },

  joinButtonText: {
    flex: 1,
    color: theme.colors.primaryDark,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 12,
  },

  emptySecondaryCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  secondaryStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  secondaryStepNumber: {
    width: 33,
    color: theme.colors.champagne,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 9,
  },

  secondaryStepText: {
    flex: 1,
    color: theme.colors.white,
    opacity: 0.68,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    lineHeight: 15,
  },

  secondaryDivider: {
    height: 1,
    marginVertical: 11,
    marginLeft: 33,
    backgroundColor:
      'rgba(255,255,255,0.07)',
  },

  emptyFooter: {
    color: theme.colors.white,
    opacity: 0.32,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },

  redirectFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    backgroundColor:
      theme.colors.darkBackground,
  },

  redirectIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor:
      'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  redirectTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 20,
    lineHeight: 26,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },

  redirectText: {
    color: theme.colors.white,
    opacity: 0.55,
    fontFamily:
      theme.typography.families.body,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
