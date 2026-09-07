// app/organizer/[id]/dashboard.js
// ------------------------------------------------------------
// Dashboard organisateur — refonte UI/UX
// Direction : "SaaS command center" moderne, inspirée des dashboards
// produits premium type Linear / Notion, adaptée au langage visuel Everia.
//
// IMPORTANT : cette refonte ne change pas les routes métier ni les tables
// utilisées par le Dashboard. Elle enrichit uniquement la présentation,
// la hiérarchie visuelle et la lecture des informations.
// ------------------------------------------------------------

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import theme from '@/theme';
import { ORGANIZER_ICONS } from '@/constants/icons';
import EventStatusBadge from '@/components/event/EventStatusBadge';
import { useEventStore } from '@/store/eventStore';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { publicMediaUrl } from '@/lib/storage';
import { formatCompactNumber, formatEventDate } from '@/lib/format';

const QUICK_ACTIONS = [
  {
    key: 'participants',
    label: 'Participants',
    description: 'Invités & présence',
    icon: ORGANIZER_ICONS.participants,
    route: 'participants',
  },
  {
    key: 'moderation',
    label: 'Modération',
    description: 'Contrôler les médias',
    icon: ORGANIZER_ICONS.moderation,
    route: 'moderation',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'Suivre l’engagement',
    icon: ORGANIZER_ICONS.analytics,
    route: 'analytics',
  },
  {
    key: 'customize',
    label: 'Personnaliser',
    description: 'Adapter l’expérience',
    icon: ORGANIZER_ICONS.customize,
    route: 'customize',
  },
];

