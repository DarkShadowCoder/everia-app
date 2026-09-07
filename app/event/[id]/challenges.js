// app/event/[id]/challenges.js
// ============================================================
// EVERIA — Challenges
// ============================================================

import React, {
  useCallback,
  useMemo,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  useAuthStore,
} from '@/store/authStore';

import {
  useEventStore,
} from '@/store/eventStore';

import {
  listEventChallenges,
} from '@/lib/challengeEngine';

const TYPE_CONFIG = {
  photo: {
    icon:
      'camera-outline',
    label:
      'Photo',
  },

  video: {
    icon:
      'videocam-outline',
    label:
      'Vidéo',
  },

  text: {
    icon:
      'create-outline',
    label:
      'Texte',
  },
};

const DIFFICULTY = [
  '',
  'Facile',
  'Accessible',
  'Modéré',
  'Corsé',
  'Expert',
];

function submissionState(
  challenge
) {
  const status =
    challenge
      ?.mySubmission
      ?.status;

  if (
    status ===
    'approved'
  ) {
    return {
      label:
        'Validé',
      icon:
        'checkmark-circle',
      color:
        theme.colors
          .success,
    };
  }

  if (
    status ===
    'rejected'
  ) {
    return {
      label:
        'À refaire',
      icon:
        'close-circle',
      color:
        theme.colors
          .error,
    };
  }

  if (
    status ===
    'submitted'
  ) {
    return {
      label:
        'En validation',
      icon:
        'time-outline',
      color:
        theme.colors
          .warning,
    };
  }

  if (
    challenge?.status ===
    'active'
  ) {
    return {
      label:
        'À relever',
      icon:
        'flash-outline',
      color:
        theme.colors
          .champagneLight,
    };
  }

  return {
    label:
      'Indisponible',
    icon:
      'lock-closed-outline',
    color:
      theme.colors
        .white40,
  };
}

function ChallengeCard({
  challenge,
  onPress,
}) {
  const type =
    TYPE_CONFIG[
      challenge
        .challenge_type
    ] || {
      icon:
        'flag-outline',
      label:
        'Défi',
    };

  const state =
    submissionState(
      challenge
    );

  return (
    <Pressable
      onPress={
        onPress
      }
      style={({ pressed }) => [
        styles.card,
        pressed &&
          styles.pressed,
      ]}
    >
      <LinearGradient
        colors={[
          theme.colors
            .darkSurface2,
          theme.colors
            .darkSurface,
        ]}
        style={
          StyleSheet.absoluteFillObject
        }
      />

      <View
        style={
          styles.cardTop
        }
      >
        <View
          style={
            styles.iconWrap
          }
        >
          <Ionicons
            name={
              type.icon
            }
            size={18}
            color={
              theme.colors
                .champagneLight
            }
          />
        </View>

        <View
          style={
            styles.points
          }
        >
          <Ionicons
            name="sparkles"
            size={11}
            color={
              theme.colors
                .primaryDeep
            }
          />

          <Text
            style={
              styles.pointsText
            }
          >
            {
              challenge.reward_points ||
              0
            }{' '}
            pts
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.eyebrow
        }
      >
        {
          type.label
        .toUpperCase()
        }{' '}
        ·{' '}
        {
          (
            DIFFICULTY[
              challenge
                .difficulty
            ] ||
            'Défi'
          ).toUpperCase()
        }
      </Text>

      <Text
        style={
          styles.title
        }
      >
        {
          challenge.title
        }
      </Text>

      {challenge.description ? (
        <Text
          style={
            styles.description
          }
          numberOfLines={3}
        >
          {
            challenge.description
          }
        </Text>
      ) : null}

      <View
        style={
          styles.footer
        }
      >
        <View
          style={
            styles.status
          }
        >
          <Ionicons
            name={
              state.icon
            }
            size={13}
            color={
              state.color
            }
          />

          <Text
            style={[
              styles.statusText,
              {
                color:
                  state.color,
              },
            ]}
          >
            {
              state.label
            }
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={17}
          color={
            theme.colors
              .white40
          }
        />
      </View>
    </Pressable>
  );
}

