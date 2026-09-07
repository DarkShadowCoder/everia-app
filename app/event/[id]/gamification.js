// app/event/[id]/gamification.js
// ============================================================
// EVERIA — Gamification
// ============================================================

import React, {
  useMemo,
} from 'react';

import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import {
  useLocalSearchParams,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import theme from '@/theme';

import Header from '@/components/ui/Header';
import ProgressRing from '@/components/ui/ProgressRing';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';

import {
  useAuthStore,
} from '@/store/authStore';

import {
  useSupabaseQuery,
} from '@/hooks/useSupabaseQuery';

import {
  getGamificationSnapshot,
  levelFromPoints,
} from '@/lib/gamification';

import {
  avatarUrl,
} from '@/lib/storage';

export default function Gamification() {
  const {
    id,
  } =
    useLocalSearchParams();

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const {
    data,
    isLoading,
    refresh,
  } =
    useSupabaseQuery(
      () =>
        getGamificationSnapshot(
          id,
          user?.id
        ),
      [
        id,
        user?.id,
      ]
    );

  const stats =
    data?.stats ||
    {};

  const totalPoints =
    Number(
      stats.points ||
        stats.participation_score ||
        0
    );

  const level =
    levelFromPoints(
      totalPoints
    );

  const myRank =
    useMemo(
      () =>
        (
          data?.leaderboard ||
          []
        ).find(
          (row) =>
            row.user_id ===
            user?.id
        )?.rank,
      [
        data?.leaderboard,
        user?.id,
      ]
    );

  return (
    <View
      style={
        styles.screen
      }
    >
      <Header
        title="Gamification"
        subtitle="Votre progression"
        dark
      />

      <FlatList
        data={
          data?.leaderboard ||
          []
        }
        keyExtractor={
          (item) =>
            item.user_id ||
            item.id
        }
        refreshControl={
          <RefreshControl
            refreshing={
              isLoading
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
        contentContainerStyle={
          styles.content
        }
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={
                theme.gradients
                  .plumGold
              }
              style={
                styles.hero
              }
            >
              <View
                style={
                  styles.heroTop
                }
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      styles.eyebrow
                    }
                  >
                    VOTRE NIVEAU
                  </Text>

                  <Text
                    style={
                      styles.level
                    }
                  >
                    Niveau{' '}
                    {
                      level.level
                    }
                  </Text>

                  <Text
                    style={
                      styles.points
                    }
                  >
                    {totalPoints.toLocaleString(
                      'fr-FR'
                    )}{' '}
                    points
                  </Text>

                  <Text
                    style={
                      styles.next
                    }
                  >
                    {
                      level.pointsToNext
                    }{' '}
                    points avant le prochain niveau
                  </Text>
                </View>

                <ProgressRing
                  progress={
                    level.progress
                  }
                  size={
                    104
                  }
                  strokeWidth={
                    8
                  }
                  label={`${Math.round(
                    level.progress *
                      100
                  )}%`}
                />
              </View>
            </LinearGradient>

            <View
              style={
                styles.statsGrid
              }
            >
              <Stat
                icon="camera-outline"
                value={
                  stats.photos_count ||
                  0
                }
                label="Photos"
              />

              <Stat
                icon="videocam-outline"
                value={
                  stats.videos_count ||
                  0
                }
                label="Vidéos"
              />

              <Stat
                icon="flash-outline"
                value={
                  stats.challenges_completed ||
                  0
                }
                label="Défis"
              />

              <Stat
                icon="people-outline"
                value={
                  stats.people_count ||
                  0
                }
                label="People"
              />
            </View>

            <View
              style={
                styles.rankCard
              }
            >
              <View
                style={
                  styles.rankIcon
                }
              >
                <Ionicons
                  name="podium-outline"
                  size={21}
                  color={
                    theme.colors
                      .champagneLight
                  }
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.rankTitle
                  }
                >
                  Votre classement
                </Text>

                <Text
                  style={
                    styles.rankText
                  }
                >
                  {myRank
                    ? `Vous êtes ${myRank}e sur ${
                        data?.leaderboard
                          ?.length ||
                        0
                      }`
                    : "Votre classement apparaîtra dès votre première activité."}
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Mes badges
            </Text>

            <View
              style={
                styles.badgesRow
              }
            >
              {(
                data?.badges ||
                []
              ).length ? (
                data.badges.map(
                  (
                    entry
                  ) => (
                    <View
                      key={
                        entry.id
                      }
                      style={
                        styles.badgeCard
                      }
                    >
                      <View
                        style={
                          styles.badgeIcon
                        }
                      >
                        <Ionicons
                          name="ribbon-outline"
                          size={20}
                          color={
                            theme.colors
                              .champagneLight
                          }
                        />
                      </View>

                      <Text
                        numberOfLines={
                          2
                        }
                        style={
                          styles.badgeName
                        }
                      >
                        {
                          entry
                            .badges
                            ?.name ||
                          'Badge'
                        }
                      </Text>
                    </View>
                  )
                )
              ) : (
                <Text
                  style={
                    styles.muted
                  }
                >
                  Continuez à participer
                  pour débloquer des badges.
                </Text>
              )}
            </View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Classement
            </Text>
          </>
        }
        renderItem={({
          item,
        }) => (
          <LeaderboardRow
            item={
              item
            }
            isMe={
              item.user_id ===
              user?.id
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="podium-outline"
            title="Pas encore de classement"
            subtitle="Participez à l'événement pour entrer dans le classement."
          />
        }
      />
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
}) {
  return (
    <View
      style={
        styles.stat
      }
    >
      <Ionicons
        name={
          icon
        }
        size={17}
        color={
          theme.colors
            .champagneLight
        }
      />

      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function LeaderboardRow({
  item,
  isMe,
}) {
  const rankColor =
    item.rank === 1
      ? theme.gamification
          .leaderboard
          .first
      : item.rank === 2
      ? theme.gamification
          .leaderboard
          .second
      : item.rank === 3
      ? theme.gamification
          .leaderboard
          .third
      : theme.colors.white40;

  return (
    <View
      style={[
        styles.row,
        isMe &&
          styles.myRow,
      ]}
    >
      <Text
        style={[
          styles.rankNumber,
          {
            color:
              rankColor,
          },
        ]}
      >
        {
          item.rank
        }
      </Text>

      <Avatar
        uri={avatarUrl(
          item
            .profile
            ?.avatar_path
        )}
        name={
          item
            .profile
            ?.display_name
        }
        size="md"
      />

      <View
        style={
          styles.rowCopy
        }
      >
        <Text
          style={
            styles.rowName
          }
        >
          {
            item
              .profile
              ?.display_name ||
            'Participant'
          }
        </Text>

        <Text
          style={
            styles.rowMeta
          }
        >
          Niveau{' '}
          {
            item.level ||
            1
          }{' '}
          ·{' '}
          {
            item.points ||
            item.participation_score ||
            0
          }{' '}
          pts
        </Text>
      </View>

      {isMe ? (
        <View
          style={
            styles.mePill
          }
        >
          <Text
            style={
              styles.mePillText
            }
          >
            MOI
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        theme.screens
          .gamification,
    },

    content: {
      paddingHorizontal:
        theme.layout
          .screenHorizontal,
      paddingBottom: 40,
    },

    hero: {
      borderRadius: 24,
      padding: 20,
      marginBottom: 14,
      overflow: 'hidden',
    },

    heroTop: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    eyebrow: {
      color:
        theme.colors
          .white60,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 9,
      letterSpacing: 1.2,
    },

    level: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 31,
      marginTop: 4,
    },

    points: {
      color:
        theme.colors
          .champagneLight,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 16,
      marginTop: 4,
    },

    next: {
      color:
        theme.colors
          .white60,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 11,
      marginTop: 6,
    },

    statsGrid: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 10,
      marginBottom: 16,
    },

    stat: {
      width: '48%',
      minHeight: 92,
      borderRadius: 18,
      backgroundColor:
        theme.colors
          .darkSurface,
      borderWidth: 1,
      borderColor:
        theme.colors
          .borderDark,
      padding: 13,
    },

    statValue: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 24,
      marginTop: 7,
    },

    statLabel: {
      color:
        theme.colors
          .white40,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 11,
      marginTop: 1,
    },

    rankCard: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 12,
      borderRadius: 18,
      padding: 15,
      backgroundColor:
        theme.colors
          .darkSurface,
      borderWidth: 1,
      borderColor:
        theme.colors
          .borderDark,
      marginBottom: 22,
    },

    rankIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(217,184,120,0.14)',
    },

    rankTitle: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 13,
    },

    rankText: {
      color:
        theme.colors
          .white40,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 11,
      marginTop: 3,
    },

    sectionTitle: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 20,
      marginBottom: 12,
    },

    badgesRow: {
      flexDirection:
        'row',
      gap: 10,
      marginBottom: 24,
    },

    badgeCard: {
      width: 96,
      minHeight: 100,
      borderRadius: 17,
      backgroundColor:
        theme.colors
          .darkSurface,
      borderWidth: 1,
      borderColor:
        theme.colors
          .borderDark,
      alignItems:
        'center',
      justifyContent:
        'center',
      padding: 8,
    },

    badgeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        'rgba(217,184,120,0.14)',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    badgeName: {
      textAlign:
        'center',
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .bodyMedium,
      fontSize: 10,
      marginTop: 7,
    },

    muted: {
      color:
        theme.colors
          .white40,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 12,
      lineHeight: 18,
    },

    row: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 11,
      padding: 13,
      borderRadius: 18,
      backgroundColor:
        theme.colors
          .darkSurface,
      borderWidth: 1,
      borderColor:
        theme.colors
          .borderDark,
      marginBottom: 8,
    },

    myRow: {
      borderColor:
        theme.colors
          .champagneDark,
      backgroundColor:
        'rgba(217,184,120,0.08)',
    },

    rankNumber: {
      width: 24,
      textAlign:
        'center',
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 14,
    },

    rowCopy: {
      flex: 1,
    },

    rowName: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 13,
    },

    rowMeta: {
      color:
        theme.colors
          .white40,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 10,
      marginTop: 3,
    },

    mePill: {
      borderRadius:
        999,
      paddingHorizontal:
        8,
      paddingVertical:
        4,
      backgroundColor:
        theme.colors
          .champagneLight,
    },

    mePillText: {
      color:
        theme.colors
          .primaryDeep,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 8,
    },
  });