export default function OrganizerDashboard() {
  const { id } = useLocalSearchParams();
  const event = useEventStore((state) => state.event);

  const { data, isLoading, refresh } = useSupabaseQuery(async () => {
    const [
      { count: participants },
      { count: media },
      { count: pending },
      { data: metrics },
    ] = await Promise.all([
      supabase
        .from('event_members')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id)
        .eq('status', 'joined'),

      supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id),

      supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id)
        .in('moderation_status', ['not_checked', 'review']),

      supabase
        .from('event_daily_metrics')
        .select(
          'metric_date,participants,uploads,likes,comments,challenges_completed'
        )
        .eq('event_id', id)
        .order('metric_date', { ascending: true })
        .limit(30),
    ]);

    const joinedParticipants = participants || 0;
    const dailyMetrics = metrics || [];
    const latestMetric = dailyMetrics[dailyMetrics.length - 1];

    const participationRate =
      latestMetric && joinedParticipants
        ? Math.min(
            100,
            Math.round(
              (latestMetric.participants / joinedParticipants) * 100
            )
          )
        : null;

    const last7Days = dailyMetrics.slice(-7);

    const weeklyUploads = last7Days.reduce(
      (sum, row) => sum + Number(row.uploads || 0),
      0
    );

    const weeklyLikes = last7Days.reduce(
      (sum, row) => sum + Number(row.likes || 0),
      0
    );

    const weeklyComments = last7Days.reduce(
      (sum, row) => sum + Number(row.comments || 0),
      0
    );

    const weeklyChallenges = last7Days.reduce(
      (sum, row) => sum + Number(row.challenges_completed || 0),
      0
    );

    return {
      participants: joinedParticipants,
      media: media || 0,
      pending: pending || 0,
      participationRate,
      weeklyUploads,
      weeklyLikes,
      weeklyComments,
      weeklyChallenges,
      dailyMetrics: last7Days,
    };
  }, [id]);

  const chart = useMemo(() => {
    const rows = data?.dailyMetrics || [];
    const max = Math.max(
      1,
      ...rows.map((row) => Number(row.uploads || 0))
    );

    return rows.map((row) => {
      const date = new Date(`${row.metric_date}T12:00:00`);

      const day = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
      })
        .format(date)
        .replace('.', '');

      return {
        key: row.metric_date,
        label:
          day.charAt(0).toUpperCase() + day.slice(1, 3),
        value: Number(row.uploads || 0),
        height: Math.max(
          8,
          (Number(row.uploads || 0) / max) * 74
        ),
      };
    });
  }, [data?.dailyMetrics]);

  const eventMeta = useMemo(() => {
    if (!event) return [];

    const items = [];

    if (event.start_at) {
      items.push({
        icon: 'calendar-outline',
        label: formatEventDate(event.start_at),
      });
    }

    if (event.venue_name) {
      items.push({
        icon: 'location-outline',
        label: event.venue_name,
      });
    }

    return items;
  }, [event]);

  if (!event) return null;

  const coverUrl = event.cover_path
    ? publicMediaUrl(event.cover_path)
    : null;

  const hasModerationAttention = (data?.pending || 0) > 0;

  const engagementTotal =
    (data?.weeklyLikes || 0) +
    (data?.weeklyComments || 0) +
    (data?.weeklyChallenges || 0);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={!!isLoading}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* -------------------------------------------------- */}
        {/* TOP BAR */}
        {/* -------------------------------------------------- */}

        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Ionicons
              name="chevron-back"
              size={21}
              color={theme.colors.primaryDeep}
            />
          </Pressable>

          <View style={styles.topBarCenter}>
            <Text style={styles.eyebrow}>
              ESPACE ORGANISATEUR
            </Text>

            <Text style={styles.topBarTitle}>
              Dashboard
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.previewButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push(`/event/${id}`)}
            accessibilityRole="button"
            accessibilityLabel="Voir l’événement"
          >
            <Ionicons
              name="eye-outline"
              size={20}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>

        {/* -------------------------------------------------- */}
        {/* HERO EVENT */}
        {/* -------------------------------------------------- */}

        <View style={styles.heroCard}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={theme.gradients.darkLuxury}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          <LinearGradient
            colors={[
              'rgba(22,10,24,0.12)',
              'rgba(22,10,24,0.92)',
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroTopRow}>
            <EventStatusBadge
              status={event.status}
              size="sm"
            />

            <View style={styles.heroLiveChip}>
              <View style={styles.heroLiveDot} />

              <Text style={styles.heroLiveText}>
                {statusLabel(event.status)}
              </Text>
            </View>
          </View>

          <View style={styles.heroContent}>
            <Text
              style={styles.heroEventName}
              numberOfLines={2}
            >
              {event.name}
            </Text>

            <View style={styles.heroMetaRow}>
              {eventMeta.map((item) => (
                <View
                  key={`${item.icon}-${item.label}`}
                  style={styles.heroMetaItem}
                >
                  <Ionicons
                    name={item.icon}
                    size={13}
                    color={theme.colors.champagneLight}
                  />

                  <Text
                    style={styles.heroMetaText}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.heroFooter}>
              <View>
                <Text style={styles.heroCodeLabel}>
                  CODE ÉVÉNEMENT
                </Text>

                <Text style={styles.heroCode}>
                  {event.event_code || '—'}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.heroAction,
                  pressed && styles.pressedDark,
                ]}
                onPress={() =>
                  router.push(
                    `/organizer/${id}/customize`
                  )
                }
              >
                <Ionicons
                  name="create-outline"
                  size={17}
                  color={theme.colors.primaryDeep}
                />

                <Text style={styles.heroActionText}>
                  Modifier
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* -------------------------------------------------- */}
        {/* OVERVIEW HEADER */}
        {/* -------------------------------------------------- */}

        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionEyebrow}>
              VUE D’ENSEMBLE
            </Text>

            <Text style={styles.sectionTitle}>
              Santé de l’événement
            </Text>
          </View>

          <View style={styles.liveIndicator}>
            <View style={styles.liveIndicatorDot} />

            <Text style={styles.liveIndicatorText}>
              À jour
            </Text>
          </View>
        </View>

        {/* -------------------------------------------------- */}
        {/* METRICS */}
        {/* -------------------------------------------------- */}

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="people-outline"
            label="Participants"
            value={data?.participants}
            hint="membres inscrits"
            accent="plum"
          />

          <MetricCard
            icon="images-outline"
            label="Médias"
            value={data?.media}
            hint={`${formatCompactNumber(
              data?.weeklyUploads || 0
            )} cette semaine`}
            accent="gold"
          />

          <MetricCard
            icon="pulse-outline"
            label="Participation"
            value={
              data?.participationRate != null
                ? `${data.participationRate}%`
                : '—'
            }
            hint="taux d’activité"
            accent="green"
          />

          <MetricCard
            icon="chatbubble-ellipses-outline"
            label="Engagement"
            value={engagementTotal}
            hint="interactions · 7 j"
            accent="rose"
          />
        </View>

        {/* -------------------------------------------------- */}
        {/* ATTENTION / SUCCESS */}
        {/* -------------------------------------------------- */}

        {hasModerationAttention ? (
          <Pressable
            style={({ pressed }) => [
              styles.attentionCard,
              pressed && styles.cardPressed,
            ]}
            onPress={() =>
              router.push(
                `/organizer/${id}/moderation`
              )
            }
          >
            <View style={styles.attentionIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={21}
                color={theme.colors.warning}
              />
            </View>

            <View style={styles.attentionContent}>
              <View style={styles.attentionTitleRow}>
                <Text style={styles.attentionTitle}>
                  Modération à traiter
                </Text>

                <View style={styles.attentionCount}>
                  <Text style={styles.attentionCountText}>
                    {data.pending}
                  </Text>
                </View>
              </View>

              <Text style={styles.attentionSubtitle}>
                Des médias attendent encore une validation
                avant diffusion.
              </Text>
            </View>

            <Ionicons
              name="arrow-forward"
              size={19}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : (
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark"
                size={18}
                color={theme.colors.success}
              />
            </View>

            <View style={styles.successContent}>
              <Text style={styles.successTitle}>
                Tout est sous contrôle
              </Text>

              <Text style={styles.successSubtitle}>
                Aucun média en attente de modération.
              </Text>
            </View>
          </View>
        )}

        {/* -------------------------------------------------- */}
        {/* ACTIVITY */}
        {/* -------------------------------------------------- */}

        <View style={styles.sectionHeaderRowSpaced}>
          <View>
            <Text style={styles.sectionEyebrow}>
              ACTIVITÉ
            </Text>

            <Text style={styles.sectionTitle}>
              Rythme des uploads
            </Text>
          </View>

          <Text style={styles.sectionMeta}>
            7 derniers jours
          </Text>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityTopRow}>
            <View>
              <Text style={styles.activityValue}>
                {formatCompactNumber(
                  data?.weeklyUploads || 0
                )}
              </Text>

              <Text style={styles.activityLabel}>
                médias envoyés
              </Text>
            </View>

            <View style={styles.activityPill}>
              <Ionicons
                name="trending-up-outline"
                size={15}
                color={theme.colors.primary}
              />

              <Text style={styles.activityPillText}>
                activité
              </Text>
            </View>
          </View>

          {chart.length ? (
            <View style={styles.chart}>
              {chart.map((item) => (
                <View
                  key={item.key}
                  style={styles.chartColumn}
                >
                  <View style={styles.chartTrack}>
                    <LinearGradient
                      colors={theme.gradients.goldSoft}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={[
                        styles.chartBar,
                        { height: item.height },
                      ]}
                    />
                  </View>

                  <Text style={styles.chartLabel}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.chartEmpty}>
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
              />

              <Text style={styles.chartEmptyText}>
                Les premières activités apparaîtront ici.
              </Text>
            </View>
          )}
        </View>

        {/* -------------------------------------------------- */}
        {/* COMMANDS */}
        {/* -------------------------------------------------- */}

        <View style={styles.sectionHeaderRowSpaced}>
          <View>
            <Text style={styles.sectionEyebrow}>
              COMMANDES
            </Text>

            <Text style={styles.sectionTitle}>
              Gérer l’événement
            </Text>
          </View>
        </View>

        <View style={styles.actionsList}>
          {QUICK_ACTIONS.map((item, index) => (
            <ActionRow
              key={item.key}
              item={item}
              badge={
                item.key === 'moderation'
                  ? data?.pending
                  : null
              }
              first={index === 0}
              last={
                index === QUICK_ACTIONS.length - 1
              }
              onPress={() =>
                router.push(
                  `/organizer/${id}/${item.route}`
                )
              }
            />
          ))}
        </View>

        {/* -------------------------------------------------- */}
        {/* FOOTER */}
        {/* -------------------------------------------------- */}

        <View style={styles.bottomQuote}>
          <View style={styles.quoteLine} />

          <View style={styles.quoteBody}>
            <Ionicons
              name="sparkles-outline"
              size={17}
              color={theme.colors.champagneDark}
            />

            <Text style={styles.quoteText}>
              Une belle expérience commence par un
              événement bien orchestré.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================================================ */
/* METRIC CARD                                                   */
/* ============================================================ */

function MetricCard({
  icon,
  label,
  value,
  hint,
  accent,
}) {
  const accentMap = {
    plum: {
      iconBackground: theme.colors.primarySoft,
      iconColor: theme.colors.primary,
    },

    gold: {
      iconBackground: theme.colors.champagneSoft,
      iconColor: theme.colors.champagneDark,
    },

    green: {
      iconBackground: '#EAF2EC',
      iconColor: theme.colors.success,
    },

    rose: {
      iconBackground: '#F8E7EA',
      iconColor: theme.colors.error,
    },
  };

  const spec =
    accentMap[accent] || accentMap.plum;

  return (
    <View style={styles.metricCard}>
      <View
        style={[
          styles.metricIcon,
          {
            backgroundColor:
              spec.iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={spec.iconColor}
        />
      </View>

      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text
        style={styles.metricValue}
        numberOfLines={1}
      >
        {typeof value === 'number'
          ? formatCompactNumber(value)
          : value ?? '—'}
      </Text>

      <Text
        style={styles.metricHint}
        numberOfLines={1}
      >
        {hint}
      </Text>
    </View>
  );
}

/* ============================================================ */
/* ACTION ROW                                                    */
/* ============================================================ */

function ActionRow({
  item,
  badge,
  onPress,
  first,
  last,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        first && styles.actionRowFirst,
        last && styles.actionRowLast,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={item.icon}
          size={20}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>
          {item.label}
        </Text>

        <Text style={styles.actionDescription}>
          {item.description}
        </Text>
      </View>

      {!!badge && (
        <View style={styles.actionBadge}>
          <Text style={styles.actionBadgeText}>
            {badge}
          </Text>
        </View>
      )}

      <View style={styles.actionArrow}>
        <Ionicons
          name="chevron-forward"
          size={17}
          color={theme.colors.textMuted}
        />
      </View>
    </Pressable>
  );
}

/* ============================================================ */
/* STATUS LABEL                                                  */
/* ============================================================ */

function statusLabel(status) {
  const labels = {
    draft: 'Brouillon',
    active: 'Actif',
    live: 'En direct',
    closing: 'Clôture',
    completed: 'Terminé',
    archived: 'Archivé',
  };

  return labels[status] || 'Événement';
}

/* ============================================================ */
/* STYLES                                                        */
/* ============================================================ */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      theme.organizer.dashboard.backgroundColor,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 54,
  },

  /* ---------------------------------------------------------- */
  /* TOP BAR                                                     */
  /* ---------------------------------------------------------- */

  topBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  previewButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  topBarCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  eyebrow: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 9,
    letterSpacing: 1.35,
    color: theme.colors.textMuted,
  },

  topBarTitle: {
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 18,
    lineHeight: 23,
    color: theme.colors.textPrimary,
    marginTop: 1,
  },

  /* ---------------------------------------------------------- */
  /* HERO                                                        */
  /* ---------------------------------------------------------- */

  heroCard: {
    height: 270,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.primaryDeep,
    ...theme.shadows.md,
  },

  heroTopRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroLiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  heroLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.champagneLight,
    marginRight: 6,
  },

  heroLiveText: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 10,
    color: theme.colors.white,
  },

  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },

  heroEventName: {
    maxWidth: '92%',
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 28,
    lineHeight: 33,
    color: theme.colors.white,
    letterSpacing: -0.35,
  },

  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
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
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.82)',
  },

  heroFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.14)',
  },

  heroCodeLabel: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 8.5,
    letterSpacing: 1.15,
    color: 'rgba(255,255,255,0.48)',
  },

  heroCode: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 14,
    letterSpacing: 2.4,
    color: theme.colors.champagneLight,
    marginTop: 3,
  },

  heroAction: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      theme.colors.champagnePale,
  },

  heroActionText: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 11,
    color: theme.colors.primaryDeep,
    marginLeft: 6,
  },

  /* ---------------------------------------------------------- */
  /* SECTION HEADERS                                             */
  /* ---------------------------------------------------------- */

  sectionHeaderRow: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  sectionHeaderRowSpaced: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  sectionEyebrow: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 9,
    letterSpacing: 1.15,
    color: theme.colors.champagneDark,
  },

  sectionTitle: {
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 20,
    lineHeight: 25,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },

  sectionMeta: {
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 10.5,
    color: theme.colors.textMuted,
    paddingBottom: 2,
  },

  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F0F4F0',
  },

  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
    marginRight: 5,
  },

  liveIndicatorText: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9.5,
    color: theme.colors.success,
  },

  /* ---------------------------------------------------------- */
  /* METRICS                                                     */
  /* ---------------------------------------------------------- */

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  metricCard: {
    width: '48%',
    minHeight: 145,
    marginBottom: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#EBE5DD',
    ...theme.shadows.sm,
  },

  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  metricLabel: {
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 11,
  },

  metricValue: {
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 26,
    lineHeight: 30,
    color: theme.colors.textPrimary,
    marginTop: 1,
    letterSpacing: -0.45,
  },

  metricHint: {
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  /* ---------------------------------------------------------- */
  /* ATTENTION                                                   */
  /* ---------------------------------------------------------- */

  attentionCard: {
    marginTop: 12,
    minHeight: 84,
    paddingHorizontal: 13,
    paddingVertical: 13,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF4',
    borderWidth: 1,
    borderColor: '#E9D9B8',
  },

  attentionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F8EEDB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  attentionContent: {
    flex: 1,
    minWidth: 0,
  },

  attentionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },

  attentionTitle: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 12.5,
    color: theme.colors.textPrimary,
  },

  attentionCount: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
    backgroundColor: theme.colors.warning,
  },

  attentionCountText: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 10,
    color: theme.colors.white,
  },

  attentionSubtitle: {
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textSecondary,
    paddingRight: 4,
  },

  /* ---------------------------------------------------------- */
  /* SUCCESS STATE                                               */
  /* ---------------------------------------------------------- */

  successCard: {
    marginTop: 12,
    minHeight: 72,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6FAF6',
    borderWidth: 1,
    borderColor: '#DCE9DE',
  },

  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF2EC',
    marginRight: 11,
  },

  successContent: {
    flex: 1,
  },

  successTitle: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 12.5,
    color: theme.colors.textPrimary,
  },

  successSubtitle: {
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  /* ---------------------------------------------------------- */
  /* ACTIVITY                                                    */
  /* ---------------------------------------------------------- */

  activityCard: {
    padding: 17,
    borderRadius: 24,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#EBE5DD',
    ...theme.shadows.sm,
  },

  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  activityValue: {
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 28,
    lineHeight: 32,
    color: theme.colors.textPrimary,
    letterSpacing: -0.55,
  },

  activityLabel: {
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft,
  },

  activityPillText: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9.5,
    color: theme.colors.primary,
    marginLeft: 4,
  },

  chart: {
    height: 114,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },

  chartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  chartTrack: {
    width: '100%',
    height: 78,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSoft,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },

  chartBar: {
    width: '100%',
    borderRadius: 10,
    minHeight: 8,
  },

  chartLabel: {
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 8.5,
    color: theme.colors.textMuted,
    marginTop: 7,
  },

  chartEmpty: {
    height: 114,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chartEmptyText: {
    marginTop: 8,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },

  /* ---------------------------------------------------------- */
  /* ACTIONS                                                     */
  /* ---------------------------------------------------------- */

  actionsList: {
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: '#EBE5DD',
    ...theme.shadows.sm,
  },

  actionRow: {
    minHeight: 77,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE8E0',
  },

  actionRowFirst: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  actionRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  actionTitle: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 12.5,
    color: theme.colors.textPrimary,
  },

  actionDescription: {
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  actionBadge: {
    minWidth: 23,
    height: 23,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  actionBadgeText: {
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 9.5,
    color: theme.colors.white,
  },

  actionArrow: {
    width: 28,
    alignItems: 'flex-end',
  },

  /* ---------------------------------------------------------- */
  /* FOOTER                                                      */
  /* ---------------------------------------------------------- */

  bottomQuote: {
    marginTop: 28,
    marginBottom: 4,
  },

  quoteLine: {
    width: 36,
    height: 2,
    borderRadius: 2,
    backgroundColor: theme.colors.champagne,
    marginBottom: 10,
  },

  quoteBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  quoteText: {
    flex: 1,
    marginLeft: 7,
    fontFamily:
      theme.typography.families.display,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------- */
  /* INTERACTION                                                 */
  /* ---------------------------------------------------------- */

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  pressedDark: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },

  cardPressed: {
    backgroundColor: '#FBF8F4',
  },
});