function Metric({
  value,
  label,
}) {
  return (
    <View
      style={
        styles.metric
      }
    >
      <Text
        style={
          styles.metricValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

export default function EventChallenges() {
  const {
    id,
  } =
    useLocalSearchParams();

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const event =
    useEventStore(
      (state) =>
        state.event
    );

  const {
    data,
    isLoading,
    error,
    refresh,
  } =
    useSupabaseQuery(
      () =>
        listEventChallenges(
          id,
          user?.id
        ),
      [
        id,
        user?.id,
      ]
    );

  const challenges =
    data || [];

  const active =
    useMemo(
      () =>
        challenges.filter(
          (item) =>
            item.status ===
            'active'
        ),
      [challenges]
    );

  const completed =
    useMemo(
      () =>
        challenges.filter(
          (item) =>
            item
              .mySubmission
              ?.status ===
            'approved'
        ),
      [challenges]
    );

  const points =
    useMemo(
      () =>
        completed.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.reward_points ||
              0
            ),
          0
        ),
      [completed]
    );

  const openChallenge =
    useCallback(
      (challengeId) => {
        router.push(
          `/event/${id}/challenge/${challengeId}`
        );
      },
      [id]
    );

  return (
    <View
      style={
        styles.screen
      }
    >
      <Header
        title="Défis"
        subtitle={
          event?.name ||
          'Votre expérience'
        }
        dark
        rightActions={[
          {
            icon:
              'trophy-outline',
            onPress: () =>
              router.push(
                `/event/${id}/gamification`
              ),
          },
        ]}
      />

      <FlatList
        data={
          challenges
        }
        keyExtractor={
          (item) =>
            item.id
        }
        renderItem={({
          item,
        }) => (
          <ChallengeCard
            challenge={
              item
            }
            onPress={() =>
              openChallenge(
                item.id
              )
            }
          />
        )}
        contentContainerStyle={
          styles.content
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
              <Text
                style={
                  styles.heroEyebrow
                }
              >
                EVERIA CHALLENGES
              </Text>

              <Text
                style={
                  styles.heroTitle
                }
              >
                Transformez vos souvenirs
                en moments à relever.
              </Text>

              <Text
                style={
                  styles.heroSubtitle
                }
              >
                Capturez, participez,
                gagnez des points et
                débloquez des badges.
              </Text>

              <View
                style={
                  styles.metrics
                }
              >
                <Metric
                  value={
                    active.length
                  }
                  label="Actifs"
                />

                <Metric
                  value={
                    completed.length
                  }
                  label="Validés"
                />

                <Metric
                  value={points}
                  label="Points"
                />
              </View>
            </LinearGradient>

            {error ? (
              <View
                style={
                  styles.error
                }
              >
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color={
                    theme.colors
                      .error
                  }
                />

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {
                    error.message
                  }
                </Text>
              </View>
            ) : null}

            <Text
              style={
                styles.sectionTitle
              }
            >
              Tous les défis
            </Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              color={
                theme.colors
                  .champagneLight
              }
            />
          ) : (
            <EmptyState
              icon="trophy-outline"
              title="Aucun défi publié"
              subtitle="Les défis de cet événement apparaîtront ici."
            />
          )
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        theme.screens
          .challenges,
    },

    content: {
      paddingHorizontal:
        theme.layout
          .screenHorizontal,
      paddingBottom: 40,
    },

    hero: {
      borderRadius: 24,
      padding: 22,
      marginBottom: 22,
      overflow: 'hidden',
    },

    heroEyebrow: {
      color:
        theme.colors
          .champagneLight,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 10,
      letterSpacing: 1.4,
    },

    heroTitle: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 25,
      lineHeight: 31,
      marginTop: 8,
    },

    heroSubtitle: {
      color:
        theme.colors
          .white60,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 9,
    },

    metrics: {
      flexDirection:
        'row',
      marginTop: 24,
    },

    metric: {
      flex: 1,
    },

    metricValue: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 22,
    },

    metricLabel: {
      color:
        theme.colors
          .white60,
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

    card: {
      minHeight: 168,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor:
        theme.colors
          .darkSurface,
      borderWidth: 1,
      borderColor:
        theme.colors
          .borderDark,
      padding: 18,
      marginBottom: 12,
    },

    pressed: {
      opacity: 0.92,
      transform: [
        {
          scale: 0.995,
        },
      ],
    },

    cardTop: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(217,184,120,0.14)',
    },

    points: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 5,
      backgroundColor:
        theme.colors
          .champagneLight,
      borderRadius: 999,
      paddingHorizontal: 9,
      height: 23,
    },

    pointsText: {
      color:
        theme.colors
          .primaryDeep,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 10,
    },

    eyebrow: {
      color:
        theme.colors.white40,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 9,
      letterSpacing: 1.1,
      marginTop: 16,
    },

    title: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 17,
      lineHeight: 22,
      marginTop: 5,
    },

    description: {
      color:
        theme.colors
          .white60,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
    },

    footer: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginTop: 14,
    },

    status: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 6,
    },

    statusText: {
      fontFamily:
        theme.typography
          .families
          .bodyMedium,
      fontSize: 11,
    },

    error: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 8,
      padding: 12,
      borderRadius: 14,
      backgroundColor:
        'rgba(184,92,104,0.12)',
      marginBottom: 16,
    },

    errorText: {
      flex: 1,
      color:
        theme.colors
          .error,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 12,
    },
  });