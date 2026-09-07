// app/event/[id]/my-experience.js
// ============================================================
// EVERIA — My Experience
// Refonte UI/UX complète
//
// Direction artistique :
// Premium Personal Journey / Editorial Dashboard
//
// Fonctionnalités conservées :
// - Statistiques de participation
// - Favoris
// - Recommandations personnalisées
// - Marquage des recommandations comme vues
// - Navigation vers Replay
// - Navigation vers les médias favoris
// ============================================================

import React, { useMemo } from 'react';
import {
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
  Ionicons,
} from '@expo/vector-icons';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import theme from '@/theme';

import Header from '@/components/ui/Header';
import StatCard from '@/components/ui/StatCard';
import MediaGrid from '@/components/event/MediaGrid';
import EmptyState from '@/components/ui/EmptyState';

import {
  useSupabaseQuery,
} from '@/hooks/useSupabaseQuery';

import {
  useAuthStore,
} from '@/store/authStore';

import {
  supabase,
} from '@/lib/supabase';

// ============================================================
// RECOMMENDATION TYPES
// ============================================================

const RECOMMENDATION_META = {
  moment: {
    icon: 'sparkles-outline',
    title: 'Un moment à revivre',
    label: 'MOMENT',
  },

  person: {
    icon: 'people-outline',
    title: 'Retrouvez cette personne',
    label: 'PERSONNE',
  },

  challenge: {
    icon: 'trophy-outline',
    title: 'Un défi pour vous',
    label: 'DÉFI',
  },

  media: {
    icon: 'image-outline',
    title: 'Un souvenir mis en avant',
    label: 'SOUVENIR',
  },
};

// ============================================================
// SCREEN
// ============================================================

