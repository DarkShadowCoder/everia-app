// app/event/[id]/index.js
// ------------------------------------------------------------
// EVERIA — Event Experience
// Refonte complète UI/UX.
//
// Direction artistique :
// - Premium editorial / modern SaaS
// - Hero immersif
// - Event identity card
// - CTA principal centré sur la capture
// - Stats compactes
// - Navigation modulaire
// - Moments mis en avant
// - Galerie éditorialisée
//
// IMPORTANT :
// Les flux métier, les requêtes Supabase et les routes existantes
// sont conservés. Cette version refond principalement la couche
// présentation et l'organisation des contenus.
// ------------------------------------------------------------

import React, { useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import theme from '@/theme';
import { EVENT_TAB_ICONS } from '@/constants/icons';
import EventStatusBadge from '@/components/event/EventStatusBadge';
import MomentCard from '@/components/event/MomentCard';
import EmptyState from '@/components/ui/EmptyState';

import {
  selectIsOrganizer,
  useEventStore,
} from '@/store/eventStore';

import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import {
  mediaThumbnail,
  publicMediaUrl,
} from '@/lib/storage';
import { formatEventDate } from '@/lib/format';

const MODULES = [
  {
    key: 'gallery',
    label: 'Galerie',
    description: 'Tous les souvenirs',
    icon: EVENT_TAB_ICONS.gallery,
    route: 'gallery',
    featured: true,
  },
  {
    key: 'moments',
    label: 'Moments',
    description: 'Les temps forts',
    icon: EVENT_TAB_ICONS.moments,
    route: 'moments',
  },
  {
    key: 'live',
    label: 'En direct',
    description: 'Voir le live wall',
    icon: EVENT_TAB_ICONS.live,
    route: 'live',
  },
  {
    key: 'challenges',
    label: 'Défis',
    description: 'Participer',
    icon: EVENT_TAB_ICONS.challenges,
    route: 'challenges',
  },
  {
    key: 'guestbook',
    label: "Livre d'or",
    description: 'Laisser un message',
    icon: EVENT_TAB_ICONS.guestbook,
    route: 'guestbook',
  },
  {
    key: 'people',
    label: 'People',
    description: 'Les participants',
    icon: EVENT_TAB_ICONS.people,
    route: 'people',
  },
  {
    key: 'experience',
    label: 'Mon expérience',
    description: 'Vos souvenirs',
    icon: EVENT_TAB_ICONS.experience,
    route: 'my-experience',
  },
];

export default function EventHome() {
  const { id } = useLocalSearchParams();

  const event = useEventStore((state) => state.event);
  const isOrganizer = useEventStore(selectIsOrganizer);

  const {
    data: stats,
    refresh: refreshStats,
    isLoading: statsLoading,
  } = useSupabaseQuery(async () => {
    const [
      { count: participants },
      { count: photos },
      { count: moments },
    ] = await Promise.all([
      supabase
        .from('event_members')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('event_id', id)
        .eq('status', 'joined'),

      supabase
        .from('media')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('event_id', id)
        .in('status', ['ready', 'published']),

      supabase
        .from('moments')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('event_id', id),
    ]);

    return {
      participants: participants || 0,
      photos: photos || 0,
      moments: moments || 0,
    };
  }, [id]);

  const {
    data: recentMoments,
    refresh: refreshMoments,
  } = useSupabaseQuery(async () => {
    const { data } = await supabase
      .from('moments')
      .select(
        '*, media:representative_media_id(*)'
      )
      .eq('event_id', id)
      .order('starts_at', {
        ascending: false,
      })
      .limit(10);

    return data || [];
  }, [id]);

  const {
    data: recentMedia,
    refresh: refreshMedia,
  } = useSupabaseQuery(async () => {
    const { data } = await supabase
      .from('media')
      .select('*')
      .eq('event_id', id)
      .in('status', ['ready', 'published'])
      .order('created_at', {
        ascending: false,
      })
      .limit(9);

    return data || [];
  }, [id]);

  const heroUrl = useMemo(() => {
    if (!event?.cover_path) {
      return null;
    }

    return publicMediaUrl(event.cover_path);
  }, [event?.cover_path]);

  const eventType = useMemo(() => {
    return theme.helpers.getEventType(
      event?.category
    );
  }, [event?.category]);

  const featuredMedia = useMemo(() => {
    return (recentMedia || []).slice(0, 5);
  }, [recentMedia]);

  const handleRefresh = async () => {
    await Promise.all([
      refreshStats?.(),
      refreshMoments?.(),
      refreshMedia?.(),
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: event?.name || 'Everia',
        message: event?.event_code
          ? `Rejoins ${event.name} sur Everia avec le code ${event.event_code}.`
          : `Découvre ${event?.name || 'cet événement'} sur Everia.`,
      });
    } catch (error) {
      // L'utilisateur peut simplement fermer le dialogue de partage.
      // Aucun traitement supplémentaire n'est nécessaire ici.
    }
  };

  if (!event) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={!!statsLoading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* ================================================== */}
        {/* HERO                                               */}
        {/* ================================================== */}

        <View style={styles.hero}>
          {heroUrl ? (
            <Image
              source={{ uri: heroUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={250}
            />
          ) : (
            <LinearGradient
              colors={theme.gradients.luxury}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          <LinearGradient
            colors={[
              'rgba(27,11,29,0.18)',
              'rgba(27,11,29,0.44)',
              'rgba(27,11,29,0.96)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroTop}>
            <GlassIconButton
              icon="chevron-back"
              onPress={() => router.back()}
              accessibilityLabel="Retour"
            />

            <View style={styles.heroActions}>
              {isOrganizer && (
                <GlassIconButton
                  icon="settings-outline"
                  onPress={() =>
                    router.push(
                      `/organizer/${id}/dashboard`
                    )
                  }
                  accessibilityLabel="Dashboard organisateur"
                />
              )}

              <GlassIconButton
                icon="qr-code-outline"
                onPress={() =>
                  router.push(
                    `/event/${id}/invite`
                  )
                }
                accessibilityLabel="Code de l'événement"
              />

              <GlassIconButton
                icon="share-social-outline"
                onPress={handleShare}
                accessibilityLabel="Partager l'événement"
              />
            </View>
          </View>

          <View style={styles.heroBottom}>
            <View style={styles.heroTopMeta}>
              <EventStatusBadge
                status={event.status}
              />

              {event.live_wall_enabled &&
                event.status === 'live' && (
                  <View style={styles.liveBadge}>
                    <View
                      style={
                        styles.liveBadgeDot
                      }
                    />

                    <Text
                      style={
                        styles.liveBadgeText
                      }
                    >
                      EN DIRECT
                    </Text>
                  </View>
                )}
            </View>

            <View style={styles.typePill}>
              <Ionicons
                name={eventType.icon}
                size={12}
                color={
                  theme.colors.champagneLight
                }
              />

              <Text style={styles.typePillText}>
                {eventType.label}
              </Text>
            </View>

            <Text style={styles.heroTitle}>
              {event.name}
            </Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={
                    theme.colors.champagneLight
                  }
                />

                <Text
                  style={styles.heroMetaText}
                  numberOfLines={1}
                >
                  {formatEventDate(
                    event.start_at
                  )}
                </Text>
              </View>

              {!!event.venue_name && (
                <View style={styles.heroMetaItem}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={
                      theme.colors.champagneLight
                    }
                  />

                  <Text
                    style={styles.heroMetaText}
                    numberOfLines={1}
                  >
                    {event.venue_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* EVENT IDENTITY CARD                                */}
        {/* ================================================== */}

        <View style={styles.identityCard}>
          <View style={styles.identityHeader}>
            <View style={styles.identityCopy}>
              <Text
                style={styles.identityEyebrow}
              >
                VOTRE ÉVÉNEMENT
              </Text>

              <Text style={styles.identityTitle}>
                Tous les souvenirs,
                au même endroit.
              </Text>
            </View>

            <View style={styles.codeContainer}>
              <Text
                style={styles.codeLabel}
              >
                CODE
              </Text>

              <Text
                style={styles.codeValue}
                numberOfLines={1}
              >
                {event.event_code || '—'}
              </Text>
            </View>
          </View>

          <View style={styles.identityDivider} />

          <View style={styles.statsRow}>
            <EventStat
              icon="people-outline"
              value={stats?.participants}
              label="Participants"
            />

            <View
              style={styles.statDivider}
            />

            <EventStat
              icon="images-outline"
              value={stats?.photos}
              label="Souvenirs"
            />

            <View
              style={styles.statDivider}
            />

            <EventStat
              icon="sparkles-outline"
              value={stats?.moments}
              label="Moments"
            />
          </View>
        </View>

        {/* ================================================== */}
        {/* PRIMARY CTA                                         */}
        {/* ================================================== */}

        <Pressable
          onPress={() =>
            router.push(
              `/event/${id}/capture`
            )
          }
          style={({ pressed }) => [
            styles.captureCard,
            pressed && styles.cardPressed,
          ]}
        >
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.captureGlowOne} />
          <View style={styles.captureGlowTwo} />

          <View style={styles.captureIcon}>
            <Ionicons
              name="camera-outline"
              size={24}
              color={theme.colors.primaryDeep}
            />
          </View>

          <View style={styles.captureCopy}>
            <Text style={styles.captureEyebrow}>
              CRÉER UN SOUVENIR
            </Text>

            <Text style={styles.captureTitle}>
              Capturer un moment
            </Text>

            <Text style={styles.captureSubtitle}>
              Photo ou vidéo, directement
              depuis l’événement.
            </Text>
          </View>

          <View style={styles.captureArrow}>
            <Ionicons
              name="arrow-forward"
              size={19}
              color={theme.colors.primaryDeep}
            />
          </View>
        </Pressable>

        {/* ================================================== */}
        {/* QUICK MODULES                                       */}
        {/* ================================================== */}

        <SectionHeader
          eyebrow="EXPLORER"
          title="L’expérience Everia"
        />

        <View style={styles.moduleGrid}>
          {MODULES.map((module, index) => (
            <ModuleCard
              key={module.key}
              module={module}
              featured={module.featured}
              onPress={() =>
                router.push(
                  `/event/${id}/${module.route}`
                )
              }
              first={
                index === 0
              }
            />
          ))}
        </View>

        {/* ================================================== */}
        {/* MOMENTS                                             */}
        {/* ================================================== */}

        <SectionHeader
          eyebrow="MOMENTS"
          title="Les temps forts"
          actionLabel="Tout voir"
          onAction={() =>
            router.push(
              `/event/${id}/moments`
            )
          }
          style={styles.sectionSpacing}
        />

        {recentMoments?.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.horizontalContent
            }
          >
            {recentMoments
              .slice(0, 8)
              .map((moment, index) => (
                <View
                  key={moment.id}
                  style={
                    index === 0
                      ? styles.firstHorizontalItem
                      : styles.horizontalItem
                  }
                >
                  <MomentCard
                    moment={moment}
                    coverMedia={
                      moment.media
                    }
                    onPress={() =>
                      router.push(
                        `/event/${id}/moment/${moment.id}`
                      )
                    }
                  />
                </View>
              ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <EmptyState
              icon="sparkles-outline"
              title="Pas encore de moment"
              subtitle="Les Moments apparaissent automatiquement à mesure que les souvenirs arrivent."
            />
          </View>
        )}

        {/* ================================================== */}
        {/* RECENT MEMORIES                                     */}
        {/* ================================================== */}

        <SectionHeader
          eyebrow="SOUVENIRS"
          title="Dernières captures"
          actionLabel="Galerie"
          onAction={() =>
            router.push(
              `/event/${id}/gallery`
            )
          }
          style={styles.sectionSpacing}
        />

        {featuredMedia.length ? (
          <View style={styles.editorialGallery}>
            <EditorialMediaCard
              media={featuredMedia[0]}
              large
              onPress={() =>
                router.push(
                  `/event/${id}/media/${featuredMedia[0].id}`
                )
              }
            />

            <View style={styles.smallMediaColumn}>
              {featuredMedia
                .slice(1, 3)
                .map((media) => (
                  <EditorialMediaCard
                    key={media.id}
                    media={media}
                    onPress={() =>
                      router.push(
                        `/event/${id}/media/${media.id}`
                      )
                    }
                  />
                ))}
            </View>

            {featuredMedia
              .slice(3, 5)
              .map((media) => (
                <EditorialMediaCard
                  key={media.id}
                  media={media}
                  compact
                  onPress={() =>
                    router.push(
                      `/event/${id}/media/${media.id}`
                    )
                  }
                />
              ))}
          </View>
        ) : (
          <View style={styles.emptyGallery}>
            <Ionicons
              name="images-outline"
              size={27}
              color={theme.colors.primary}
            />

            <Text
              style={styles.emptyGalleryTitle}
            >
              La galerie commence ici.
            </Text>

            <Text
              style={styles.emptyGallerySubtitle}
            >
              Capturez le premier souvenir
              de cet événement.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.emptyGalleryButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() =>
                router.push(
                  `/event/${id}/capture`
                )
              }
            >
              <Ionicons
                name="camera-outline"
                size={16}
                color={theme.colors.white}
              />

              <Text
                style={styles.emptyGalleryButtonText}
              >
                Capturer
              </Text>
            </Pressable>
          </View>
        )}

        {/* ================================================== */}
        {/* EVENT CODE / INVITE                                 */}
        {/* ================================================== */}

        <View style={styles.inviteCard}>
          <View style={styles.inviteIcon}>
            <Ionicons
              name="qr-code-outline"
              size={23}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.inviteCopy}>
            <Text style={styles.inviteEyebrow}>
              INVITER
            </Text>

            <Text style={styles.inviteTitle}>
              Partagez votre événement
            </Text>

            <Text style={styles.inviteSubtitle}>
              Utilisez le QR code ou le code
              événement pour inviter les
              participants.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.inviteArrow,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={() =>
              router.push(
                `/event/${id}/invite`
              )
            }
          >
            <Ionicons
              name="arrow-forward"
              size={18}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>

        {/* ================================================== */}
        {/* BRAND FOOTER                                        */}
        {/* ================================================== */}

        <View style={styles.footer}>
          <View style={styles.footerLine} />

          <View style={styles.footerBrandRow}>
            <Ionicons
              name="sparkles-outline"
              size={15}
              color={theme.colors.champagneDark}
            />

            <Text style={styles.footerBrand}>
              EVERIA
            </Text>
          </View>

          <Text style={styles.footerText}>
            One Event. Many Perspectives.
            One Everia.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================================================ */
/* GLASS ICON BUTTON                                             */
/* ============================================================ */

function GlassIconButton({
  icon,
  onPress,
  accessibilityLabel,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel
      }
      style={({ pressed }) => [
        styles.glassButton,
        pressed && styles.glassButtonPressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={theme.colors.white}
      />
    </Pressable>
  );
}

/* ============================================================ */
/* SECTION HEADER                                                */
/* ============================================================ */

function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  onAction,
  style,
}) {
  return (
    <View
      style={[
        styles.sectionHeader,
        style,
      ]}
    >
      <View style={styles.sectionHeaderCopy}>
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
          style={({ pressed }) => [
            styles.sectionAction,
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Text style={styles.sectionActionText}>
            {actionLabel}
          </Text>

          <Ionicons
            name="arrow-forward"
            size={14}
            color={theme.colors.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

/* ============================================================ */
/* EVENT STAT                                                    */
/* ============================================================ */

function EventStat({
  icon,
  value,
  label,
}) {
  return (
    <View style={styles.eventStat}>
      <View style={styles.eventStatIcon}>
        <Ionicons
          name={icon}
          size={15}
          color={theme.colors.primary}
        />
      </View>

      <Text style={styles.eventStatValue}>
        {value ?? 0}
      </Text>

      <Text style={styles.eventStatLabel}>
        {label}
      </Text>
    </View>
  );
}

/* ============================================================ */
/* MODULE CARD                                                   */
/* ============================================================ */

function ModuleCard({
  module,
  featured,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        featured
          ? styles.moduleCardFeatured
          : styles.moduleCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View
        style={
          featured
            ? styles.moduleIconFeatured
            : styles.moduleIcon
        }
      >
        <Ionicons
          name={module.icon}
          size={19}
          color={
            featured
              ? theme.colors.primaryDeep
              : theme.colors.primary
          }
        />
      </View>

      <View style={styles.moduleCopy}>
        <Text
          style={
            featured
              ? styles.moduleTitleFeatured
              : styles.moduleTitle
          }
        >
          {module.label}
        </Text>

        <Text
          style={
            featured
              ? styles.moduleDescriptionFeatured
              : styles.moduleDescription
          }
          numberOfLines={1}
        >
          {module.description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={
          featured
            ? 'rgba(38,17,41,0.55)'
            : theme.colors.textMuted
        }
      />
    </Pressable>
  );
}

/* ============================================================ */
/* EDITORIAL MEDIA CARD                                         */
/* ============================================================ */

function EditorialMediaCard({
  media,
  large = false,
  compact = false,
  onPress,
}) {
  const uri = mediaThumbnail(media);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        large
          ? styles.editorialLarge
          : compact
          ? styles.editorialCompact
          : styles.editorialSmall,
        pressed && styles.cardPressed,
      ]}
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={180}
      />

      <LinearGradient
        colors={[
          'rgba(26,11,28,0)',
          'rgba(26,11,28,0.52)',
        ]}
        start={{ x: 0, y: 0.35 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.mediaOverlay}>
        {media.media_type ===
          'video' && (
          <View style={styles.mediaTypeBadge}>
            <Ionicons
              name="play"
              size={11}
              color={theme.colors.white}
            />
          </View>
        )}

        <View
          style={styles.mediaBottomRow}
        >
          <Text style={styles.mediaTime}>
            {formatMediaDate(
              media.created_at
            )}
          </Text>

          <View style={styles.mediaArrow}>
            <Ionicons
              name="arrow-up-outline"
              size={13}
              color={theme.colors.white}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ============================================================ */
/* HELPERS                                                       */
/* ============================================================ */

function formatMediaDate(dateString) {
  if (!dateString) {
    return 'Souvenir';
  }

  const date = new Date(dateString);

  if (
    Number.isNaN(date.getTime())
  ) {
    return 'Souvenir';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }
  )
    .format(date)
    .replace('.', '');
}

/* ============================================================ */
/* STYLES                                                        */
/* ============================================================ */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      theme.screens.event,
  },

  scrollContent: {
    paddingBottom: 48,
  },

  /* ---------------------------------------------------------- */
  /* HERO                                                        */
  /* ---------------------------------------------------------- */

  hero: {
    height: 330,
    position: 'relative',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 26,
    backgroundColor:
      theme.colors.primaryDeep,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  glassButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.18)',
  },

  glassButtonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  heroBottom: {
    width: '100%',
  },

  heroTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor:
      'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
  },

  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.eventLive,
    marginRight: 5,
  },

  liveBadgeText: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1,
    color: theme.colors.white,
  },

  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 7,
  },

  typePillText: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 1.25,
    color:
      theme.colors.champagneLight,
    marginLeft: 5,
  },

  heroTitle: {
    maxWidth: '94%',
    fontFamily:
      theme.typography.families.displayBold,
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: -0.55,
    color: theme.colors.white,
  },

  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 13,
    marginTop: 9,
  },

  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },

  heroMetaText: {
    flexShrink: 1,
    marginLeft: 5,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 11,
    color:
      'rgba(255,255,255,0.80)',
  },

  /* ---------------------------------------------------------- */
  /* IDENTITY CARD                                               */
  /* ---------------------------------------------------------- */

  identityCard: {
    marginTop: -17,
    marginHorizontal: 18,
    padding: 16,
    borderRadius: 24,
    backgroundColor:
      theme.colors.white,
    borderWidth: 1,
    borderColor: '#EAE3DB',
    ...theme.shadows.md,
  },

  identityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  identityCopy: {
    flex: 1,
    paddingRight: 12,
  },

  identityEyebrow: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1.2,
    color:
      theme.colors.champagneDark,
  },

  identityTitle: {
    marginTop: 4,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 18,
    lineHeight: 23,
    color:
      theme.colors.textPrimary,
  },

  codeContainer: {
    alignItems: 'flex-end',
    paddingLeft: 7,
  },

  codeLabel: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 8,
    letterSpacing: 1,
    color:
      theme.colors.textMuted,
  },

  codeValue: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.mono,
    fontSize: 12,
    letterSpacing: 1.35,
    color:
      theme.colors.primary,
  },

  identityDivider: {
    height: 1,
    backgroundColor:
      theme.colors.borderLight,
    marginVertical: 15,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statDivider: {
    width: 1,
    height: 34,
    backgroundColor:
      theme.colors.borderLight,
  },

  eventStat: {
    flex: 1,
    alignItems: 'center',
  },

  eventStatIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.primarySoft,
    marginBottom: 5,
  },

  eventStatValue: {
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 17,
    lineHeight: 21,
    color:
      theme.colors.textPrimary,
  },

  eventStatLabel: {
    marginTop: 1,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    color:
      theme.colors.textMuted,
  },

  /* ---------------------------------------------------------- */
  /* CAPTURE CTA                                                 */
  /* ---------------------------------------------------------- */

  captureCard: {
    minHeight: 112,
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    position: 'relative',
  },

  captureGlowOne: {
    position: 'absolute',
    right: -35,
    top: -45,
    width: 135,
    height: 135,
    borderRadius: 70,
    backgroundColor:
      'rgba(217,184,120,0.20)',
  },

  captureGlowTwo: {
    position: 'absolute',
    left: -30,
    bottom: -55,
    width: 125,
    height: 125,
    borderRadius: 65,
    backgroundColor:
      'rgba(255,255,255,0.05)',
  },

  captureIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.champagneLight,
  },

  captureCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    paddingRight: 8,
  },

  captureEyebrow: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 8,
    letterSpacing: 1.2,
    color:
      'rgba(255,255,255,0.62)',
  },

  captureTitle: {
    marginTop: 3,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 18,
    lineHeight: 22,
    color: theme.colors.white,
  },

  captureSubtitle: {
    marginTop: 3,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    color:
      'rgba(255,255,255,0.70)',
  },

  captureArrow: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.champagne,
  },

  /* ---------------------------------------------------------- */
  /* SECTION HEADER                                              */
  /* ---------------------------------------------------------- */

  sectionHeader: {
    marginHorizontal: 18,
    marginTop: 28,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  sectionHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },

  sectionEyebrow: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1.25,
    color:
      theme.colors.champagneDark,
  },

  sectionTitle: {
    marginTop: 3,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 21,
    lineHeight: 26,
    color:
      theme.colors.textPrimary,
  },

  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
    gap: 5,
  },

  sectionActionText: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 10.5,
    color:
      theme.colors.primary,
  },

  sectionSpacing: {
    marginTop: 30,
  },

  /* ---------------------------------------------------------- */
  /* MODULE GRID                                                 */
  /* ---------------------------------------------------------- */

  moduleGrid: {
    paddingHorizontal: 18,
    gap: 9,
  },

  moduleCardFeatured: {
    minHeight: 74,
    borderRadius: 19,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.champagne,
    borderWidth: 1,
    borderColor:
      '#D7B979',
  },

  moduleCard: {
    minHeight: 67,
    borderRadius: 18,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.white,
    borderWidth: 1,
    borderColor:
      '#EBE5DD',
    ...theme.shadows.sm,
  },

  moduleIconFeatured: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.champagneLight,
  },

  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.primarySoft,
  },

  moduleCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    marginRight: 8,
  },

  moduleTitleFeatured: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 12,
    color:
      theme.colors.primaryDeep,
  },

  moduleTitle: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 12,
    color:
      theme.colors.textPrimary,
  },

  moduleDescriptionFeatured: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    color:
      'rgba(38,17,41,0.62)',
  },

  moduleDescription: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    color:
      theme.colors.textMuted,
  },

  /* ---------------------------------------------------------- */
  /* MOMENTS                                                     */
  /* ---------------------------------------------------------- */

  horizontalContent: {
    paddingLeft: 18,
    paddingRight: 18,
  },

  firstHorizontalItem: {
    marginRight: 10,
  },

  horizontalItem: {
    marginRight: 10,
  },

  emptyCard: {
    marginHorizontal: 18,
    minHeight: 170,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor:
      theme.colors.white,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    justifyContent: 'center',
  },

  /* ---------------------------------------------------------- */
  /* EDITORIAL GALLERY                                           */
  /* ---------------------------------------------------------- */

  editorialGallery: {
    marginHorizontal: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  editorialLarge: {
    width: '58%',
    height: 246,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor:
      theme.colors.surfaceDark2,
    position: 'relative',
  },

  smallMediaColumn: {
    width: '39%',
    height: 246,
    gap: 8,
  },

  editorialSmall: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor:
      theme.colors.surfaceDark2,
    position: 'relative',
  },

  editorialCompact: {
    width: '31.7%',
    height: 112,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor:
      theme.colors.surfaceDark2,
    position: 'relative',
  },

  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 8,
  },

  mediaTypeBadge: {
    width: 23,
    height: 23,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    backgroundColor:
      'rgba(0,0,0,0.50)',
  },

  mediaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  mediaTime: {
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 8.5,
    color:
      'rgba(255,255,255,0.80)',
  },

  mediaArrow: {
    width: 23,
    height: 23,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(0,0,0,0.42)',
  },

  emptyGallery: {
    marginHorizontal: 18,
    minHeight: 220,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor:
      theme.colors.white,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
  },

  emptyGalleryTitle: {
    marginTop: 12,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 18,
    color:
      theme.colors.textPrimary,
    textAlign: 'center',
  },

  emptyGallerySubtitle: {
    marginTop: 5,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    lineHeight: 15,
    color:
      theme.colors.textMuted,
    textAlign: 'center',
  },

  emptyGalleryButton: {
    marginTop: 16,
    paddingHorizontal: 15,
    minHeight: 39,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.primary,
  },

  emptyGalleryButtonText: {
    marginLeft: 6,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 10.5,
    color: theme.colors.white,
  },

  /* ---------------------------------------------------------- */
  /* INVITE                                                      */
  /* ---------------------------------------------------------- */

  inviteCard: {
    marginHorizontal: 18,
    marginTop: 28,
    padding: 14,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.primarySoft,
    borderWidth: 1,
    borderColor:
      '#E5D8E6',
  },

  inviteIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.white,
  },

  inviteCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    paddingRight: 8,
  },

  inviteEyebrow: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 8,
    letterSpacing: 1.15,
    color:
      theme.colors.primaryLight,
  },

  inviteTitle: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color:
      theme.colors.textPrimary,
  },

  inviteSubtitle: {
    marginTop: 3,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    color:
      theme.colors.textSecondary,
  },

  inviteArrow: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.white,
  },

  /* ---------------------------------------------------------- */
  /* FOOTER                                                      */
  /* ---------------------------------------------------------- */

  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },

  footerLine: {
    width: 36,
    height: 2,
    borderRadius: 2,
    backgroundColor:
      theme.colors.champagne,
    marginBottom: 10,
  },

  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  footerBrand: {
    marginLeft: 5,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 9,
    letterSpacing: 2,
    color:
      theme.colors.primary,
  },

  footerText: {
    marginTop: 5,
    fontFamily:
      theme.typography.families.display,
    fontSize: 10.5,
    color:
      theme.colors.textMuted,
    textAlign: 'center',
  },

  /* ---------------------------------------------------------- */
  /* INTERACTIONS                                                */
  /* ---------------------------------------------------------- */

  cardPressed: {
    opacity: 0.88,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  buttonPressed: {
    opacity: 0.70,
  },
});