// app/event/[id]/gallery.js
// ============================================================
// EVERIA — Event Gallery
// Refonte UI/UX complète
//
// Direction artistique :
// Premium Editorial Gallery / Event Memories
//
// Fonctionnalités conservées :
// - Chargement Supabase
// - Filtres Tous / Photos / Vidéos / Les miens / Favoris
// - Navigation vers le média
// - Refresh
// - Navigation vers Capture
//
// ============================================================

import React, {
  useMemo,
  useState,
} from 'react';

import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  Image,
} from 'expo-image';

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
  supabase,
} from '@/lib/supabase';

import {
  mediaThumbnail,
} from '@/lib/storage';

import {
  DEFAULT_PAGE_SIZE,
} from '@/constants/config';

// ============================================================
// CONSTANTS
// ============================================================

const SCREEN_WIDTH =
  Dimensions.get('window').width;

const HORIZONTAL_PADDING =
  theme.layout.screenHorizontal;

const GRID_GAP = 7;

const SMALL_TILE_WIDTH =
  (
    SCREEN_WIDTH -
    HORIZONTAL_PADDING * 2 -
    GRID_GAP
  ) / 2;

const FILTERS = [
  {
    value: 'all',
    label: 'Tout',
    icon: 'grid-outline',
  },
  {
    value: 'photo',
    label: 'Photos',
    icon: 'image-outline',
  },
  {
    value: 'video',
    label: 'Vidéos',
    icon: 'videocam-outline',
  },
  {
    value: 'mine',
    label: 'Mes photos',
    icon: 'person-outline',
  },
  {
    value: 'favorites',
    label: 'Favoris',
    icon: 'heart-outline',
  },
];

// ============================================================
// MAIN SCREEN
// ============================================================

