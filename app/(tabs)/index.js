// app/(tabs)/index.js
// ------------------------------------------------------------
// EVERIA — Home / Memory Hub
// Refonte complète UI/UX.
//
// Direction : modern premium / editorial dashboard.
// La Home devient un point d'entrée personnel vers les événements,
// les souvenirs et les actions principales.
//
// Les requêtes Supabase, le store d'authentification et les routes
// existantes sont conservés. La refonte porte principalement sur
// la hiérarchie visuelle et la présentation des données.
// ------------------------------------------------------------

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import theme from '@/theme';
import ScreenContainer from '@/components/ui/ScreenContainer';
import EventCard from '@/components/event/EventCard';
import Avatar from '@/components/ui/Avatar';
import IconButton from '@/components/ui/IconButton';

import { useAuthStore } from '@/store/authStore';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';

import { supabase } from '@/lib/supabase';
import { avatarUrl } from '@/lib/storage';
import { formatEventDate } from '@/lib/format';

export default function Home() {
  const { user, profile } = useAuthStore();

  const {
    data: memberships,
    isLoading,
    refresh,
  } = useSupabaseQuery(
    async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('event_members')
        .select('*, events(*)')
        .eq('user_id', user.id)
        .in('status', ['joined', 'invited'])
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return (data || [])
        .map((membership) => membership.events)
        .filter(Boolean);
    },
    [user?.id]
  );

  const activeEvents = useMemo(
    () =>
      (memberships || []).filter((event) =>
        ['live', 'active'].includes(event.status)
      ),
    [memberships]
  );

  const upcomingEvents = useMemo(
    () =>
      (memberships || [])
        .filter(
          (event) =>
            !['live', 'active'].includes(event.status)
        )
        .sort((a, b) => {
          const aTime = a.start_at
            ? new Date(a.start_at).getTime()
            : Number.MAX_SAFE_INTEGER;

          const bTime = b.start_at
            ? new Date(b.start_at).getTime()
            : Number.MAX_SAFE_INTEGER;

          return aTime - bTime;
        }),
    [memberships]
  );

  const firstName = useMemo(() => {
    const displayName =
      profile?.display_name?.trim() || 'vous';

    return displayName.split(/\s+/)[0];
  }, [profile?.display_name]);

  const totalEvents = memberships?.length || 0;

  const nextEvent = upcomingEvents[0];

  const hasLiveEvent = activeEvents.length > 0;

  return (
    <ScreenContainer
      scroll
      refreshing={isLoading}
      onRefresh={refresh}
      edges={['top']}
      floatingTabBarSpace
      background={theme.screens.home}
      noPadding
      contentContainerStyle={styles.scrollContent}
    >
      {/* ================================================== */}
      {/* HEADER                                              */}
      {/* ================================================== */}

      <View style={styles.header}>
        <View style={styles.identityRow}>
          <View style={styles.avatarWrap}>
            <Avatar
              uri={avatarUrl(profile?.avatar_path)}
              name={profile?.display_name}
              size="md"
            />

            {hasLiveEvent && (
              <View style={styles.avatarLiveDot} />
            )}
          </View>

          <View style={styles.greetingBlock}>
            <Text style={styles.eyebrow}>
              VOTRE UNIVERS
            </Text>

            <Text style={styles.greeting}>
              Bonjour {firstName}
            </Text>
          </View>
        </View>

        <IconButton
          icon="notifications-outline"
          onPress={() =>
            router.push('/notifications')
          }
        />
      </View>

      {/* ================================================== */}
      {/* INTRO                                               */}
      {/* ================================================== */}

      <View style={styles.introBlock}>
        <Text style={styles.heroTitle}>
          Vos moments,
          {'\n'}
          au même endroit.
        </Text>

        <Text style={styles.heroSubtitle}>
          Retrouvez vos événements, capturez des souvenirs
          et partagez l’expérience avec ceux qui comptent.
        </Text>
      </View>

      {/* ================================================== */}
      {/* SEARCH                                              */}
      {/* ================================================== */}

      <Pressable
        onPress={() => router.push('/search')}
        style={({ pressed }) => [
          styles.searchCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.searchIcon}>
          <Ionicons
            name="search-outline"
            size={19}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.searchCopy}>
          <Text style={styles.searchLabel}>
            EXPLORER
          </Text>

          <Text style={styles.searchPlaceholder}>
            Rechercher un événement...
          </Text>
        </View>

        <View style={styles.searchArrow}>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={theme.colors.primary}
          />
        </View>
      </Pressable>

      {/* ================================================== */}
      {/* QUICK ACTIONS                                       */}
      {/* ================================================== */}

      <View style={styles.quickActions}>
        <QuickAction
          icon="scan-outline"
          label="Rejoindre"
          description="Code ou QR"
          onPress={() => router.push('/join')}
        />

        <QuickAction
          icon="add-outline"
          label="Créer"
          description="Un événement"
          onPress={() =>
            router.push('/create-event')
          }
          accent
        />
      </View>

      {/* ================================================== */}
      {/* MINI OVERVIEW                                       */}
      {/* ================================================== */}

      <View style={styles.overviewRow}>
        <OverviewItem
          icon="calendar-outline"
          value={totalEvents}
          label="événement(s)"
        />

        <View style={styles.overviewDivider} />

        <OverviewItem
          icon="flash-outline"
          value={activeEvents.length}
          label="en direct"
          accent
        />

        <View style={styles.overviewDivider} />

        <OverviewItem
          icon="time-outline"
          value={nextEvent ? '1' : '0'}
          label="à venir"
        />
      </View>

      {/* ================================================== */}
      {/* ACTIVE EVENT                                        */}
      {/* ================================================== */}

      <SectionHeading
        eyebrow="MAINTENANT"
        title="Vos événements actifs"
        actionLabel={
          activeEvents.length > 0
            ? 'Tout voir'
            : undefined
        }
        onAction={() =>
          router.push('/(tabs)/events')
        }
      />

      {isLoading && !activeEvents.length ? (
        <LoadingCard />
      ) : activeEvents.length ? (
        <View style={styles.activeSection}>
          {activeEvents.slice(0, 2).map((item) => (
            <View
              key={item.id}
              style={styles.activeEventCard}
            >
              <EventCard
                event={item}
                onPress={() =>
                  router.push(
                    `/event/${item.id}`
                  )
                }
              />

              <View style={styles.activeMetaBar}>
                <View style={styles.activeMetaLeft}>
                  <View style={styles.activePulse} />

                  <Text style={styles.activeMetaText}>
                    {item.status === 'live'
                      ? 'Événement en direct'
                      : 'Événement actif'}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    router.push(
                      `/event/${item.id}`
                    )
                  }
                  hitSlop={8}
                >
                  <Text style={styles.viewEventText}>
                    Ouvrir
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}

          {activeEvents.length > 2 && (
            <Pressable
              style={({ pressed }) => [
                styles.moreEventsButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                router.push('/(tabs)/events')
              }
            >
              <Text
                style={styles.moreEventsButtonText}
              >
                Voir {activeEvents.length - 2} autre(s)
              </Text>

              <Ionicons
                name="arrow-forward"
                size={15}
                color={theme.colors.primary}
              />
            </Pressable>
          )}
        </View>
      ) : (
        <EmptyActiveState
          onJoin={() => router.push('/join')}
          onCreate={() =>
            router.push('/create-event')
          }
        />
      )}

      {/* ================================================== */}
      {/* UPCOMING EVENTS                                     */}
      {/* ================================================== */}

      <SectionHeading
        eyebrow="PROCHAINS"
        title="À venir"
        actionLabel={
          upcomingEvents.length > 0
            ? 'Voir tout'
            : undefined
        }
        onAction={() =>
          router.push('/(tabs)/events')
        }
        style={styles.upcomingHeading}
      />

      {upcomingEvents.length ? (
        <View style={styles.timeline}>
          {upcomingEvents
            .slice(0, 4)
            .map((item, index) => (
              <TimelineEvent
                key={item.id}
                event={item}
                last={
                  index ===
                  Math.min(
                    upcomingEvents.length,
                    4
                  ) - 1
                }
                onPress={() =>
                  router.push(
                    `/event/${item.id}`
                  )
                }
              />
            ))}
        </View>
      ) : (
        <EmptyUpcomingState
          onCreate={() =>
            router.push('/create-event')
          }
        />
      )}

      {/* ================================================== */}
      {/* FOOTER                                              */}
      {/* ================================================== */}

      <View style={styles.footerMessage}>
        <View style={styles.footerLine} />

        <Ionicons
          name="sparkles-outline"
          size={16}
          color={theme.colors.champagneDark}
        />

        <Text style={styles.footerTitle}>
          Chaque événement devient une mémoire.
        </Text>

        <Text style={styles.footerSubtitle}>
          One Event. Many Perspectives. One Everia.
        </Text>
      </View>
    </ScreenContainer>
  );
}

/* ============================================================ */
/* QUICK ACTION                                                 */
/* ============================================================ */

function QuickAction({
  icon,
  label,
  description,
  onPress,
  accent = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        accent && styles.quickActionAccent,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.quickActionIcon,
          accent && styles.quickActionIconAccent,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            accent
              ? theme.colors.primaryDeep
              : theme.colors.primary
          }
        />
      </View>

      <View style={styles.quickActionCopy}>
        <Text
          style={[
            styles.quickActionLabel,
            accent &&
              styles.quickActionLabelAccent,
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.quickActionDescription,
            accent &&
              styles.quickActionDescriptionAccent,
          ]}
        >
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={
          accent
            ? theme.colors.primaryDeep
            : theme.colors.textMuted
        }
      />
    </Pressable>
  );
}

