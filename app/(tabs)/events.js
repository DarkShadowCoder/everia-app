// app/(tabs)/events.js

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FlatList,
  Pressable,
  ScrollView,
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
import EventStatusBadge from '@/components/event/EventStatusBadge';

import { useAuthStore } from '@/store/authStore';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';

import { supabase } from '@/lib/supabase';
import { signedMediaUrl } from '@/lib/storage';

import {
  formatCompactNumber,
  formatEventDate,
} from '@/lib/format';

const FILTERS = [
  {
    value: 'all',
    label: 'Tous',
  },

  {
    value: 'active',
    label: 'Actifs',
  },

  {
    value: 'past',
    label: 'Passés',
  },

  {
    value: 'owner',
    label: 'Mes créations',
  },
];

export default function EventsList() {
  const [
    filter,
    setFilter,
  ] = useState('all');

  const user = useAuthStore(
    (state) => state.user
  );

  const {
    data: memberships,
    isLoading,
    refresh,
  } = useSupabaseQuery(
    async () => {
      if (!user) {
        return [];
      }

      const {
        data,
        error,
      } = await supabase
        .from('event_members')
        .select(
          'role, status, events(*)'
        )
        .eq(
          'user_id',
          user.id
        )
        .in(
          'status',
          [
            'joined',
            'invited',
          ]
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

      if (error) {
        throw error;
      }

      return (
        data || []
      ).filter(
        (item) =>
          item.events
      );
    },
    [user?.id]
  );

  const allEvents =
    memberships || [];

  const summary = useMemo(
    () => {
      const active =
        allEvents.filter(
          (item) =>
            [
              'live',
              'active',
            ].includes(
              item.events?.status
            )
        ).length;

      const past =
        allEvents.filter(
          (item) =>
            [
              'completed',
              'archived',
            ].includes(
              item.events?.status
            )
        ).length;

      const owned =
        allEvents.filter(
          (item) =>
            item.role === 'owner'
        ).length;

      const live =
        allEvents.find(
          (item) =>
            item.events?.status ===
            'live'
        );

      return {
        total:
          allEvents.length,
        active,
        past,
        owned,
        live,
      };
    },
    [allEvents]
  );

  const filtered =
    useMemo(
      () => {
        switch (filter) {
          case 'active':
            return allEvents.filter(
              (item) =>
                [
                  'live',
                  'active',
                ].includes(
                  item.events?.status
                )
            );

          case 'past':
            return allEvents.filter(
              (item) =>
                [
                  'completed',
                  'archived',
                ].includes(
                  item.events?.status
                )
            );

          case 'owner':
            return allEvents.filter(
              (item) =>
                item.role ===
                'owner'
            );

          default:
            return allEvents;
        }
      },
      [allEvents, filter]
    );

  const currentFilter =
    FILTERS.find(
      (item) =>
        item.value === filter
    );

  return (
    <ScreenContainer
      noPadding
      edges={['top']}
    >
      <StatusBar
        style="dark"
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) =>
          item.events.id
        }
        refreshing={isLoading}
        onRefresh={refresh}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.listContent
        }
        ListHeaderComponent={
          <View>
            <EventsHero
              summary={summary}
              onCreate={() =>
                router.push(
                  '/create-event'
                )
              }
              onJoin={() =>
                router.push(
                  '/join'
                )
              }
            />

            <View
              style={
                styles.sectionIntro
              }
            >
              <View
                style={
                  styles.sectionIntroCopy
                }
              >
                <Text
                  style={
                    styles.sectionEyebrow
                  }
                >
                  VOTRE UNIVERS
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Vos événements
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Retrouvez ici les moments que
                  vous organisez ou auxquels vous
                  participez.
                </Text>
              </View>

              {summary.total >
                0 && (
                <View
                  style={
                    styles.countBadge
                  }
                >
                  <Text
                    style={
                      styles.countBadgeValue
                    }
                  >
                    {formatCompactNumber(
                      summary.total
                    )}
                  </Text>

                  <Text
                    style={
                      styles.countBadgeLabel
                    }
                  >
                    total
                  </Text>
                </View>
              )}
            </View>

            <EventFilterBar
              value={filter}
              onChange={setFilter}
            />

            <View
              style={
                styles.resultsRow
              }
            >
              <Text
                style={
                  styles.resultsLabel
                }
              >
                {filtered.length ===
                1
                  ? '1 événement'
                  : `${formatCompactNumber(
                      filtered.length
                    )} événements`}
              </Text>

              <View
                style={
                  styles.resultsState
                }
              >
                <View
                  style={
                    styles.resultsDot
                  }
                />

                <Text
                  style={
                    styles.resultsStateText
                  }
                >
                  {currentFilter?.label ||
                    'Tous'}
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View
              style={
                styles.emptyCard
              }
            >
              <EmptyState
                icon="calendar-outline"
                title={
                  filter === 'all'
                    ? 'Votre espace est encore vide'
                    : `Aucun événement ${
                        currentFilter?.label?.toLowerCase() ||
                        'ici'
                      }`
                }
                subtitle="Créez votre premier événement ou rejoignez-en un avec son code pour commencer à créer des souvenirs."
                actionLabel={
                  filter ===
                  'all'
                    ? 'Rejoindre un événement'
                    : 'Voir tous les événements'
                }
                onAction={() => {
                  if (
                    filter ===
                    'all'
                  ) {
                    router.push(
                      '/join'
                    );
                  } else {
                    setFilter(
                      'all'
                    );
                  }
                }}
              />

              {filter ===
                'all' && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Créer un événement"
                  onPress={() =>
                    router.push(
                      '/create-event'
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.emptySecondaryAction,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="add-outline"
                    size={17}
                    color={
                      theme.colors.primary
                    }
                  />

                  <Text
                    style={
                      styles.emptySecondaryText
                    }
                  >
                    Créer un événement
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null
        }
        renderItem={({
          item,
          index,
        }) => (
          <EventListCard
            membership={item}
            featured={
              index === 0 &&
              filter !== 'past'
            }
            onPress={() =>
              router.push(
                `/event/${item.events.id}`
              )
            }
          />
        )}
      />
    </ScreenContainer>
  );
}

function EventsHero({
  summary,
  onCreate,
  onJoin,
}) {
  return (
    <LinearGradient
      colors={
        theme.gradients
          .darkLuxury
      }
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 1,
        y: 1,
      }}
      style={styles.hero}
    >
      <View
        style={
          styles.heroOrbLarge
        }
      />

      <View
        style={
          styles.heroOrbSmall
        }
      />

      <View
        style={
          styles.heroTopRow
        }
      >
        <View>
          <Text
            style={
              styles.heroEyebrow
            }
          >
            EVERIA
          </Text>

          <Text
            style={
              styles.heroTitle
            }
          >
            Moments & rencontres.
          </Text>
        </View>

        <View
          style={
            styles.heroLiveIndicator
          }
        >
          <View
            style={
              styles.heroLiveDot
            }
          />

          <Text
            style={
              styles.heroLiveText
            }
          >
            {summary.active >
            0
              ? 'ACTIF'
              : 'PRÊT'}
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.heroDescription
        }
      >
        Un espace unique pour retrouver, vivre et
        organiser vos événements les plus importants.
      </Text>

      <View
        style={
          styles.heroActions
        }
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Créer un événement"
          onPress={
            onCreate
          }
          style={({
            pressed,
          }) => [
            styles.primaryHeroAction,
            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="add-outline"
            size={18}
            color={
              theme.colors
                .primaryDark
            }
          />

          <Text
            style={
              styles.primaryHeroActionText
            }
          >
            Créer
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Rejoindre un événement"
          onPress={
            onJoin
          }
          style={({
            pressed,
          }) => [
            styles.secondaryHeroAction,
            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="qr-code-outline"
            size={17}
            color={
              theme.colors
                .white
            }
          />

          <Text
            style={
              styles.secondaryHeroActionText
            }
          >
            Rejoindre
          </Text>
        </Pressable>
      </View>

      <View
        style={
          styles.heroStats
        }
      >
        <HeroStat
          value={
            summary.total
          }
          label="événements"
          icon="calendar-outline"
        />

        <View
          style={
            styles.heroStatDivider
          }
        />

        <HeroStat
          value={
            summary.active
          }
          label="actifs"
          icon="pulse-outline"
        />

        <View
          style={
            styles.heroStatDivider
          }
        />

        <HeroStat
          value={
            summary.owned
          }
          label="organisés"
          icon="sparkles-outline"
        />
      </View>
    </LinearGradient>
  );
}

function HeroStat({
  value,
  label,
  icon,
}) {
  return (
    <View
      style={
        styles.heroStat
      }
    >
      <Ionicons
        name={icon}
        size={14}
        color={
          theme.colors
            .champagneLight
        }
      />

      <Text
        style={
          styles.heroStatValue
        }
      >
        {formatCompactNumber(
          value || 0
        )}
      </Text>

      <Text
        style={
          styles.heroStatLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function EventFilterBar({
  value,
  onChange,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={
        false
      }
      contentContainerStyle={
        styles.filterContent
      }
    >
      {FILTERS.map(
        (item) => {
          const active =
            item.value ===
            value;

          return (
            <Pressable
              key={
                item.value
              }
              accessibilityRole="button"
              accessibilityState={{
                selected:
                  active,
              }}
              accessibilityLabel={`Filtrer les événements : ${item.label}`}
              onPress={() =>
                onChange(
                  item.value
                )
              }
              style={({
                pressed,
              }) => [
                styles.filterPill,
                active &&
                  styles.filterPillActive,
                pressed &&
                  styles.filterPillPressed,
              ]}
            >
              {item.value ===
                'active' && (
                <View
                  style={[
                    styles.filterDot,
                    active &&
                      styles.filterDotActive,
                  ]}
                />
              )}

              <Text
                style={[
                  styles.filterText,
                  active &&
                    styles.filterTextActive,
                ]}
              >
                {
                  item.label
                }
              </Text>
            </Pressable>
          );
        }
      )}
    </ScrollView>
  );
}

function EventListCard({
  membership,
  onPress,
  featured = false,
}) {
  const event =
    membership.events;

  const [
    coverUrl,
    setCoverUrl,
  ] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadCover =
      async () => {
        if (
          !event?.cover_path
        ) {
          if (mounted) {
            setCoverUrl(
              null
            );
          }

          return;
        }

        const url =
          await signedMediaUrl(
            event.cover_path,
            {
              bucket:
                'event-covers',
              expiresIn:
                3600,
            }
          );

        if (mounted) {
          setCoverUrl(
            url
          );
        }
      };

    loadCover();

    return () => {
      mounted = false;
    };
  }, [
    event?.cover_path,
  ]);

  const typeSpec =
    theme.helpers.getEventType(
      event.category
    );

  const isLive =
    event.status ===
    'live';

  const isOwner =
    membership.role ===
    'owner';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir l'événement ${event.name}`}
      onPress={onPress}
      style={({
        pressed,
      }) => [
        styles.eventCard,
        featured &&
          styles.eventCardFeatured,
        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={
          styles.eventImageWrap
        }
      >
        {coverUrl ? (
          <Image
            source={{
              uri: coverUrl,
            }}
            style={
              styles.eventImage
            }
            contentFit="cover"
            transition={180}
          />
        ) : (
          <LinearGradient
            colors={
              theme.gradients
                .luxury
            }
            style={
              StyleSheet.absoluteFillObject
            }
          />
        )}

        <LinearGradient
          colors={[
            'rgba(27,11,29,0.00)',
            'rgba(27,11,29,0.28)',
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 0,
            y: 1,
          }}
          style={
            StyleSheet.absoluteFillObject
          }
        />

        <View
          style={
            styles.imageTopBadge
          }
        >
          <EventStatusBadge
            status={
              event.status
            }
            size="sm"
          />
        </View>

        {isLive && (
          <View
            style={
              styles.liveOverlayBadge
            }
          >
            <View
              style={
                styles.liveOverlayDot
              }
            />

            <Text
              style={
                styles.liveOverlayText
              }
            >
              EN DIRECT
            </Text>
          </View>
        )}

        <View
          style={
            styles.imageBottomIcon
          }
        >
          <Ionicons
            name={
              typeSpec.icon
            }
            size={14}
            color={
              theme.colors.white
            }
          />
        </View>
      </View>

      <View
        style={
          styles.eventBody
        }
      >
        <View
          style={
            styles.eventTopLine
          }
        >
          <Text
            style={
              styles.eventType
            }
            numberOfLines={
              1
            }
          >
            {
              typeSpec.label
            }
          </Text>

          {isOwner && (
            <View
              style={
                styles.ownerChip
              }
            >
              <Ionicons
                name="star-outline"
                size={10}
                color={
                  theme.colors
                    .champagneDark
                }
              />

              <Text
                style={
                  styles.ownerChipText
                }
              >
                Organisateur
              </Text>
            </View>
          )}
        </View>

        <Text
          style={
            styles.eventTitle
          }
          numberOfLines={
            2
          }
        >
          {
            event.name
          }
        </Text>

        <View
          style={
            styles.eventMetaRow
          }
        >
          <Ionicons
            name="calendar-outline"
            size={13}
            color={
              theme.colors
                .textMuted
            }
          />

          <Text
            style={
              styles.eventMeta
            }
            numberOfLines={
              1
            }
          >
            {formatEventDate(
              event.start_at
            )}
          </Text>
        </View>

        {!!event.venue_name && (
          <View
            style={
              styles.eventMetaRow
            }
          >
            <Ionicons
              name="location-outline"
              size={13}
              color={
                theme.colors
                  .textMuted
              }
            />

            <Text
              style={
                styles.eventMeta
              }
              numberOfLines={
                1
              }
            >
              {
                event.venue_name
              }
            </Text>
          </View>
        )}

        <View
          style={
            styles.eventFooter
          }
        >
          <Text
            style={
              styles.eventFooterText
            }
          >
            {featured &&
            isLive
              ? 'Profitez du moment en direct'
              : 'Ouvrir l’événement'}
          </Text>

          <View
            style={
              styles.eventArrow
            }
          >
            <Ionicons
              name="arrow-forward"
              size={15}
              color={
                theme.colors
                  .primary
              }
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 116,
  },

  hero: {
    minHeight: 320,
    paddingTop:
      theme.spacing.xl,
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingBottom:
      theme.spacing.xxl,
    position: 'relative',
    overflow: 'hidden',
  },

  heroOrbLarge: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    top: -165,
    right: -55,
    backgroundColor:
      'rgba(217,184,120,0.10)',
  },

  heroOrbSmall: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    bottom: -130,
    left: -85,
    backgroundColor:
      'rgba(147,101,150,0.14)',
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    justifyContent:
      'space-between',
  },

  heroEyebrow: {
    color:
      theme.colors.champagne,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing:
      theme.typography.letterSpacing.luxury,
  },

  heroTitle: {
    color:
      theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 29,
    lineHeight: 35,
    marginTop: 3,
    maxWidth: 260,
  },

  heroLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius:
      theme.radius.pill,
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.11)',
  },

  heroLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
    backgroundColor:
      theme.colors.eventLive,
  },

  heroLiveText: {
    color:
      theme.colors.white,
    opacity: 0.76,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 8,
    letterSpacing: 1.1,
  },

  heroDescription: {
    color:
      theme.colors.white,
    opacity: 0.7,
    fontFamily:
      theme.typography.families.body,
    fontSize: 12.5,
    lineHeight: 19,
    maxWidth: 330,
    marginTop:
      theme.spacing.md,
  },

  heroActions: {
    flexDirection: 'row',
    marginTop:
      theme.spacing.xl,
    gap:
      theme.spacing.sm,
  },

  primaryHeroAction: {
    minHeight: 44,
    paddingHorizontal: 17,
    borderRadius:
      theme.radius.buttonLarge,
    backgroundColor:
      theme.colors.champagne,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  primaryHeroActionText: {
    color:
      theme.colors.primaryDark,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 12,
  },

  secondaryHeroAction: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius:
      theme.radius.buttonLarge,
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  secondaryHeroActionText: {
    color:
      theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 12,
  },

  heroStats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop:
      theme.spacing.xl,
    paddingVertical:
      theme.spacing.md,
    paddingHorizontal:
      theme.spacing.xs,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
  },

  heroStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroStatValue: {
    color:
      theme.colors.white,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 17,
    lineHeight: 21,
    marginTop: 3,
  },

  heroStatLabel: {
    color:
      theme.colors.white,
    opacity: 0.53,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 13,
    marginTop: 1,
  },

  heroStatDivider: {
    width: 1,
    backgroundColor:
      'rgba(255,255,255,0.10)',
  },

  sectionIntro: {
    flexDirection: 'row',
    alignItems:
      'flex-end',
    justifyContent:
      'space-between',
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingTop:
      theme.spacing.xxxl,
    paddingBottom:
      theme.spacing.lg,
  },

  sectionIntroCopy: {
    flex: 1,
    paddingRight:
      theme.spacing.md,
  },

  sectionEyebrow: {
    color:
      theme.colors.textGold,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing:
      theme.typography.letterSpacing.uppercase,
  },

  sectionTitle: {
    color:
      theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
  },

  sectionSubtitle: {
    color:
      theme.colors.textSecondary,
    fontFamily:
      theme.typography.families.body,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 4,
    maxWidth: 330,
  },

  countBadge: {
    minWidth: 53,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.primarySoft,
    borderWidth: 1,
    borderColor:
      'rgba(91,49,93,0.08)',
  },

  countBadgeValue: {
    color:
      theme.colors.primary,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 13,
    lineHeight: 16,
  },

  countBadgeLabel: {
    color:
      theme.colors.primary,
    opacity: 0.62,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 8.5,
    lineHeight: 11,
    marginTop: 1,
  },

  filterContent: {
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingBottom:
      theme.spacing.md,
    gap:
      theme.spacing.sm,
  },

  filterPill: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius:
      theme.radius.pill,
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterPillActive: {
    backgroundColor:
      theme.colors.primary,
    borderColor:
      theme.colors.primary,
  },

  filterPillPressed: {
    opacity: 0.76,
  },

  filterText: {
    color:
      theme.colors.textSecondary,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11,
  },

  filterTextActive: {
    color:
      theme.colors.white,
  },

  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.eventLiveSoft,
    marginRight: 6,
  },

  filterDotActive: {
    backgroundColor:
      theme.colors.champagneLight,
  },

  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingHorizontal:
      theme.layout.screenHorizontal,
    marginBottom:
      theme.spacing.md,
  },

  resultsLabel: {
    color:
      theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11,
  },

  resultsState: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  resultsDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor:
      theme.colors.champagneDark,
    marginRight: 5,
  },

  resultsStateText: {
    color:
      theme.colors.textMuted,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
  },

  /*
   * IMPORTANT :
   * hauteur fixe de la carte.
   *
   * Avant :
   *   minHeight: 154
   *
   * Avec une image en height:100%, le système de layout
   * pouvait laisser la hauteur du conteneur se déterminer
   * de manière indésirable.
   */
  eventCard: {
    height: 154,
    marginHorizontal:
      theme.layout.screenHorizontal,
    marginBottom:
      theme.spacing.md,
    padding:
      theme.spacing.sm,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    ...theme.shadows.sm,
  },

  eventCardFeatured: {
    borderColor:
      theme.colors.primaryMuted,
    shadowOpacity: 0.09,
    elevation: 3,
  },

  /*
   * IMPORTANT :
   * dimensions fixes de la miniature.
   */
  eventImageWrap: {
    width: 116,
    height: 136,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'center',
    borderRadius:
      theme.radius.lg,
    overflow: 'hidden',
    backgroundColor:
      theme.colors.primaryDark,
    position: 'relative',
  },

  eventImage: {
    ...StyleSheet.absoluteFillObject,
  },

  imageTopBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },

  liveOverlayBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius:
      theme.radius.pill,
    backgroundColor:
      'rgba(28,12,30,0.72)',
  },

  liveOverlayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor:
      theme.colors.eventLive,
    marginRight: 5,
  },

  liveOverlayText: {
    color:
      theme.colors.white,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 7,
    letterSpacing: 0.8,
  },

  imageBottomIcon: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 25,
    height: 25,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(27,11,29,0.54)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.11)',
  },

  eventBody: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal:
      theme.spacing.md,
    paddingVertical:
      theme.spacing.xs,
  },

  eventTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    minHeight: 20,
  },

  eventType: {
    flex: 1,
    color:
      theme.colors.textGold,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8.5,
    lineHeight: 12,
    textTransform:
      'uppercase',
    letterSpacing: 0.8,
    marginRight: 6,
  },

  ownerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius:
      theme.radius.pill,
    backgroundColor:
      theme.colors.champagnePale,
  },

  ownerChipText: {
    color:
      theme.colors.champagneDark,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7,
    marginLeft: 3,
  },

  eventTitle: {
    color:
      theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 17,
    lineHeight: 22,
    marginTop: 3,
  },

  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    marginTop: 5,
  },

  eventMeta: {
    flex: 1,
    color:
      theme.colors.textSecondary,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    marginLeft: 5,
  },

  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginTop: 'auto',
    paddingTop: 7,
  },

  eventFooterText: {
    flex: 1,
    color:
      theme.colors.textMuted,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 9,
    lineHeight: 13,
    marginRight: 8,
  },

  eventArrow: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.primarySoft,
  },

  emptyCard: {
    marginHorizontal:
      theme.layout.screenHorizontal,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },

  emptySecondaryAction: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:
      -theme.spacing.sm,
    marginBottom:
      theme.spacing.xl,
    paddingHorizontal:
      theme.spacing.lg,
    minHeight: 40,
    borderRadius:
      theme.radius.button,
    backgroundColor:
      theme.colors.primarySoft,
  },

  emptySecondaryText: {
    color:
      theme.colors.primary,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11.5,
    marginLeft: 5,
  },

  pressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});