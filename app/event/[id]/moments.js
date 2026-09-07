// app/event/[id]/moments.js
// ============================================================
// EVERIA — Moments
// ============================================================

import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Image,
} from 'expo-image';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import theme from '@/theme';

import Header from '@/components/ui/Header';

import EmptyState from '@/components/ui/EmptyState';

import {
  useSupabaseQuery,
} from '@/hooks/useSupabaseQuery';

import {
  supabase,
} from '@/lib/supabase';

import {
  mediaThumbnail,
} from '@/lib/storage';

import {
  formatTime,
} from '@/lib/format';

import {
  refreshEventStory,
} from '@/lib/storyEngine';

// ============================================================
// HELPERS
// ============================================================

function normalizeParam(
  value
) {
  if (
    Array.isArray(
      value
    )
  ) {
    return value[0];
  }

  return value;
}

function mediaCountOf(
  moment
) {
  const relation =
    moment?.moment_media;

  if (
    Array.isArray(
      relation
    )
  ) {
    return Number(
      relation[0]?.count ||
        0
    );
  }

  return Number(
    relation?.count ||
      moment?.media_count ||
      0
  );
}

// ============================================================
// HERO STAT
// ============================================================

function HeroStat({
  icon,
  value,
  label,
}) {
  return (
    <View
      style={
        styles.heroStat
      }
    >
      <View
        style={
          styles.heroStatIcon
        }
      >
        <Ionicons
          name={
            icon
          }
          size={
            15
          }
          color={
            theme.colors
              .champagneLight
          }
        />
      </View>

      <View>
        <Text
          style={
            styles.heroStatValue
          }
        >
          {value}
        </Text>

        <Text
          style={
            styles.heroStatLabel
          }
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// MOMENT CARD
// ============================================================

function MomentCard({
  moment,
  index,
  isLast,
  onPress,
}) {
  const cover =
    moment?.media
      ? mediaThumbnail(
          moment.media
        )
      : null;

  const count =
    mediaCountOf(
      moment
    );

  return (
    <View
      style={
        styles.timelineRow
      }
    >
      <View
        style={
          styles.timelineRail
        }
      >
        <View
          style={
            styles.timelineDotOuter
          }
        >
          <View
            style={
              styles.timelineDot
            }
          />
        </View>

        {!isLast && (
          <View
            style={
              styles.timelineLine
            }
          />
        )}
      </View>

      <Pressable
        onPress={
          onPress
        }
        style={({
          pressed,
        }) => [
          styles.timelineCard,

          pressed &&
            styles.pressed,
        ]}
      >
        <View
          style={
            styles.imageWrap
          }
        >
          {cover ? (
            <Image
              source={{
                uri:
                  cover,
              }}
              style={
                StyleSheet.absoluteFillObject
              }
              contentFit="cover"
              transition={
                180
              }
            />
          ) : (
            <LinearGradient
              colors={
                theme.gradients
                  .darkCard
              }
              style={
                StyleSheet.absoluteFillObject
              }
            />
          )}

          <View
            style={
              styles.imageOverlay
            }
          />

          {count >
            1 && (
            <View
              style={
                styles.mediaBadge
              }
            >
              <Ionicons
                name="images-outline"
                size={
                  11
                }
                color={
                  theme.colors
                    .white
                }
              />

              <Text
                style={
                  styles.mediaBadgeText
                }
              >
                {count}
              </Text>
            </View>
          )}
        </View>

        <View
          style={
            styles.content
          }
        >
          <View
            style={
              styles.topRow
            }
          >
            <Text
              style={
                styles.time
              }
            >
              {moment?.starts_at
                ? formatTime(
                    moment.starts_at
                  )
                : ''}
            </Text>

            <Ionicons
              name="chevron-forward"
              size={
                16
              }
              color={
                theme.colors
                  .white40
              }
            />
          </View>

          <Text
            style={
              styles.title
            }
            numberOfLines={
              2
            }
          >
            {moment?.title ||
              'Moment partagé'}
          </Text>

          <View
            style={
              styles.metaRow
            }
          >
            <Text
              style={
                styles.meta
              }
            >
              {count}{' '}
              {count >
              1
                ? 'médias'
                : 'média'}
            </Text>

            <Text
              style={
                styles.index
              }
            >
              #{index + 1}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ============================================================
// SCREEN
// ============================================================

export default function EventMoments() {
  const params =
    useLocalSearchParams();

  const id =
    normalizeParam(
      params.id
    );

  const [
    generating,
    setGenerating,
  ] =
    useState(
      false
    );

  const {
    data: moments,
    isLoading,
    refresh,
  } =
    useSupabaseQuery(
      async () => {
        if (
          !id
        ) {
          return [];
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'moments'
            )
            .select(
              `
                *,
                media:representative_media_id(*),
                moment_media(count)
              `
            )
            .eq(
              'event_id',
              id
            )
            .order(
              'starts_at',
              {
                ascending:
                  true,
              }
            );

        if (
          error
        ) {
          throw error;
        }

        return (
          data ||
          []
        ).map(
          (
            moment
          ) => ({
            ...moment,

            media_count:
              mediaCountOf(
                moment
              ),
          })
        );
      },
      [id]
    );

  const safeMoments =
    moments ||
    [];

  const totalMedia =
    useMemo(
      () =>
        safeMoments.reduce(
          (
            total,
            moment
          ) =>
            total +
            mediaCountOf(
              moment
            ),
          0
        ),
      [safeMoments]
    );

  const featured =
    useMemo(
      () =>
        [
          ...safeMoments,
        ]
          .sort(
            (
              a,
              b
            ) =>
              Number(
                b.confidence ||
                  0
              ) -
              Number(
                a.confidence ||
                  0
              )
          )
          .slice(
            0,
            3
          ),
      [safeMoments]
    );

  // ==========================================================
  // GENERATE
  // ==========================================================

  const generate =
    useCallback(
      async () => {
        if (
          !id ||
          generating
        ) {
          return;
        }

        setGenerating(
          true
        );

        try {
          await refreshEventStory(
            id
          );

          await refresh();

          Alert.alert(
            'Timeline actualisée',
            'Everia a recalculé les Moments et le Best Of de votre événement.'
          );
        } catch (
          error
        ) {
          Alert.alert(
            'Erreur',
            error?.message ||
              'Impossible de recalculer la timeline.'
          );
        } finally {
          setGenerating(
            false
          );
        }
      },
      [
        id,
        generating,
        refresh,
      ]
    );

  return (
    <View
      style={
        styles.screen
      }
    >
      <Header
        title="Moments"
        subtitle="Timeline intelligente"
        dark
        rightActions={[
          {
            icon:
              'sparkles-outline',

            onPress:
              generate,
          },

          {
            icon:
              'play-circle-outline',

            onPress:
              () =>
                router.push(
                  `/event/${id}/replay`
                ),
          },
        ]}
      />

      <FlatList
        data={
          safeMoments
        }
        keyExtractor={
          (
            item
          ) =>
            item.id
        }
        refreshing={
          isLoading ||
          generating
        }
        onRefresh={
          refresh
        }
        refreshControl={
          <RefreshControl
            refreshing={
              isLoading ||
              generating
            }
            onRefresh={
              refresh
            }
            tintColor={
              theme.colors
                .champagneLight
            }
          />
        }
        contentContainerStyle={{
          paddingHorizontal:
            theme.layout
              .screenHorizontal,

          paddingBottom:
            48,
        }}
        showsVerticalScrollIndicator={
          false
        }
        ListHeaderComponent={
          <View>
            <View
              style={
                styles.hero
              }
            >
              <LinearGradient
                colors={
                  theme.gradients
                    .darkLuxury
                }
                style={
                  StyleSheet.absoluteFillObject
                }
              />

              <View
                style={
                  styles.pill
                }
              >
                <Ionicons
                  name="sparkles-outline"
                  size={
                    12
                  }
                  color={
                    theme.colors
                      .primaryDeep
                  }
                />

                <Text
                  style={
                    styles.pillText
                  }
                >
                  EVERIA AI
                </Text>
              </View>

              <Text
                style={
                  styles.heroTitle
                }
              >
                Les moments
                qui donnent
                du sens à
                l’événement.
              </Text>

              <Text
                style={
                  styles.heroDescription
                }
              >
                Everia regroupe automatiquement
                les souvenirs qui appartiennent
                au même moment.
              </Text>

              <View
                style={
                  styles.heroStats
                }
              >
                <HeroStat
                  icon="sparkles-outline"
                  value={
                    safeMoments.length
                  }
                  label="moments"
                />

                <View
                  style={
                    styles.statDivider
                  }
                />

                <HeroStat
                  icon="images-outline"
                  value={
                    totalMedia
                  }
                  label="médias"
                />
              </View>
            </View>

            {generating && (
              <View
                style={
                  styles.generating
                }
              >
                <ActivityIndicator
                  size="small"
                  color={
                    theme.colors
                      .primary
                  }
                />

                <Text
                  style={
                    styles.generatingText
                  }
                >
                  Everia reconstruit
                  votre narration…
                </Text>
              </View>
            )}

            {featured.length >
              0 && (
              <View
                style={
                  styles.featuredSection
                }
              >
                <Text
                  style={
                    styles.eyebrow
                  }
                >
                  TEMPS FORTS
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  À la une
                </Text>

                <FlatList
                  horizontal
                  data={
                    featured
                  }
                  keyExtractor={
                    (
                      item
                    ) =>
                      `featured-${item.id}`
                  }
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={{
                    gap:
                      12,

                    marginTop:
                      13,
                  }}
                  renderItem={({
                    item,
                  }) => {
                    const cover =
                      item?.media
                        ? mediaThumbnail(
                            item.media
                          )
                        : null;

                    return (
                      <Pressable
                        onPress={() =>
                          router.push(
                            `/event/${id}/moment/${item.id}`
                          )
                        }
                        style={
                          styles.featuredCard
                        }
                      >
                        {cover ? (
                          <Image
                            source={{
                              uri:
                                cover,
                            }}
                            style={
                              StyleSheet.absoluteFillObject
                            }
                            contentFit="cover"
                          />
                        ) : (
                          <LinearGradient
                            colors={
                              theme.gradients
                                .darkCard
                            }
                            style={
                              StyleSheet.absoluteFillObject
                            }
                          />
                        )}

                        <LinearGradient
                          colors={[
                            'rgba(20,7,22,0)',
                            'rgba(20,7,22,0.90)',
                          ]}
                          style={
                            StyleSheet.absoluteFillObject
                          }
                        />

                        <View
                          style={
                            styles.featuredContent
                          }
                        >
                          <Text
                            style={
                              styles.featuredTime
                            }
                          >
                            {item?.starts_at
                              ? formatTime(
                                  item.starts_at
                                )
                              : ''}
                          </Text>

                          <Text
                            style={
                              styles.featuredTitle
                            }
                            numberOfLines={
                              2
                            }
                          >
                            {item?.title ||
                              'Moment'}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  }}
                />
              </View>
            )}

            {safeMoments.length >
              0 && (
              <View
                style={
                  styles.timelineHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.eyebrow
                    }
                  >
                    CHRONOLOGIE
                  </Text>

                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Tous les moments
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading &&
          !generating ? (
            <EmptyState
              dark
              icon="sparkles-outline"
              title="Aucun moment pour le moment"
              subtitle="Everia construira automatiquement les Moments dès que suffisamment de médias seront prêts."
            />
          ) : null
        }
        renderItem={({
          item,
          index,
        }) => (
          <MomentCard
            moment={
              item
            }
            index={
              index
            }
            isLast={
              index ===
              safeMoments.length -
                1
            }
            onPress={() =>
              router.push(
                `/event/${id}/moment/${item.id}`
              )
            }
          />
        )}
      />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        theme.screens
          .moment,
    },

    hero: {
      borderRadius:
        26,

      padding:
        22,

      minHeight:
        340,

      marginBottom:
        20,

      overflow:
        'hidden',
    },

    pill: {
      alignSelf:
        'flex-start',

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        6,

      backgroundColor:
        'rgba(255,255,255,0.12)',

      paddingHorizontal:
        11,

      paddingVertical:
        7,

      borderRadius:
        99,
    },

    pillText: {
      color:
        theme.colors
          .white,

      fontFamily:
        theme.typography
          .families
          .bodySemiBold,

      fontSize:
        9,

      letterSpacing:
        1.2,
    },

    heroTitle: {
      color:
        theme.colors
          .white,

      fontFamily:
        theme.typography
          .families
          .displaySemiBold,

      fontSize:
        30,

      lineHeight:
        35,

      marginTop:
        35,
    },

    heroDescription: {
      color:
        theme.colors
          .white60,

      fontFamily:
        theme.typography
          .families
          .body,

      fontSize:
        12,

      lineHeight:
        19,

      marginTop:
        10,
    },

    heroStats: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginTop:
        24,
    },

    heroStat: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        8,
    },

    heroStatIcon: {
      width:
        30,

      height:
        30,

      borderRadius:
        15,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(255,255,255,0.10)',
    },

    heroStatValue: {
      color:
        theme.colors
          .white,

      fontFamily:
        theme.typography
          .families
          .displaySemiBold,

      fontSize:
        16,
    },

    heroStatLabel: {
      color:
        theme.colors
          .white50,

      fontFamily:
        theme.typography
          .families
          .body,

      fontSize:
        10,
    },

    statDivider: {
      width:
        1,

      height:
        25,

      backgroundColor:
        theme.colors
          .white20,

      marginHorizontal:
        18,
    },

    generating: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        10,

      backgroundColor:
        theme.colors
          .surface,

      borderRadius:
        14,

      padding:
        13,

      marginBottom:
        20,
    },

    generatingText: {
      color:
        theme.colors
          .textSecondary,

      fontFamily:
        theme.typography
          .families
          .bodyMedium,

      fontSize:
        12,
    },

    featuredSection: {
      marginBottom:
        28,
    },

    eyebrow: {
      color:
        theme.colors
          .champagneLight,

      fontFamily:
        theme.typography
          .families
          .bodySemiBold,

      fontSize:
        9,

      letterSpacing:
        1.5,
    },

    sectionTitle: {
      color:
        theme.colors
          .white,

      fontFamily:
        theme.typography
          .families
          .displaySemiBold,

      fontSize:
        20,

      marginTop:
        4,
    },

    featuredCard: {
      width:
        205,

      height:
        170,

      borderRadius:
        21,

      overflow:
        'hidden',
    },

    featuredContent: {
      position:
        'absolute',

      left:
        14,

      right:
        14,

      bottom:
        14,
    },

    featuredTime: {
      color:
        theme.colors
          .white70,

      fontFamily:
        theme.typography
          .families
          .bodyMedium,

      fontSize:
        10,
    },

    featuredTitle: {
      color:
        theme.colors
          .white,

      fontFamily:
        theme.typography
          .families
          .displaySemiBold,

      fontSize:
        16,

      marginTop:
        4,
    },

    timelineHeader: {
      marginBottom:
        16,

      marginTop:
        2,
    },

    timelineRow: {
      flexDirection:
        'row',
    },

    timelineRail: {
      width:
        24,

      alignItems:
        'center',
    },

    timelineDotOuter: {
      width:
        14,

      height:
        14,

      borderRadius:
        7,

      borderWidth:
        2,

      borderColor:
        theme.colors
          .champagneLight,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    timelineDot: {
      width:
        4,

      height:
        4,

      borderRadius:
        2,

      backgroundColor:
        theme.colors
          .champagneLight,
    },

    timelineLine: {
      flex:
        1,

      width:
        1,

      backgroundColor:
        theme.colors
          .white15,

      marginVertical:
        5,
    },

    timelineCard: {
      flex:
        1,

      flexDirection:
        'row',

      marginLeft:
        8,

      marginBottom:
        14,

      borderRadius:
        18,

      overflow:
        'hidden',

      backgroundColor:
        'rgba(255,255,255,0.045)',

      borderWidth:
        1,

      borderColor:
        theme.colors
          .white08,
    },

    imageWrap: {
      width:
        112,

      minHeight:
        114,

      backgroundColor:
        theme.colors
          .surfaceDark2,
    },

    imageOverlay: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor:
        'rgba(0,0,0,0.10)',
    },

    mediaBadge: {
      position:
        'absolute',

      right:
        7,

      top:
        7,

      flexDirection:
        'row',

      gap:
        3,

      alignItems:
        'center',

      backgroundColor:
        'rgba(0,0,0,0.50)',

      borderRadius:
        99,

      paddingHorizontal:
        6,

      paddingVertical:
        4,
    },

    mediaBadgeText: {
      color:
        theme.colors
          .white,

      fontFamily:
        theme.typography
          .families
          .bodyMedium,

      fontSize:
        10,
    },

    content: {
      flex:
        1,

      padding:
        13,
    },

    topRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    time: {
      color:
        theme.colors
          .champagneLight,

      fontFamily:
        theme.typography
          .families
          .bodyMedium,

      fontSize:
        10,
    },

    title: {
      color:
        theme.colors
          .white,

      fontFamily:
        theme.typography
          .families
          .displaySemiBold,

      fontSize:
        16,

      lineHeight:
        21,

      marginTop:
        8,
    },

    metaRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginTop:
        9,
    },

    meta: {
      color:
        theme.colors
          .white45,

      fontFamily:
        theme.typography
          .families
          .body,

      fontSize:
        10,
    },

    index: {
      color:
        theme.colors
          .white25,

      fontFamily:
        theme.typography
          .families
          .bodyMedium,

      fontSize:
        9,
    },

    pressed: {
      opacity:
        0.82,

      transform: [
        {
          scale:
            0.985,
        },
      ],
    },
  });