/* ============================================================ */
/* OVERVIEW ITEM                                                 */
/* ============================================================ */

function OverviewItem({
  icon,
  value,
  label,
  accent = false,
}) {
  return (
    <View style={styles.overviewItem}>
      <Ionicons
        name={icon}
        size={16}
        color={
          accent
            ? theme.colors.champagneDark
            : theme.colors.primary
        }
      />

      <Text style={styles.overviewValue}>
        {value}
      </Text>

      <Text style={styles.overviewLabel}>
        {label}
      </Text>
    </View>
  );
}

/* ============================================================ */
/* SECTION HEADING                                               */
/* ============================================================ */

function SectionHeading({
  eyebrow,
  title,
  actionLabel,
  onAction,
  style,
}) {
  return (
    <View style={[styles.sectionHeading, style]}>
      <View style={styles.sectionHeadingCopy}>
        <Text style={styles.sectionEyebrow}>
          {eyebrow}
        </Text>

        <Text style={styles.sectionTitle}>
          {title}
        </Text>
      </View>

      {!!actionLabel && (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) =>
            pressed && styles.pressed
          }
        >
          <View style={styles.sectionAction}>
            <Text style={styles.sectionActionText}>
              {actionLabel}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={13}
              color={theme.colors.primary}
            />
          </View>
        </Pressable>
      )}
    </View>
  );
}