export default function MyExperience() {
  const {
    id,
  } = useLocalSearchParams();

  const {
    user,
    profile,
  } = useAuthStore();

  // ==========================================================
  // PARTICIPATION
  // ==========================================================

  const {
    data: participation,
  } = useSupabaseQuery(
    async () => {
      const {
        data,
        error,
      } = await supabase
        .from(
          'event_participation_profiles'
        )
        .select('*')
        .eq(
          'event_id',
          id
        )
        .eq(
          'user_id',
          user?.id
        )
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    [
      id,
      user?.id,
    ]
  );

  // ==========================================================
  // FAVORITES
  // ==========================================================

  const {
    data: myFavorites,
  } = useSupabaseQuery(
    async () => {
      const {
        data,
        error,
      } = await supabase
        .from(
          'user_favorites'
        )
        .select(
          'media(*)'
        )
        .eq(
          'user_id',
          user?.id
        )
        .limit(12);

      if (error) {
        throw error;
      }

      return (
        data || []
      )
        .map(
          (row) =>
            row.media
        )
        .filter(
          (media) =>
            media &&
            media.event_id ===
              id
        );
    },
    [
      id,
      user?.id,
    ]
  );

  // ==========================================================
  // RECOMMENDATIONS
  // ==========================================================

  const {
    data: recommendations,
    refresh,
  } = useSupabaseQuery(
    async () => {
      const {
        data,
        error,
      } = await supabase
        .from(
          'personalized_items'
        )
        .select('*')
        .eq(
          'event_id',
          id
        )
        .eq(
          'user_id',
          user?.id
        )
        .order(
          'rank',
          {
            ascending: true,
          }
        )
        .limit(10);

      if (error) {
        throw error;
      }

      return data || [];
    },
    [
      id,
      user?.id,
    ]
  );

  // ==========================================================
  // MARK SEEN
  // ==========================================================

  const markSeen =
    async (
      itemId
    ) => {
      try {
        await supabase.rpc(
          'mark_personalized_item_seen',
          {
            p_item_id:
              itemId,
          }
        );

        refresh();
      } catch (error) {
        console.warn(
          '[Everia] Unable to mark recommendation as seen',
          error?.message
        );
      }
    };

  // ==========================================================
  // COMPUTED
  // ==========================================================

  const firstName =
    profile?.display_name?.split(
      ' '
    )[0] ||
    'Vous';

  const photosCount =
    participation
      ?.photos_count ||
    0;

  const favoritesCount =
    myFavorites?.length ||
    0;

  const challengesCount =
    participation
      ?.challenges_completed ||
    0;

  const momentsCount =
    participation
      ?.moments_count ||
    0;

  const score =
    participation
      ?.participation_score ||
    0;

  const experienceStats =
    useMemo(
      () => [
        {
          icon: 'images-outline',
          value:
            photosCount,
          label: 'Photos prises',
        },
        {
          icon: 'heart-outline',
          value:
            favoritesCount,
          label: 'Favoris',
        },
        {
          icon: 'trophy-outline',
          value:
            challengesCount,
          label: 'Défis',
        },
        {
          icon: 'sparkles-outline',
          value:
            momentsCount,
          label: 'Moments',
        },
      ],
      [
        photosCount,
        favoritesCount,
        challengesCount,
        momentsCount,
      ]
    );

  // ==========================================================
  // HERO
  // ==========================================================

  const renderHero =
    () => (
      <View>
        <LinearGradient
          colors={
            theme.gradients.luxury
          }
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={
            styles.hero
          }
        >
          <View
            style={
              styles.heroGlowOne
            }
          />

          <View
            style={
              styles.heroGlowTwo
            }
          />

          <View
            style={
              styles.heroTopRow
            }
          >
            <View
              style={
                styles.heroTextWrap
              }
            >
              <Text
                style={
                  styles.heroEyebrow
                }
              >
                VOTRE EXPÉRIENCE
              </Text>

              <Text
                style={
                  styles.heroTitle
                }
              >
                {firstName},
                {'\n'}
                voici votre histoire.
              </Text>

              <Text
                style={
                  styles.heroSubtitle
                }
              >
                Chaque photo, chaque rencontre
                et chaque petit moment compose
                votre façon de vivre l'événement.
              </Text>
            </View>

            <View
              style={
                styles.heroIcon
              }
            >
              <Ionicons
                name="sparkles-outline"
                size={23}
                color={
                  theme.colors
                    .champagneLight
                }
              />
            </View>
          </View>

          <View
            style={
              styles.heroScoreCard
            }
          >
            <View
              style={
                styles.heroScoreIcon
              }
            >
              <Ionicons
                name="flash-outline"
                size={18}
                color={
                  theme.colors
                    .primaryDeep
                }
              />
            </View>

            <View
              style={
                styles.heroScoreCopy
              }
            >
              <Text
                style={
                  styles.heroScoreLabel
                }
              >
                SCORE DE PARTICIPATION
              </Text>

              <Text
                style={
                  styles.heroScoreValue
                }
              >
                {Math.round(
                  score
                ).toLocaleString(
                  'fr-FR'
                )}
              </Text>
            </View>

            <View
              style={
                styles.heroScoreSuffix
              }
            >
              <Ionicons
                name="sparkles"
                size={11}
                color={
                  theme.colors
                    .champagneDark
                }
              />

              <Text
                style={
                  styles.heroScoreSuffixText
                }
              >
                points
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() =>
              router.push(
                `/event/${id}/replay`
              )
            }
            style={({ pressed }) => [
              styles.heroReplayButton,
              pressed &&
                styles.buttonPressed,
            ]}
          >
            <View
              style={
                styles.heroReplayButtonIcon
              }
            >
              <Ionicons
                name="play"
                size={14}
                color={
                  theme.colors
                    .primaryDeep
                }
              />
            </View>

            <View
              style={
                styles.heroReplayCopy
              }
            >
              <Text
                style={
                  styles.heroReplayEyebrow
                }
              >
                VOTRE BEST OF
              </Text>

              <Text
                style={
                  styles.heroReplayTitle
                }
              >
                Revoir les moments forts
              </Text>
            </View>

            <Ionicons
              name="arrow-up-outline"
              size={17}
              color={
                theme.colors
                  .primaryDeep
              }
            />
          </Pressable>
        </LinearGradient>

        {/* ---------------------------------------------------
            ACTIVITY
        --------------------------------------------------- */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionEyebrow
              }
            >
              VOTRE ACTIVITÉ
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Les moments qui comptent
            </Text>
          </View>

          <View
            style={
              styles.sectionDecoration
            }
          >
            <View
              style={
                styles.sectionDecorationDot
              }
            />

            <View
              style={
                styles.sectionDecorationLine
              }
            />
          </View>
        </View>

        <View
          style={
            styles.statsGrid
          }
        >
          {experienceStats.map(
            (stat) => (
              <ExperienceStat
                key={
                  stat.label
                }
                {...stat}
              />
            )
          )}
        </View>
      </View>
    );

  // ==========================================================
  // RECOMMENDATIONS HEADER
  // ==========================================================

  const renderRecommendationsHeader =
    () =>
      recommendations?.length ? (
        <View
          style={
            styles.recommendationsHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionEyebrow
              }
            >
              POUR VOUS
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Des suggestions personnelles
            </Text>
          </View>

          <View
            style={
              styles.recommendationSpark
            }
          >
            <Ionicons
              name="sparkles"
              size={14}
              color={
                theme.colors
                  .champagneDark
              }
            />
          </View>
        </View>
      ) : null;

  // ==========================================================
  // RECOMMENDATION
  // ==========================================================

  const renderRecommendation =
    ({
      item,
      index,
    }) => {
      const meta =
        RECOMMENDATION_META[
          item.item_type
        ] ||
        RECOMMENDATION_META.media;

      const isUnseen =
        !item.seen_at;

      return (
        <Pressable
          onPress={() =>
            markSeen(
              item.id
            )
          }
          style={({ pressed }) => [
            styles.recommendationCard,
            index % 2 ===
              1 &&
              styles.recommendationCardOffset,
            pressed &&
              styles.cardPressed,
            isUnseen &&
              styles.recommendationCardUnseen,
          ]}
        >
          <View
            style={[
              styles.recommendationIcon,
              isUnseen &&
                styles.recommendationIconActive,
            ]}
          >
            <Ionicons
              name={
                meta.icon
              }
              size={18}
              color={
                theme.colors
                  .primary
              }
            />
          </View>

          <View
            style={
              styles.recommendationContent
            }
          >
            <View
              style={
                styles.recommendationTopRow
              }
            >
              <Text
                style={
                  styles.recommendationType
                }
              >
                {meta.label}
              </Text>

              {isUnseen ? (
                <View
                  style={
                    styles.unseenBadge
                  }
                >
                  <View
                    style={
                      styles.unseenDot
                    }
                  />

                  <Text
                    style={
                      styles.unseenBadgeText
                    }
                  >
                    NOUVEAU
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              style={
                styles.recommendationTitle
              }
            >
              {
                meta.title
              }
            </Text>

            {item.reason ? (
              <Text
                style={
                  styles.recommendationReason
                }
                numberOfLines={
                  2
                }
              >
                {item.reason}
              </Text>
            ) : null}
          </View>

          <View
            style={
              styles.recommendationArrow
            }
          >
            <Ionicons
              name="chevron-forward"
              size={15}
              color={
                theme.colors
                  .textMuted
              }
            />
          </View>
        </Pressable>
      );
    };

  // ==========================================================
  // FAVORITES
  // ==========================================================

  const renderFavorites =
    () => (
      <View
        style={
          styles.favoritesSection
        }
      >
        <View
          style={
            styles.favoritesHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionEyebrow
              }
            >
              VOTRE COLLECTION
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Mes favoris
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Les souvenirs que vous avez
              choisi de garder près de vous.
            </Text>
          </View>

          <View
            style={
              styles.favoriteCount
            }
          >
            <Ionicons
              name="heart"
              size={15}
              color={
                theme.colors
                  .like
              }
            />

            <Text
              style={
                styles.favoriteCountText
              }
            >
              {
                favoritesCount
              }
            </Text>
          </View>
        </View>

        {myFavorites?.length ? (
          <View
            style={
              styles.favoriteGridCard
            }
          >
            <MediaGrid
              data={
                myFavorites
              }
              onPressItem={(
                media
              ) =>
                router.push(
                  `/event/${id}/media/${media.id}`
                )
              }
            />
          </View>
        ) : (
          <View
            style={
              styles.favoriteEmpty
            }
          >
            <EmptyState
              icon="heart-outline"
              title="Votre collection attend son premier souvenir"
              subtitle="Ajoutez une photo ou une vidéo en favori depuis la galerie pour la retrouver ici."
              actionLabel="Découvrir la galerie"
              onAction={() =>
                router.push(
                  `/event/${id}/gallery`
                )
              }
            />
          </View>
        )}
      </View>
    );

  // ==========================================================
  // MAIN
  // ==========================================================

  return (
    <View
      style={
        styles.screen
      }
    >
      <Header
        title="Mon expérience"
      />

      <FlatList
        data={
          recommendations ||
          []
        }
        keyExtractor={(
          item
        ) => item.id}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.listContent
        }
        ListHeaderComponent={
          <>
            {renderHero()}
            {renderRecommendationsHeader()}
          </>
        }
        renderItem={
          renderRecommendation
        }
        ListFooterComponent={
          renderFavorites()
        }
      />
    </View>
  );
}

// ============================================================
// EXPERIENCE STAT
// ============================================================

function ExperienceStat({
  icon,
  value,
  label,
}) {
  return (
    <View
      style={
        styles.activityCard
      }
    >
      <View
        style={
          styles.activityIcon
        }
      >
        <Ionicons
          name={icon}
          size={17}
          color={
            theme.colors
              .primary
          }
        />
      </View>

      <Text
        style={
          styles.activityValue
        }
      >
        {Number(
          value
        ).toLocaleString(
          'fr-FR'
        )}
      </Text>

      <Text
        style={
          styles.activityLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      theme.colors
        .background,
  },

  listContent: {
    paddingHorizontal:
      theme.layout
        .screenHorizontal,
    paddingBottom: 30,
  },

  // ----------------------------------------------------------
  // HERO
  // ----------------------------------------------------------

  hero: {
    position: 'relative',
    overflow: 'hidden',
    marginTop:
      theme.spacing.lg,
    borderRadius:
      theme.radius.xxl,
    paddingHorizontal: 17,
    paddingTop: 18,
    paddingBottom: 14,
  },

  heroGlowOne: {
    position:
      'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -90,
    top: -90,
    backgroundColor:
      'rgba(217,184,120,0.12)',
  },

  heroGlowTwo: {
    position:
      'absolute',
    width: 145,
    height: 145,
    borderRadius: 73,
    left: -85,
    bottom: -90,
    backgroundColor:
      'rgba(255,255,255,0.04)',
  },

  heroTopRow: {
    flexDirection:
      'row',
    alignItems:
      'flex-start',
    justifyContent:
      'space-between',
  },

  heroTextWrap: {
    flex: 1,
    paddingRight: 12,
  },

  heroEyebrow: {
    fontFamily:
      theme.typography
        .families
        .bodySemiBold,
    fontSize: 8.5,
    letterSpacing: 1.8,
    color:
      theme.colors
        .champagneLight,
  },

  heroTitle: {
    marginTop: 4,
    fontFamily:
      theme.typography
        .families
        .displaySemiBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    color:
      theme.colors.white,
  },

  heroSubtitle: {
    marginTop: 8,
    maxWidth: 315,
    fontFamily:
      theme.typography
        .families
        .body,
    fontSize: 10.5,
    lineHeight: 16,
    color:
      theme.colors
        .white60,
  },

  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  heroScoreCard: {
    marginTop: 17,
    minHeight: 69,
    borderRadius: 18,
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
    paddingHorizontal: 9,
    paddingVertical: 9,
    flexDirection:
      'row',
    alignItems:
      'center',
  },

  heroScoreIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor:
      theme.colors
        .champagne,
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  heroScoreCopy: {
    flex: 1,
    marginLeft: 9,
  },

  heroScoreLabel: {
    fontFamily:
      theme.typography
        .families
        .bodySemiBold,
    fontSize: 7,
    letterSpacing: 1.1,
    color:
      theme.colors
        .white60,
  },

  heroScoreValue: {
    marginTop: 1,
    fontFamily:
      theme.typography
        .families
        .displaySemiBold,
    fontSize: 21,
    lineHeight: 24,
    color:
      theme.colors.white,
  },

  heroScoreSuffix: {
    flexDirection:
      'row',
    alignItems:
      'center',
    gap: 4,
  },

  heroScoreSuffixText: {
    fontFamily:
      theme.typography
        .families
        .body,
    fontSize: 8.5,
    color:
      theme.colors
        .white60,
  },

  heroReplayButton: {
    minHeight: 58,
    marginTop: 9,
    borderRadius: 17,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor:
      theme.colors
        .champagne,
    flexDirection:
      'row',
    alignItems:
      'center',
  },

  heroReplayButtonIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor:
      theme.colors.white,
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  heroReplayCopy: {
    flex: 1,
    marginHorizontal: 9,
  },

  heroReplayEyebrow: {
    fontFamily:
      theme.typography
        .families
        .bodyBold,
    fontSize: 7,
    letterSpacing: 1.2,
    color:
      theme.colors
        .primary,
  },

  heroReplayTitle: {
    marginTop: 2,
    fontFamily:
      theme.typography
        .families
        .bodySemiBold,
    fontSize: 11.5,
    color:
      theme.colors
        .primaryDeep,
  },

  buttonPressed: {
    opacity: 0.9,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  // ----------------------------------------------------------
  // SECTION
  // ----------------------------------------------------------

  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection:
      'row',
    alignItems:
      'flex-end',
    justifyContent:
      'space-between',
  },

  sectionEyebrow: {
    fontFamily:
      theme.typography
        .families
        .bodySemiBold,
    fontSize: 8,
    letterSpacing: 1.6,
    color:
      theme.colors
        .textGold,
  },

  sectionTitle: {
    marginTop: 3,
    fontFamily:
      theme.typography
        .families
        .displaySemiBold,
    fontSize: 21,
    lineHeight: 26,
    color:
      theme.colors
        .textPrimary,
  },

  sectionDescription: {
    marginTop: 4,
    maxWidth: 305,
    fontFamily:
      theme.typography
        .families
        .body,
    fontSize: 10,
    lineHeight: 15,
    color:
      theme.colors
        .textMuted,
  },

  sectionDecoration: {
    flexDirection:
      'row',
    alignItems:
      'center',
    marginBottom: 4,
  },

  sectionDecorationDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      theme.colors
        .champagne,
  },

  sectionDecorationLine: {
    width: 22,
    height: 1,
    marginLeft: 5,
    backgroundColor:
      theme.colors
        .divider,
  },

  // ----------------------------------------------------------
  // STATS
  // ----------------------------------------------------------

  statsGrid: {
    flexDirection:
      'row',
    flexWrap:
      'wrap',
    gap: 8,
  },

  activityCard: {
    width: '48.7%',
    minHeight: 106,
    borderRadius: 18,
    backgroundColor:
      theme.colors.white,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor:
      theme.colors
        .primarySoft,
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  activityValue: {
    marginTop: 10,
    fontFamily:
      theme.typography
        .families
        .displaySemiBold,
    fontSize: 22,
    lineHeight: 25,
    color:
      theme.colors
        .textPrimary,
  },

  activityLabel: {
    marginTop: 1,
    fontFamily:
      theme.typography
        .families
        .body,
    fontSize: 8.5,
    color:
      theme.colors
        .textMuted,
  },

  // ----------------------------------------------------------
  // RECOMMENDATIONS
  // ----------------------------------------------------------

  recommendationsHeader: {
    marginTop: 28,
    marginBottom: 11,
    flexDirection:
      'row',
    alignItems:
      'flex-end',
    justifyContent:
      'space-between',
  },

  recommendationSpark: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor:
      theme.colors
        .champagnePale,
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  recommendationCard: {
    minHeight: 77,
    borderRadius: 20,
    backgroundColor:
      theme.colors.white,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    paddingHorizontal: 9,
    paddingVertical: 9,
    flexDirection:
      'row',
    alignItems:
      'center',
    marginBottom: 8,
  },

  recommendationCardOffset: {
    marginLeft: 5,
  },

  recommendationCardUnseen: {
    borderColor:
      theme.colors
        .champagneSoft,
  },

  recommendationIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor:
      theme.colors
        .surfaceSoft,
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  recommendationIconActive: {
    backgroundColor:
      theme.colors
        .primarySoft,
  },

  recommendationContent: {
    flex: 1,
    marginHorizontal: 9,
    minWidth: 0,
  },

  recommendationTopRow: {
    flexDirection:
      'row',
    alignItems:
      'center',
  },

  recommendationType: {
    fontFamily:
      theme.typography
        .families
        .bodyBold,
    fontSize: 6.5,
    letterSpacing: 1,
    color:
      theme.colors
        .textGold,
  },

  unseenBadge: {
    marginLeft: 7,
    height: 17,
    borderRadius: 999,
    paddingHorizontal: 5,
    backgroundColor:
      theme.colors
        .champagnePale,
    flexDirection:
      'row',
    alignItems:
      'center',
    gap: 3,
  },

  unseenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor:
      theme.colors
        .error,
  },

  unseenBadgeText: {
    fontFamily:
      theme.typography
        .families
        .bodyBold,
    fontSize: 5.5,
    letterSpacing: 0.7,
    color:
      theme.colors
        .textGold,
  },

  recommendationTitle: {
    marginTop: 2,
    fontFamily:
      theme.typography
        .families
        .bodySemiBold,
    fontSize: 11.5,
    color:
      theme.colors
        .textPrimary,
  },

  recommendationReason: {
    marginTop: 2,
    fontFamily:
      theme.typography
        .families
        .body,
    fontSize: 9.5,
    lineHeight: 14,
    color:
      theme.colors
        .textSecondary,
  },

  recommendationArrow: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor:
      theme.colors
        .surfaceSoft,
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  cardPressed: {
    opacity: 0.92,
    transform: [
      {
        scale: 0.995,
      },
    ],
  },

  // ----------------------------------------------------------
  // FAVORITES
  // ----------------------------------------------------------

  favoritesSection: {
    marginTop: 21,
  },

  favoritesHeader: {
    flexDirection:
      'row',
    alignItems:
      'flex-end',
    justifyContent:
      'space-between',
    marginBottom: 10,
  },

  favoriteCount: {
    minWidth: 42,
    height: 33,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor:
      theme.colors
        .errorLight,
    flexDirection:
      'row',
    alignItems:
      'center',
    justifyContent:
      'center',
    gap: 4,
  },

  favoriteCountText: {
    fontFamily:
      theme.typography
        .families
        .bodySemiBold,
    fontSize: 10,
    color:
      theme.colors
        .errorDark,
  },

  favoriteGridCard: {
    minHeight: 170,
    borderRadius: 20,
    backgroundColor:
      theme.colors.white,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    overflow: 'hidden',
    paddingTop: 7,
  },

  favoriteEmpty: {
    borderRadius: 20,
    backgroundColor:
      theme.colors.white,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    overflow: 'hidden',
  },
});