export default function EventGallery() {
  const { id } =
    useLocalSearchParams();

  const {
    user,
  } = useAuthStore();

  const [
    filter,
    setFilter,
  ] = useState('all');

  // ----------------------------------------------------------
  // SUPABASE QUERY
  // ----------------------------------------------------------

  const {
    data: media,
    isLoading,
    refresh,
  } = useSupabaseQuery(
    async () => {
      let query =
        supabase
          .from('media')
          .select('*')
          .eq('event_id', id)
          .in('status', [
            'ready',
            'published',
          ])
          .order(
            'created_at',
            {
              ascending: false,
            }
          )
          .limit(
            DEFAULT_PAGE_SIZE
          );

      if (
        filter === 'photo'
      ) {
        query =
          query.eq(
            'media_type',
            'photo'
          );
      }

      if (
        filter === 'video'
      ) {
        query =
          query.eq(
            'media_type',
            'video'
          );
      }

      if (
        filter === 'mine'
      ) {
        query =
          query.eq(
            'uploader_user_id',
            user?.id
          );
      }

      if (
        filter === 'favorites'
      ) {
        const {
          data: favorites,
          error:
            favoritesError,
        } =
          await supabase
            .from(
              'user_favorites'
            )
            .select(
              'media_id'
            )
            .eq(
              'user_id',
              user?.id
            );

        if (
          favoritesError
        ) {
          throw favoritesError;
        }

        const ids =
          (
            favorites ||
            []
          ).map(
            (favorite) =>
              favorite.media_id
          );

        if (
          !ids.length
        ) {
          return [];
        }

        const {
          data,
          error,
        } =
          await supabase
            .from('media')
            .select('*')
            .in(
              'id',
              ids
            )
            .eq(
              'event_id',
              id
            )
            .in(
              'status',
              [
                'ready',
                'published',
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

        return data || [];
      }

      const {
        data,
        error,
      } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    },
    [
      id,
      filter,
      user?.id,
    ]
  );

  // ----------------------------------------------------------
  // COMPUTED
  // ----------------------------------------------------------

  const items =
    media || [];

  const photoCount =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.media_type ===
            'photo'
        ).length,
      [items]
    );

  const videoCount =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.media_type ===
            'video'
        ).length,
      [items]
    );

  const latest =
    items[0] || null;

  const remaining =
    items.slice(1);

  // ----------------------------------------------------------
  // FILTER HEADER
  // ----------------------------------------------------------

  const renderFilterBar =
    () => (
      <View
        style={
          styles.filterWrapper
        }
      >
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          keyExtractor={(item) =>
            item.value
          }
          contentContainerStyle={
            styles.filterList
          }
          renderItem={({
            item,
          }) => (
            <Pressable
              onPress={() =>
                setFilter(
                  item.value
                )
              }
              style={[
                styles.filterItem,
                filter ===
                  item.value &&
                  styles.filterItemActive,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={14}
                color={
                  filter ===
                  item.value
                    ? theme.colors
                        .white
                    : theme.colors
                        .textSecondary
                }
              />

              <Text
                style={[
                  styles.filterText,
                  filter ===
                    item.value &&
                    styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>
    );

  // ==========================================================
  // HEADER CONTENT
  // ==========================================================

  const renderHeader =
    () => (
      <View
        style={
          styles.headerContent
        }
      >
        {/* ---------------------------------------------------
            HERO
        --------------------------------------------------- */}

        <View
          style={
            styles.heroRow
          }
        >
          <View
            style={
              styles.heroCopy
            }
          >
            <View
              style={
                styles.eyebrowRow
              }
            >
              <View
                style={
                  styles.eyebrowLine
                }
              />

              <Text
                style={
                  styles.eyebrow
                }
              >
                VOS SOUVENIRS
              </Text>
            </View>

            <Text
              style={
                styles.heroTitle
              }
            >
              Tout ce qui mérite
              d'être gardé.
            </Text>

            <Text
              style={
                styles.heroSubtitle
              }
            >
              Retrouvez les photos et vidéos
              partagées pendant l'événement,
              réunies dans un seul espace.
            </Text>
          </View>

          <View
            style={
              styles.heroIcon
            }
          >
            <Ionicons
              name="images-outline"
              size={28}
              color={
                theme.colors
                  .primary
              }
            />

            <View
              style={
                styles.heroIconDot
              }
            />
          </View>
        </View>

        {/* ---------------------------------------------------
            STATS
        --------------------------------------------------- */}

        <View
          style={
            styles.statsCard
          }
        >
          <GalleryStat
            value={items.length}
            label="souvenirs"
            icon="albums-outline"
          />

          <View
            style={
              styles.statsDivider
            }
          />

          <GalleryStat
            value={photoCount}
            label="photos"
            icon="image-outline"
          />

          <View
            style={
              styles.statsDivider
            }
          />

          <GalleryStat
            value={videoCount}
            label="vidéos"
            icon="videocam-outline"
          />

          <View
            style={
              styles.statsLive
            }
          >
            <View
              style={
                styles.statsLiveDot
              }
            />

            <Text
              style={
                styles.statsLiveText
              }
            >
              LIVE
            </Text>
          </View>
        </View>

        {/* ---------------------------------------------------
            FILTERS
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
              EXPLORER
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              La galerie
            </Text>
          </View>

          <Text
            style={
              styles.resultCount
            }
          >
            {items.length}{' '}
            résultat
            {items.length > 1
              ? 's'
              : ''}
          </Text>
        </View>

        {renderFilterBar()}

        {/* ---------------------------------------------------
            FEATURED
        --------------------------------------------------- */}

        {latest ? (
          <View
            style={
              styles.featuredSection
            }
          >
            <View
              style={
                styles.featuredHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.featuredEyebrow
                  }
                >
                  À LA UNE
                </Text>

                <Text
                  style={
                    styles.featuredTitle
                  }
                >
                  Dernier souvenir
                </Text>
              </View>

              <View
                style={
                  styles.featuredHeaderIcon
                }
              >
                <Ionicons
                  name="sparkles-outline"
                  size={16}
                  color={
                    theme.colors
                      .champagneDark
                  }
                />
              </View>
            </View>

            <Pressable
              onPress={() =>
                router.push(
                  `/event/${id}/media/${latest.id}`
                )
              }
              style={({ pressed }) => [
                styles.featuredCard,
                pressed &&
                  styles.cardPressed,
              ]}
            >
              <Image
                source={{
                  uri: mediaThumbnail(
                    latest
                  ),
                }}
                style={
                  StyleSheet.absoluteFillObject
                }
                contentFit="cover"
                transition={280}
              />

              <View
                style={
                  styles.featuredShade
                }
              />

              <View
                style={
                  styles.featuredTop
                }
              >
                <View
                  style={
                    styles.newBadge
                  }
                >
                  <View
                    style={
                      styles.newBadgeDot
                    }
                  />

                  <Text
                    style={
                      styles.newBadgeText
                    }
                  >
                    NOUVEAU
                  </Text>
                </View>

                <View
                  style={
                    styles.mediaTypeBadge
                  }
                >
                  <Ionicons
                    name={
                      latest.media_type ===
                      'video'
                        ? 'videocam-outline'
                        : 'image-outline'
                    }
                    size={13}
                    color={
                      theme.colors
                        .white
                    }
                  />
                </View>
              </View>

              <View
                style={
                  styles.featuredBottom
                }
              >
                <View
                  style={
                    styles.featuredTextWrap
                  }
                >
                  <Text
                    style={
                      styles.featuredAuthor
                    }
                    numberOfLines={
                      1
                    }
                  >
                    {latest.uploader_name ||
                      'Invité'}
                  </Text>

                  <Text
                    style={
                      styles.featuredDescription
                    }
                  >
                    vient de partager
                    ce souvenir
                  </Text>
                </View>

                <View
                  style={
                    styles.featuredArrow
                  }
                >
                  <Ionicons
                    name="arrow-up-outline"
                    size={17}
                    color={
                      theme.colors
                        .primaryDeep
                    }
                  />
                </View>
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* ---------------------------------------------------
            GRID TITLE
        --------------------------------------------------- */}

        {remaining.length > 0 ? (
          <View
            style={
              styles.gridHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionEyebrow
                }
              >
                SOUVENIRS
              </Text>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Tous les moments
              </Text>
            </View>

            <Ionicons
              name="grid-outline"
              size={17}
              color={
                theme.colors
                  .textGold
              }
            />
          </View>
        ) : null}
      </View>
    );

  // ==========================================================
  // EMPTY
  // ==========================================================

  const renderEmpty =
    !isLoading &&
    items.length === 0 ? (
      <View
        style={
          styles.emptyWrap
        }
      >
        <EmptyState
          icon="images-outline"
          title={
            filter ===
            'favorites'
              ? 'Aucun favori'
              : 'La galerie est encore vide'
          }
          subtitle={
            filter ===
            'favorites'
              ? 'Vos médias favoris apparaîtront ici.'
              : 'Les photos et vidéos de l’événement apparaîtront ici dès qu’elles seront publiées.'
          }
          actionLabel="Capturer un souvenir"
          onAction={() =>
            router.push(
              `/event/${id}/capture`
            )
          }
        />
      </View>
    ) : null;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <View
      style={
        styles.screen
      }
    >
      <Header
        title="Galerie"
        rightActions={[
          {
            icon:
              'camera-outline',
            onPress: () =>
              router.push(
                `/event/${id}/capture`
              ),
          },
        ]}
      />

      <FlatList
        data={remaining}
        keyExtractor={(item) =>
          item.id
        }
        numColumns={2}
        columnWrapperStyle={
          remaining.length
            ? styles.gridRow
            : undefined
        }
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshing={isLoading}
        onRefresh={refresh}
        ListHeaderComponent={
          renderHeader()
        }
        ListEmptyComponent={
          renderEmpty
        }
        renderItem={({
          item,
          index,
        }) => (
          <GalleryTile
            media={item}
            eventId={id}
            index={index}
          />
        )}
      />

      {/* ------------------------------------------------------
          FLOATING CAPTURE
      ------------------------------------------------------ */}

      <Pressable
        onPress={() =>
          router.push(
            `/event/${id}/capture`
          )
        }
        style={({ pressed }) => [
          styles.captureFab,
          pressed &&
            styles.captureFabPressed,
        ]}
      >
        <View
          style={
            styles.captureFabIcon
          }
        >
          <Ionicons
            name="camera"
            size={19}
            color={
              theme.colors
                .primaryDeep
            }
          />
        </View>

        <View
          style={
            styles.captureFabCopy
          }
        >
          <Text
            style={
              styles.captureFabEyebrow
            }
          >
            AJOUTER
          </Text>

          <Text
            style={
              styles.captureFabTitle
            }
          >
            Un souvenir
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
    </View>
  );
}

// ============================================================
// STAT
// ============================================================

function GalleryStat({
  value,
  label,
  icon,
}) {
  return (
    <View
      style={
        styles.galleryStat
      }
    >
      <View
        style={
          styles.galleryStatIcon
        }
      >
        <Ionicons
          name={icon}
          size={15}
          color={
            theme.colors
              .primary
          }
        />
      </View>

      <Text
        style={
          styles.galleryStatValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.galleryStatLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

// ============================================================
// GALLERY TILE
// ============================================================

function GalleryTile({
  media,
  eventId,
  index,
}) {
  const isFeaturedTile =
    index % 7 === 0;

  return (
    <Pressable
      onPress={() =>
        router.push(
          `/event/${eventId}/media/${media.id}`
        )
      }
      style={({ pressed }) => [
        styles.galleryTile,
        isFeaturedTile &&
          styles.galleryTileTall,
        pressed &&
          styles.cardPressed,
      ]}
    >
      <Image
        source={{
          uri: mediaThumbnail(
            media
          ),
        }}
        style={
          StyleSheet.absoluteFillObject
        }
        contentFit="cover"
        transition={180}
      />

      <View
        style={
          styles.tileGradient
        }
      />

      <View
        style={
          styles.tileTop
        }
      >
        {media.media_type ===
        'video' ? (
          <View
            style={
              styles.tileTypeBadge
            }
          >
            <Ionicons
              name="play"
              size={9}
              color={
                theme.colors
                  .white
              }
            />
          </View>
        ) : null}
      </View>

      <View
        style={
          styles.tileBottom
        }
      >
        <Text
          style={
            styles.tileAuthor
          }
          numberOfLines={1}
        >
          {media.uploader_name ||
            'Invité'}
        </Text>

        <View
          style={
            styles.tileArrow
          }
        >
          <Ionicons
            name="arrow-up-outline"
            size={11}
            color={
              theme.colors
                .white
            }
          />
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      theme.screens.gallery,
  },

  listContent: {
    paddingHorizontal:
      HORIZONTAL_PADDING,
    paddingBottom: 118,
  },

  headerContent: {
    paddingTop: 18,
  },

  // ----------------------------------------------------------
  // HERO
  // ----------------------------------------------------------

  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
  },

  heroCopy: {
    flex: 1,
    paddingRight: 12,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  eyebrowLine: {
    width: 22,
    height: 1,
    backgroundColor:
      theme.colors.champagne,
    marginRight: 7,
  },

  eyebrow: {
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 8.5,
    letterSpacing: 1.7,
    color:
      theme.colors.textGold,
  },

  heroTitle: {
    fontFamily:
      theme.typography.families
        .displaySemiBold,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.4,
    color:
      theme.colors.textPrimary,
  },

  heroSubtitle: {
    marginTop: 9,
    maxWidth: 325,
    fontFamily:
      theme.typography.families.body,
    fontSize: 11.5,
    lineHeight: 18,
    color:
      theme.colors.textSecondary,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor:
      theme.colors.champagnePale,
    borderWidth: 1,
    borderColor:
      theme.colors.champagneSoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  heroIconDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor:
      theme.colors.champagne,
    right: 9,
    top: 9,
  },

  // ----------------------------------------------------------
  // STATS
  // ----------------------------------------------------------

  statsCard: {
    marginTop: 17,
    minHeight: 77,
    borderRadius: 21,
    backgroundColor:
      theme.colors.white,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    paddingHorizontal: 9,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },

  galleryStat: {
    flex: 1,
    alignItems: 'center',
  },

  galleryStatIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor:
      theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  galleryStatValue: {
    marginTop: 4,
    fontFamily:
      theme.typography.families
        .displaySemiBold,
    fontSize: 17,
    lineHeight: 20,
    color:
      theme.colors.textPrimary,
  },

  galleryStatLabel: {
    marginTop: 0,
    fontFamily:
      theme.typography.families.body,
    fontSize: 7.5,
    color:
      theme.colors.textMuted,
  },

  statsDivider: {
    width: 1,
    height: 35,
    backgroundColor:
      theme.colors.divider,
  },

  statsLive: {
    position: 'absolute',
    right: 7,
    top: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  statsLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      theme.colors.eventLive ||
      theme.colors.error,
  },

  statsLiveText: {
    fontFamily:
      theme.typography.families
        .bodyBold,
    fontSize: 6.5,
    letterSpacing: 0.8,
    color:
      theme.colors.textMuted,
  },

  // ----------------------------------------------------------
  // SECTION
  // ----------------------------------------------------------

  sectionHeader: {
    marginTop: 25,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent:
      'space-between',
  },

  sectionEyebrow: {
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 8,
    letterSpacing: 1.6,
    color:
      theme.colors.textGold,
  },

  sectionTitle: {
    marginTop: 3,
    fontFamily:
      theme.typography.families
        .displaySemiBold,
    fontSize: 21,
    lineHeight: 26,
    color:
      theme.colors.textPrimary,
  },

  resultCount: {
    marginBottom: 3,
    fontFamily:
      theme.typography.families
        .bodyMedium,
    fontSize: 9,
    color:
      theme.colors.textMuted,
  },

  // ----------------------------------------------------------
  // FILTERS
  // ----------------------------------------------------------

  filterWrapper: {
    marginHorizontal:
      -HORIZONTAL_PADDING,
  },

  filterList: {
    paddingHorizontal:
      HORIZONTAL_PADDING,
    paddingBottom: 2,
    gap: 7,
  },

  filterItem: {
    minHeight: 35,
    borderRadius: 999,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor:
      theme.colors.white,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
  },

  filterItemActive: {
    backgroundColor:
      theme.colors.primary,
    borderColor:
      theme.colors.primary,
  },

  filterText: {
    fontFamily:
      theme.typography.families
        .bodyMedium,
    fontSize: 9,
    color:
      theme.colors.textSecondary,
  },

  filterTextActive: {
    color:
      theme.colors.white,
  },

  // ----------------------------------------------------------
  // FEATURED
  // ----------------------------------------------------------

  featuredSection: {
    marginTop: 23,
  },

  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent:
      'space-between',
    marginBottom: 9,
  },

  featuredEyebrow: {
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 8,
    letterSpacing: 1.5,
    color:
      theme.colors.textGold,
  },

  featuredTitle: {
    marginTop: 2,
    fontFamily:
      theme.typography.families
        .displaySemiBold,
    fontSize: 19,
    lineHeight: 23,
    color:
      theme.colors.textPrimary,
  },

  featuredHeaderIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor:
      theme.colors.champagnePale,
    alignItems: 'center',
    justifyContent: 'center',
  },

  featuredCard: {
    height: 260,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor:
      theme.colors.surfaceSoft,
  },

  featuredShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      'rgba(20,8,22,0.18)',
  },

  featuredTop: {
    position: 'absolute',
    left: 11,
    right: 11,
    top: 11,
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },

  newBadge: {
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    backgroundColor:
      'rgba(22,10,24,0.60)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  newBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      theme.colors.eventLive ||
      theme.colors.error,
  },

  newBadgeText: {
    fontFamily:
      theme.typography.families
        .bodyBold,
    fontSize: 7,
    letterSpacing: 0.9,
    color:
      theme.colors.white,
  },

  mediaTypeBadge: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor:
      'rgba(22,10,24,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featuredBottom: {
    position: 'absolute',
    left: 11,
    right: 11,
    bottom: 11,
    minHeight: 61,
    borderRadius: 18,
    paddingHorizontal: 9,
    paddingVertical: 8,
    backgroundColor:
      'rgba(22,10,24,0.72)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  featuredTextWrap: {
    flex: 1,
    paddingHorizontal: 2,
  },

  featuredAuthor: {
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 11.5,
    color:
      theme.colors.white,
  },

  featuredDescription: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8.5,
    color:
      theme.colors.white60,
  },

  featuredArrow: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor:
      theme.colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ----------------------------------------------------------
  // GRID
  // ----------------------------------------------------------

  gridHeader: {
    marginTop: 25,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent:
      'space-between',
  },

  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  galleryTile: {
    width:
      SMALL_TILE_WIDTH,
    height:
      SMALL_TILE_WIDTH,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor:
      theme.colors.surfaceSoft,
  },

  galleryTileTall: {
    height:
      SMALL_TILE_WIDTH + 55,
  },

  tileGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      'rgba(20,8,22,0.05)',
  },

  tileTop: {
    position: 'absolute',
    top: 7,
    right: 7,
  },

  tileTypeBadge: {
    width: 23,
    height: 23,
    borderRadius: 8,
    backgroundColor:
      'rgba(22,10,24,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tileBottom: {
    position: 'absolute',
    left: 7,
    right: 7,
    bottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  tileAuthor: {
    flex: 1,
    marginRight: 5,
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 8.5,
    color:
      theme.colors.white,
  },

  tileArrow: {
    width: 23,
    height: 23,
    borderRadius: 8,
    backgroundColor:
      'rgba(22,10,24,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ----------------------------------------------------------
  // EMPTY
  // ----------------------------------------------------------

  emptyWrap: {
    paddingVertical: 70,
  },

  // ----------------------------------------------------------
  // FAB
  // ----------------------------------------------------------

  captureFab: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 21,
    minHeight: 67,
    borderRadius: 22,
    paddingHorizontal: 11,
    backgroundColor:
      theme.colors.champagne,
    borderWidth: 1,
    borderColor:
      theme.colors.champagneLight,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.md,
  },

  captureFabPressed: {
    opacity: 0.92,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  captureFabIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor:
      theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  captureFabCopy: {
    flex: 1,
    marginHorizontal: 9,
  },

  captureFabEyebrow: {
    fontFamily:
      theme.typography.families
        .bodyBold,
    fontSize: 7,
    letterSpacing: 1.3,
    color:
      theme.colors.primary,
  },

  captureFabTitle: {
    marginTop: 1,
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 13,
    color:
      theme.colors.primaryDeep,
  },

  cardPressed: {
    opacity: 0.91,
    transform: [
      {
        scale: 0.995,
      },
    ],
  },
});