/* ============================================================ */
/* TIMELINE EVENT                                                 */
/* ============================================================ */

function TimelineEvent({
  event,
  last,
  onPress,
}) {
  const date = event.start_at
    ? new Date(event.start_at)
    : null;

  const dayNumber = date
    ? new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
      }).format(date)
    : '--';

  const month = date
    ? new Intl.DateTimeFormat('fr-FR', {
        month: 'short',
      })
        .format(date)
        .replace('.', '')
        .toUpperCase()
    : '—';

  const typeSpec = theme.helpers.getEventType(
    event.category
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.timelineRow,
        pressed && styles.timelinePressed,
      ]}
    >
      <View style={styles.timelineRail}>
        <View
          style={[
            styles.timelineDot,
            event.status === 'live' &&
              styles.timelineDotLive,
          ]}
        />

        {!last && (
          <View style={styles.timelineLine} />
        )}
      </View>

      <View style={styles.timelineDate}>
        <Text style={styles.timelineDay}>
          {dayNumber}
        </Text>

        <Text style={styles.timelineMonth}>
          {month}
        </Text>
      </View>

      <View style={styles.timelineCard}>
        <View style={styles.timelineTopRow}>
          <View style={styles.timelineTypeRow}>
            <Ionicons
              name={typeSpec.icon}
              size={11}
              color={
                theme.colors.champagneDark
              }
            />

            <Text style={styles.timelineType}>
              {typeSpec.label}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={15}
            color={theme.colors.textMuted}
          />
        </View>

        <Text
          style={styles.timelineTitle}
          numberOfLines={1}
        >
          {event.name}
        </Text>

        <Text
          style={styles.timelineMeta}
          numberOfLines={1}
        >
          {formatEventDate(event.start_at)}
          {event.venue_name
            ? `  ·  ${event.venue_name}`
            : ''}
        </Text>
      </View>
    </Pressable>
  );
}

