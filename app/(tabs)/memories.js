
// app/(tabs)/memories.js
// ------------------------------------------------------------
// "Mes Souvenirs" : archive personnelle des événements terminés,
// présentée comme une timeline éditoriale premium avec accès rapide
// au Best Of / Replay de chaque événement.
// ------------------------------------------------------------

import React, { useMemo } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import theme from '@/theme';
import ScreenContainer from '@/components/ui/ScreenContainer';
import EmptyState from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { publicMediaUrl } from '@/lib/storage';
import { formatShortDate } from '@/lib/format';

export default function MyMemories() {
  const { user } = useAuthStore();

  const {
    data: memberships,
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
            ['completed', 'archived'].includes(event.status)
        );
    },
    [user?.id]
  );

  const sections = useMemo(() => {
    const groups = {};

    (memberships || []).forEach((event) => {
      const year = event.start_at
        ? String(new Date(event.start_at).getFullYear())
        : 'Sans date';

      if (!groups[year]) {
        groups[year] = [];
      }

      groups[year].push(event);
    });

    return Object.keys(groups)
      .sort((a, b) => {
        if (a === 'Sans date') return 1;
        if (b === 'Sans date') return -1;

        return Number(b) - Number(a);
      })
      .map((year) => ({
        title: year,
        data: groups[year].sort(
          (a, b) =>
            new Date(b.start_at || 0).getTime() -
            new Date(a.start_at || 0).getTime()
        ),
      }));
  }, [memberships]);

  const summary = useMemo(() => {
    const events = memberships || [];

    const latest = [...events].sort(
      (a, b) =>
        new Date(b.start_at || 0).getTime() -
        new Date(a.start_at || 0).getTime()
    )[0];

    const years = new Set(
      events
        .filter((event) => event.start_at)
        .map((event) =>
          new Date(event.start_at).getFullYear()
        )
    );

    return {
      total: events.length,
      years: years.size,
      latest,
    };
  }, [memberships]);

  return (
    <ScreenContainer noPadding edges={['top']}>
      <StatusBar style="dark" />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <MemoriesHero summary={summary} />

            <View style={styles.introBlock}>
              <View style={styles.introCopy}>
                <Text style={styles.eyebrow}>
                  VOTRE HISTOIRE
                </Text>

                <Text style={styles.pageTitle}>
                  Des moments à revivre.
                </Text>

                <Text style={styles.pageSubtitle}>
                  Chaque événement terminé devient une archive
                  vivante : vos souvenirs, votre point de vue et
                  les meilleurs instants.
                </Text>
              </View>

              {summary.latest && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ouvrir le dernier souvenir ${summary.latest.name}`}
                  onPress={() =>
                    router.push(
                      `/event/${summary.latest.id}/replay`
                    )
                  }
                  style={({ pressed }) => [
                    styles.latestButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="play"
                    size={14}
                    color={theme.colors.white}
                  />

                  <Text style={styles.latestButtonText}>
                    Dernier Replay
                  </Text>
                </Pressable>
              )}
            </View>

            {summary.total > 0 && (
              <MemoryOverview summary={summary} />
            )}

            {summary.total > 0 && (
              <View style={styles.timelineHeader}>
                <View>
                  <Text style={styles.timelineEyebrow}>
                    ARCHIVE
                  </Text>

                  <Text style={styles.timelineTitle}>
                    Votre timeline
                  </Text>
                </View>

                <View style={styles.archiveBadge}>
                  <Ionicons
                    name="sparkles-outline"
                    size={13}
                    color={theme.colors.champagneDark}
                  />

                  <Text style={styles.archiveBadgeText}>
                    {summary.total === 1
                      ? '1 souvenir'
                      : `${summary.total} souvenirs`}
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.yearRow}>
            <View style={styles.yearLine} />

            <View style={styles.yearPill}>
              <Text style={styles.yearText}>
                {section.title}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyCard}>
              <EmptyState
                icon="images-outline"
                title="Votre histoire commence ici"
                subtitle="Vos événements passés apparaîtront ici une fois terminés, avec leur Best Of et votre Replay."
              />

              <View style={styles.emptyHint}>
                <View style={styles.emptyHintIcon}>
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.emptyHintText}>
                  Après chaque événement, Everia conserve les
                  moments qui méritent d’être revécus.
                </Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item, index, section }) => (
          <MemoryCard
            event={item}
            isFirst={index === 0}
            isLast={index === section.data.length - 1}
            onPress={() =>
              router.push(`/event/${item.id}/replay`)
            }
          />
        )}
      />
    </ScreenContainer>
  );
}

function MemoriesHero({ summary }) {
  return (
    <LinearGradient
      colors={theme.gradients.darkLuxury}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroOrbTop} />
      <View style={styles.heroOrbBottom} />

      <View style={styles.heroTopRow}>
        <View>
          <Text style={styles.heroEyebrow}>
            EVERIA
          </Text>

          <Text style={styles.heroTitle}>
            Mes Souvenirs
          </Text>
        </View>

        <View style={styles.heroIconButton}>
          <Ionicons
            name="images-outline"
            size={19}
            color={theme.colors.champagneLight}
          />
        </View>
      </View>

      <View style={styles.heroQuoteWrap}>
        <Text style={styles.heroQuoteMark}>
          “
        </Text>

        <Text style={styles.heroQuote}>
          Les grands événements se terminent.
          {'\n'}
          Les beaux souvenirs restent.
        </Text>
      </View>

      <View style={styles.heroMiniStats}>
        <HeroMiniStat
          icon="albums-outline"
          value={summary.total}
          label="souvenirs"
        />

        <View style={styles.heroDivider} />

        <HeroMiniStat
          icon="calendar-clear-outline"
          value={summary.years}
          label="années"
        />

        <View style={styles.heroDivider} />

        <HeroMiniStat
          icon="play-circle-outline"
          value={summary.total > 0 ? 'Replay' : '—'}
          label="à revivre"
          compact
        />
      </View>
    </LinearGradient>
  );
}

function HeroMiniStat({
  icon,
  value,
  label,
  compact = false,
}) {
  return (
    <View style={styles.heroMiniStat}>
      <Ionicons
        name={icon}
        size={14}
        color={theme.colors.champagneLight}
      />

      <Text
        style={[
          styles.heroMiniValue,
          compact && styles.heroMiniValueCompact,
        ]}
      >
        {value}
      </Text>

      <Text style={styles.heroMiniLabel}>
        {label}
      </Text>
    </View>
  );
}

function MemoryOverview({ summary }) {
  return (
    <View style={styles.overviewCard}>
      <View style={styles.overviewIcon}>
        <Ionicons
          name="infinite-outline"
          size={20}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.overviewCopy}>
        <Text style={styles.overviewTitle}>
          Une collection qui grandit avec vous
        </Text>

        <Text style={styles.overviewText}>
          {summary.total === 1
            ? 'Votre premier moment est déjà conservé. Continuez à vivre les prochains, Everia s’occupe du reste.'
            : `${summary.total} événements font déjà partie de votre histoire Everia.`}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={theme.colors.textMuted}
      />
    </View>
  );
}

function MemoryCard({
  event,
  isFirst,
  isLast,
  onPress,
}) {
  const cover = publicMediaUrl(event.cover_path);

  const typeSpec = theme.helpers.getEventType(
    event.category
  );

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineRail}>
        <View
          style={[
            styles.timelineDot,
            isFirst && styles.timelineDotFirst,
          ]}
        >
          <View style={styles.timelineDotInner} />
        </View>

        {!isLast && (
          <View style={styles.timelineConnector} />
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Revivre le souvenir ${event.name}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.memoryCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.memoryImageWrap}>
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={styles.memoryImage}
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
              'rgba(27,11,29,0.00)',
              'rgba(27,11,29,0.54)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.memoryImageType}>
            <Ionicons
              name={typeSpec.icon}
              size={12}
              color={theme.colors.white}
            />
          </View>

          <View style={styles.memoryReplayTag}>
            <Ionicons
              name="play"
              size={9}
              color={theme.colors.primaryDark}
            />

            <Text style={styles.memoryReplayText}>
              REPLAY
            </Text>
          </View>
        </View>

        <View style={styles.memoryBody}>
          <View style={styles.memoryMetaTop}>
            <Text style={styles.memoryDate}>
              {formatShortDate(event.start_at)}
            </Text>

            <View style={styles.memoryCategory}>
              <Text
                style={styles.memoryCategoryText}
                numberOfLines={1}
              >
                {typeSpec.label}
              </Text>
            </View>
          </View>

          <Text
            style={styles.memoryTitle}
            numberOfLines={2}
          >
            {event.name}
          </Text>

          {!!event.venue_name && (
            <View style={styles.memoryVenueRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={theme.colors.textMuted}
              />

              <Text
                style={styles.memoryVenue}
                numberOfLines={1}
              >
                {event.venue_name}
              </Text>
            </View>
          )}

          <View style={styles.memoryFooter}>
            <View style={styles.memoryFooterCopy}>
              <Text style={styles.memoryFooterEyebrow}>
                À REVIVRE
              </Text>

              <Text style={styles.memoryFooterTitle}>
                Voir les meilleurs instants
              </Text>
            </View>

            <View style={styles.memoryArrow}>
              <Ionicons
                name="arrow-up-outline"
                size={15}
                color={theme.colors.primary}
              />
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 116,
  },

  hero: {
    minHeight: 332,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.layout.screenHorizontal,
    paddingBottom: theme.spacing.xxl,
    position: 'relative',
    overflow: 'hidden',
  },

  heroOrbTop: {
    position: 'absolute',
    width: 245,
    height: 245,
    borderRadius: 123,
    top: -160,
    right: -55,
    backgroundColor: 'rgba(217,184,120,0.10)',
  },

  heroOrbBottom: {
    position: 'absolute',
    width: 205,
    height: 205,
    borderRadius: 103,
    bottom: -145,
    left: -90,
    backgroundColor: 'rgba(147,101,150,0.15)',
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  heroEyebrow: {
    color: theme.colors.champagne,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing:
      theme.typography.letterSpacing.luxury,
  },

  heroTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 31,
    lineHeight: 37,
    marginTop: 2,
  },

  heroIconButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroQuoteWrap: {
    marginTop: theme.spacing.xxl,
    paddingLeft: theme.spacing.sm,
    position: 'relative',
  },

  heroQuoteMark: {
    position: 'absolute',
    top: -17,
    left: -1,
    color: theme.colors.champagne,
    opacity: 0.34,
    fontFamily: theme.typography.families.display,
    fontSize: 58,
    lineHeight: 62,
  },

  heroQuote: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displayMedium,
    fontSize: 20,
    lineHeight: 29,
    maxWidth: 335,
  },

  heroMiniStats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.cardLarge,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  heroMiniStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroMiniValue: {
    color: theme.colors.white,
    fontFamily: theme.typography.families.bodyBold,
    fontSize: 17,
    lineHeight: 21,
    marginTop: 3,
  },

  heroMiniValueCompact: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 7,
  },

  heroMiniLabel: {
    color: theme.colors.white,
    opacity: 0.53,
    fontFamily: theme.typography.families.body,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 1,
  },

  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  introBlock: {
    paddingHorizontal: theme.layout.screenHorizontal,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  introCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },

  eyebrow: {
    color: theme.colors.textGold,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing:
      theme.typography.letterSpacing.uppercase,
  },

  pageTitle: {
    color: theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
  },

  pageSubtitle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.families.body,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 5,
    maxWidth: 335,
  },

  latestButton: {
    minHeight: 39,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    ...theme.shadows.sm,
  },

  latestButtonText: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9.5,
  },

  overviewCard: {
    marginHorizontal: theme.layout.screenHorizontal,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
    borderRadius: theme.radius.cardLarge,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },

  overviewIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  overviewCopy: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },

  overviewTitle: {
    color: theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
  },

  overviewText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 3,
  },

  timelineHeader: {
    marginHorizontal: theme.layout.screenHorizontal,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  timelineEyebrow: {
    color: theme.colors.textGold,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing:
      theme.typography.letterSpacing.uppercase,
  },

  timelineTitle: {
    color: theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 1,
  },

  archiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    paddingHorizontal: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.champagnePale,
    borderWidth: 1,
    borderColor: 'rgba(184,143,77,0.12)',
  },

  archiveBadgeText: {
    color: theme.colors.champagneDark,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8.5,
    marginLeft: 4,
  },

  yearRow: {
    marginHorizontal: theme.layout.screenHorizontal,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  yearLine: {
    width: 22,
    height: 1,
    backgroundColor: theme.colors.champagne,
    marginRight: 8,
  },

  yearPill: {
    minHeight: 29,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.backgroundWarm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  yearText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.families.bodyBold,
    fontSize: 10.5,
  },

  timelineItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.layout.screenHorizontal,
  },

  timelineRail: {
    width: 25,
    alignItems: 'center',
    position: 'relative',
  },

  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  timelineDotFirst: {
    borderColor: theme.colors.champagne,
  },

  timelineDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.champagne,
  },

  timelineConnector: {
    position: 'absolute',
    top: 32,
    bottom: -16,
    width: 1,
    backgroundColor: theme.colors.border,
  },

  memoryCard: {
    flex: 1,
    borderRadius: theme.radius.cardLarge,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },

  memoryImageWrap: {
    height: 142,
    backgroundColor: theme.colors.primaryDark,
    position: 'relative',
    overflow: 'hidden',
  },

  memoryImage: {
    width: '100%',
    height: '100%',
  },

  memoryImageType: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(27,11,29,0.54)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  memoryReplayTag: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    minHeight: 26,
    paddingHorizontal: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.champagne,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  memoryReplayText: {
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.families.bodyBold,
    fontSize: 7.5,
    letterSpacing: 0.9,
    marginLeft: 4,
  },

  memoryBody: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },

  memoryMetaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  memoryDate: {
    color: theme.colors.textGold,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9,
    lineHeight: 13,
  },

  memoryCategory: {
    maxWidth: 110,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
  },

  memoryCategoryText: {
    color: theme.colors.textMuted,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  },

  memoryTitle: {
    color: theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 19,
    lineHeight: 24,
    marginTop: 4,
  },

  memoryVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  memoryVenue: {
    flex: 1,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    marginLeft: 4,
  },

  memoryFooter: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  memoryFooterCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },

  memoryFooterEyebrow: {
    color: theme.colors.textGold,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.9,
  },

  memoryFooterTitle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.families.bodyMedium,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 1,
  },

  memoryArrow: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    marginHorizontal: theme.layout.screenHorizontal,
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.cardLarge,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },

  emptyHint: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
  },

  emptyHintIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },

  emptyHintText: {
    flex: 1,
    color: theme.colors.primary,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 9.5,
    lineHeight: 14,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