/* ============================================================ */
/* EMPTY / LOADING STATES                                        */
/* ============================================================ */

function LoadingCard() {
  return (
    <View style={styles.loadingCard}>
      <ActivityIndicator
        size="small"
        color={theme.colors.primary}
      />

      <Text style={styles.loadingText}>
        Chargement de vos événements...
      </Text>
    </View>
  );
}

function EmptyActiveState({
  onJoin,
  onCreate,
}) {
  return (
    <View style={styles.emptyActiveCard}>
      <LinearGradient
        colors={theme.gradients.ivory}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.emptyActiveIcon}>
        <Ionicons
          name="images-outline"
          size={23}
          color={theme.colors.primary}
        />
      </View>

      <Text style={styles.emptyActiveTitle}>
        Aucun événement en direct
      </Text>

      <Text style={styles.emptyActiveText}>
        Rejoignez un événement ou créez le vôtre pour
        commencer à construire de nouveaux souvenirs.
      </Text>

      <View style={styles.emptyActiveActions}>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onJoin}
        >
          <Ionicons
            name="scan-outline"
            size={16}
            color={theme.colors.primary}
          />

          <Text style={styles.secondaryButtonText}>
            Rejoindre
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onCreate}
        >
          <Ionicons
            name="add"
            size={17}
            color={theme.colors.white}
          />

          <Text style={styles.primaryButtonText}>
            Créer
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function EmptyUpcomingState({
  onCreate,
}) {
  return (
    <View style={styles.emptyUpcomingCard}>
      <View style={styles.emptyUpcomingIcon}>
        <Ionicons
          name="calendar-outline"
          size={22}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.emptyUpcomingCopy}>
        <Text style={styles.emptyUpcomingTitle}>
          Votre agenda est libre.
        </Text>

        <Text style={styles.emptyUpcomingText}>
          Créez un événement pour avoir votre
          prochain souvenir en vue.
        </Text>
      </View>

      <Pressable
        onPress={onCreate}
        hitSlop={8}
      >
        <Ionicons
          name="arrow-forward-circle"
          size={27}
          color={theme.colors.primary}
        />
      </Pressable>
    </View>
  );
}

/* ============================================================ */
/* STYLES                                                        */
/* ============================================================ */

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 5,
    paddingBottom: 30,
  },

  /* ---------------------------------------------------------- */
  /* HEADER                                                       */
  /* ---------------------------------------------------------- */

  header: {
    minHeight: 58,
    paddingTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarWrap: {
    position: 'relative',
  },

  avatarLiveDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: theme.colors.eventLive,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },

  greetingBlock: {
    marginLeft: 10,
  },

  eyebrow: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 8,
    letterSpacing: 1.25,
    color: theme.colors.champagneDark,
  },

  greeting: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 18,
    lineHeight: 23,
    color: theme.colors.textPrimary,
  },

  /* ---------------------------------------------------------- */
  /* INTRO                                                        */
  /* ---------------------------------------------------------- */

  introBlock: {
    marginTop: 25,
    maxWidth: 355,
  },

  heroTitle: {
    fontFamily:
      theme.typography.families.displayBold,
    fontSize: 31,
    lineHeight: 34,
    letterSpacing: -0.55,
    color: theme.colors.textPrimary,
  },

  heroSubtitle: {
    marginTop: 9,
    fontFamily:
      theme.typography.families.body,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
    maxWidth: 350,
  },

  /* ---------------------------------------------------------- */
  /* SEARCH                                                       */
  /* ---------------------------------------------------------- */

  searchCard: {
    marginTop: 18,
    minHeight: 62,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#EAE4DD',
    ...theme.shadows.sm,
  },

  searchIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  searchCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  searchLabel: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 7.5,
    letterSpacing: 1.1,
    color: theme.colors.champagneDark,
  },

  searchPlaceholder: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 12,
    color: theme.colors.textPrimary,
  },

  searchArrow: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSoft,
  },

  /* ---------------------------------------------------------- */
  /* QUICK ACTIONS                                                */
  /* ---------------------------------------------------------- */

  quickActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 10,
  },

  quickAction: {
    flex: 1,
    minHeight: 74,
    padding: 11,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#EBE5DD',
  },

  quickActionAccent: {
    backgroundColor: theme.colors.champagne,
    borderColor: '#D7B878',
  },

  quickActionIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  quickActionIconAccent: {
    backgroundColor: theme.colors.champagneLight,
  },

  quickActionCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    marginRight: 4,
  },

  quickActionLabel: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 11.5,
    color: theme.colors.textPrimary,
  },

  quickActionLabelAccent: {
    color: theme.colors.primaryDeep,
  },

  quickActionDescription: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8.8,
    color: theme.colors.textMuted,
  },

  quickActionDescriptionAccent: {
    color: 'rgba(38,17,41,0.62)',
  },

  /* ---------------------------------------------------------- */
  /* OVERVIEW                                                     */
  /* ---------------------------------------------------------- */

  overviewRow: {
    minHeight: 64,
    marginTop: 17,
    paddingHorizontal: 8,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: '#ECE4DB',
  },

  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },

  overviewValue: {
    marginTop: 3,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 16,
    lineHeight: 19,
    color: theme.colors.textPrimary,
  },

  overviewLabel: {
    marginTop: 1,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8.5,
    color: theme.colors.textMuted,
  },

  overviewDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },

  /* ---------------------------------------------------------- */
  /* SECTIONS                                                     */
  /* ---------------------------------------------------------- */

  sectionHeading: {
    marginTop: 28,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  sectionHeadingCopy: {
    flex: 1,
    paddingRight: 10,
  },

  sectionEyebrow: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 8,
    letterSpacing: 1.2,
    color: theme.colors.champagneDark,
  },

  sectionTitle: {
    marginTop: 3,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 20,
    lineHeight: 25,
    color: theme.colors.textPrimary,
  },

  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
  },

  sectionActionText: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 10,
    color: theme.colors.primary,
  },

  upcomingHeading: {
    marginTop: 31,
  },

  /* ---------------------------------------------------------- */
  /* ACTIVE EVENTS                                                */
  /* ---------------------------------------------------------- */

  activeSection: {
    gap: 10,
  },

  activeEventCard: {
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#EAE4DD',
    ...theme.shadows.sm,
  },

  activeMetaBar: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  activeMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  activePulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.eventLive,
    marginRight: 6,
  },

  activeMetaText: {
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 9.5,
    color: theme.colors.textSecondary,
  },

  viewEventText: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 9.5,
    color: theme.colors.primary,
  },

  moreEventsButton: {
    minHeight: 43,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  moreEventsButtonText: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 10,
    color: theme.colors.primary,
  },

  loadingCard: {
    minHeight: 130,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 9,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  /* ---------------------------------------------------------- */
  /* EMPTY ACTIVE                                                 */
  /* ---------------------------------------------------------- */

  emptyActiveCard: {
    minHeight: 230,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E9E2D8',
  },

  emptyActiveIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    marginBottom: 10,
  },

  emptyActiveTitle: {
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },

  emptyActiveText: {
    marginTop: 6,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },

  emptyActiveActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 15,
  },

  secondaryButton: {
    minHeight: 39,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  secondaryButtonText: {
    marginLeft: 5,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 10,
    color: theme.colors.primary,
  },

  primaryButton: {
    minHeight: 39,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  primaryButtonText: {
    marginLeft: 4,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 10,
    color: theme.colors.white,
  },

  /* ---------------------------------------------------------- */
  /* TIMELINE                                                     */
  /* ---------------------------------------------------------- */

  timeline: {
    paddingBottom: 2,
  },

  timelineRow: {
    minHeight: 94,
    flexDirection: 'row',
  },

  timelineRail: {
    width: 20,
    alignItems: 'center',
    position: 'relative',
  },

  timelineDot: {
    marginTop: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: theme.colors.champagne,
    borderWidth: 2,
    borderColor: theme.colors.background,
    zIndex: 2,
  },

  timelineDotLive: {
    backgroundColor: theme.colors.eventLive,
  },

  timelineLine: {
    position: 'absolute',
    top: 18,
    bottom: 0,
    width: 1,
    backgroundColor: theme.colors.border,
  },

  timelineDate: {
    width: 42,
    alignItems: 'center',
    paddingTop: 4,
  },

  timelineDay: {
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 19,
    lineHeight: 22,
    color: theme.colors.textPrimary,
  },

  timelineMonth: {
    marginTop: 1,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 7.5,
    letterSpacing: 0.8,
    color: theme.colors.champagneDark,
  },

  timelineCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 79,
    marginLeft: 8,
    marginBottom: 9,
    padding: 12,
    borderRadius: 18,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#EAE4DD',
  },

  timelineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timelineTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  timelineType: {
    marginLeft: 4,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 7.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.champagneDark,
  },

  timelineTitle: {
    marginTop: 5,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 14,
    lineHeight: 18,
    color: theme.colors.textPrimary,
  },

  timelineMeta: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    color: theme.colors.textMuted,
  },

  timelinePressed: {
    opacity: 0.82,
  },

  /* ---------------------------------------------------------- */
  /* EMPTY UPCOMING                                               */
  /* ---------------------------------------------------------- */

  emptyUpcomingCard: {
    minHeight: 92,
    padding: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  emptyUpcomingIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  emptyUpcomingCopy: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 8,
  },

  emptyUpcomingTitle: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 12,
    color: theme.colors.textPrimary,
  },

  emptyUpcomingText: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    color: theme.colors.textMuted,
  },

  /* ---------------------------------------------------------- */
  /* FOOTER                                                       */
  /* ---------------------------------------------------------- */

  footerMessage: {
    marginTop: 32,
    paddingTop: 4,
    alignItems: 'center',
  },

  footerLine: {
    width: 34,
    height: 2,
    borderRadius: 2,
    backgroundColor: theme.colors.champagne,
    marginBottom: 10,
  },

  footerTitle: {
    marginTop: 5,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  footerSubtitle: {
    marginTop: 4,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },

  /* ---------------------------------------------------------- */
  /* INTERACTIONS                                                  */
  /* ---------------------------------------------------------- */

  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.985 }],
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
});
