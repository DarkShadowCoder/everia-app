
// app/event/[id]/replay.js
// ============================================================
// EVERIA — Best Of / Replay
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
  ResizeMode,
  Video,
} from 'expo-av';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import theme from '@/theme';

import Header from '@/components/ui/Header';
import SegmentedControl from '@/components/ui/SegmentedControl';
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
  publicMediaUrl,
} from '@/lib/storage';

import {
  refreshEventStory,
} from '@/lib/storyEngine';

// ============================================================
// HELPERS
// ============================================================

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

// ============================================================
// MAIN
// ============================================================

export default function Replay() {
  const {
    id,
  } = useLocalSearchParams();

  const {
    user,
  } = useAuthStore();

  const eventId = Array.isArray(id)
    ? id[0]
    : id;

  const userId = user?.id || null;

  const [
    scope,
    setScope,
  ] = useState('event');

  const [
    generating,
    setGenerating,
  ] = useState(false);

  // ==========================================================
  // REPLAY
  // ==========================================================

  const {
    data: replay,
    isLoading: replayLoading,
    refresh: refreshReplay,
  } = useSupabaseQuery(
    async () => {
      if (!eventId) {
        return null;
      }

      let query =
        supabase
          .from('replays')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', {
            ascending: false,
          })
          .limit(1);

      if (scope === 'mine') {
        if (!userId) {
          return null;
        }

        query = query
          .eq('kind', 'personal')
          .eq('owner_user_id', userId);
      } else {
        query = query.eq(
          'kind',
          'best_of'
        );
      }

      const {
        data,
        error,
      } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      return data || null;
    },
    [
      eventId,
      scope,
      userId,
    ]
  );

  // ==========================================================
  // BEST OF FALLBACK
  // ==========================================================

  const {
    data: bestOf,
    isLoading: bestOfLoading,
    refresh: refreshBestOf,
  } = useSupabaseQuery(
    async () => {
      if (
        !eventId ||
        scope !== 'event'
      ) {
        return null;
      }

      const {
        data: highlight,
        error: highlightError,
      } =
        await supabase
          .from('highlights')
          .select('*')
          .eq('event_id', eventId)
          .eq(
            'selection_method',
            'automatic_ai'
          )
          .order('rank', {
            ascending: true,
          })
          .limit(1)
          .maybeSingle();

      if (highlightError) {
        throw highlightError;
      }

      if (!highlight) {
        return null;
      }

      const {
        data: rows,
        error,
      } =
        await supabase
          .from('highlight_media')
          .select('media(*)')
          .eq(
            'highlight_id',
            highlight.id
          )
          .order('sort_order', {
            ascending: true,
          });

      if (error) {
        throw error;
      }

      const safeRows =
        asArray(rows);

      const safeMedia =
        safeRows
          .map(
            (row) =>
              row?.media || null
          )
          .filter(Boolean);

      return {
        ...highlight,
        media: safeMedia,
      };
    },
    [
      eventId,
      scope,
    ]
  );

  // ==========================================================
  // REPLAY ITEMS
  // ==========================================================

  const {
    data: replayMedia,
    isLoading: replayMediaLoading,
  } = useSupabaseQuery(
    async () => {
      if (!replay?.id) {
        return [];
      }

      const {
        data,
        error,
      } =
        await supabase
          .from('replay_items')
          .select('media(*)')
          .eq(
            'replay_id',
            replay.id
          )
          .order('sort_order', {
            ascending: true,
          });

      if (error) {
        throw error;
      }

      return asArray(data)
        .map(
          (row) =>
            row?.media || null
        )
        .filter(Boolean);
    },
    [
      replay?.id,
    ]
  );

  // ==========================================================
  // NORMALIZED MEDIA
  // ==========================================================

  const media = useMemo(() => {
    const directReplayMedia =
      asArray(replayMedia);

    if (
      directReplayMedia.length > 0
    ) {
      return directReplayMedia;
    }

    if (
      scope === 'event'
    ) {
      return asArray(
        bestOf?.media
      );
    }

    return [];
  }, [
    replayMedia,
    bestOf,
    scope,
  ]);

  // ==========================================================
  // LOADING
  // ==========================================================

  const effectiveLoading =
    Boolean(
      replayLoading ||
      bestOfLoading ||
      replayMediaLoading
    );

  // ==========================================================
  // VIDEO STATE
  // ==========================================================

  const replayOutputPath =
    safeString(
      replay?.output_path
    );

  const replayStatus =
    safeString(
      replay?.status
    );

  const isVideoReady =
    Boolean(
      replayOutputPath &&
      (
        replayStatus === 'ready' ||
        replayStatus === 'published' ||
        replayStatus === 'completed'
      )
    );

  const replayVideoUrl =
    useMemo(() => {
      if (
        !isVideoReady ||
        !replayOutputPath
      ) {
        return null;
      }

      try {
        const url =
          publicMediaUrl(
            replayOutputPath,
            'replays'
          );

        return safeString(
          url
        ) || null;
      } catch (
        error
      ) {
        console.warn(
          '[Everia Replay] Impossible de construire l’URL vidéo:',
          error?.message || error
        );

        return null;
      }
    }, [
      isVideoReady,
      replayOutputPath,
    ]);

  // ==========================================================
  // GENERATE / REFRESH
  // ==========================================================

  const regenerate =
    useCallback(
      async () => {
        if (
          !eventId ||
          generating
        ) {
          return;
        }

        setGenerating(true);

        try {
          await refreshEventStory(
            eventId
          );

          await Promise.all([
            refreshReplay(),
            refreshBestOf(),
          ]);

          Alert.alert(
            'Best Of actualisé',
            'Everia a recalculé automatiquement les meilleurs souvenirs de cet événement.'
          );
        } catch (
          error
        ) {
          console.error(
            '[Everia Replay] regenerate:',
            error
          );

          Alert.alert(
            'Erreur',
            error?.message ||
              'Impossible de recalculer le Best Of.'
          );
        } finally {
          setGenerating(false);
        }
      },
      [
        eventId,
        generating,
        refreshReplay,
        refreshBestOf,
      ]
    );

  // ==========================================================
  // HERO VIDEO
  // ==========================================================

  const renderVideo =
    () => {
      if (
        isVideoReady &&
        replayVideoUrl
      ) {
        return (
          <View
            style={
              styles.videoCard
            }
          >
            <Video
              source={{
                uri:
                  replayVideoUrl,
              }}
              style={
                StyleSheet.absoluteFillObject
              }
              resizeMode={
                ResizeMode.COVER
              }
              useNativeControls
              shouldPlay={false}
            />

            <View
              pointerEvents="none"
              style={
                styles.videoOverlay
              }
            />

            <View
              style={
                styles.readyBadge
              }
            >
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={
                  theme.colors
                    .champagneLight
                }
              />

              <Text
                style={
                  styles.readyBadgeText
                }
              >
                FILM DISPONIBLE
              </Text>
            </View>
          </View>
        );
      }

      return (
        <View
          style={
            styles.processingCard
          }
        >
          <LinearGradient
            colors={[
              ...asArray(
                theme.gradients
                  ?.darkLuxury
              ),
            ]}
            style={
              StyleSheet.absoluteFillObject
            }
          />

          <View
            style={
              styles.processingIcon
            }
          >
            <Ionicons
              name="sparkles-outline"
              size={28}
              color={
                theme.colors
                  .champagneLight
              }
            />
          </View>

          <Text
            style={
              styles.processingTitle
            }
          >
            {replayStatus ===
            'processing'
              ? 'Votre Replay est en cours de création'
              : 'Votre Best Of est prêt'}
          </Text>

          <Text
            style={
              styles.processingDescription
            }
          >
            {replayStatus ===
            'processing'
              ? 'Everia prépare votre film à partir des souvenirs sélectionnés.'
              : 'Everia a déjà sélectionné automatiquement les meilleurs souvenirs. La vidéo finale peut maintenant être rendue.'}
          </Text>

          <View
            style={
              styles.processingState
            }
          >
            <Ionicons
              name="images-outline"
              size={15}
              color={
                theme.colors
                  .champagneLight
              }
            />

            <Text
              style={
                styles.processingStateText
              }
            >
              {media.length}{' '}
              souvenirs sélectionnés
            </Text>
          </View>
        </View>
      );
    };

  // ==========================================================
  // HEADER
  // ==========================================================

  const renderHeader =
    () => (
      <View>
        <View
          style={
            styles.intro
          }
        >
          <View
            style={
              styles.introCopy
            }
          >
            <Text
              style={
                styles.eyebrow
              }
            >
              EVERIA STORY ENGINE
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Revivez ce qui mérite
              de rester.
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Everia sélectionne automatiquement
              les souvenirs les plus forts de votre
              événement en tenant compte de leur
              qualité, diversité et contexte.
            </Text>
          </View>

          <Pressable
            onPress={
              regenerate
            }
            disabled={
              generating
            }
            style={[
              styles.refreshButton,
              generating &&
                styles.refreshButtonDisabled,
            ]}
          >
            {generating ? (
              <ActivityIndicator
                size="small"
                color={
                  theme.colors
                    .champagneLight
                }
              />
            ) : (
              <Ionicons
                name="sparkles-outline"
                size={20}
                color={
                  theme.colors
                    .champagneLight
                }
              />
            )}
          </Pressable>
        </View>

        <View
          style={
            styles.segment
          }
        >
          <SegmentedControl
            dark
            options={[
              {
                value: 'event',
                label:
                  'Best Of événement',
              },
              {
                value: 'mine',
                label:
                  'Mon Replay',
              },
            ]}
            value={scope}
            onChange={
              setScope
            }
          />
        </View>

        {renderVideo()}

        <View
          style={
            styles.metaCard
          }
        >
          <View
            style={
              styles.metaIcon
            }
          >
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={
                theme.colors
                  .primary
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
                styles.metaEyebrow
              }
            >
              {scope === 'event'
                ? 'BEST OF AUTOMATIQUE'
                : 'REPLAY PERSONNEL'}
            </Text>

            <Text
              style={
                styles.metaTitle
              }
            >
              {safeString(
                replay?.title
              ) ||
                safeString(
                  bestOf?.name
                ) ||
                (
                  scope === 'event'
                    ? 'Best Of'
                    : 'Mon Replay'
                )}
            </Text>

            <Text
              style={
                styles.metaDescription
              }
            >
              {scope === 'event'
                ? `${media.length} souvenirs retenus automatiquement par Everia.`
                : 'Votre expérience personnelle racontée à travers les souvenirs qui vous ressemblent.'}
            </Text>
          </View>
        </View>

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
              SÉLECTION IA
            </Text>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Les souvenirs retenus
            </Text>
          </View>

          <View
            style={
              styles.countPill
            }
          >
            <Text
              style={
                styles.countText
              }
            >
              {media.length}
            </Text>
          </View>
        </View>
      </View>
    );

  // ==========================================================
  // RENDER MEDIA
  // ==========================================================

  const renderMediaItem =
    ({
      item,
      index,
    }) => {
      if (!item?.id) {
        return null;
      }

      let thumbnailUrl =
        null;

      try {
        thumbnailUrl =
          safeString(
            mediaThumbnail(
              item
            )
          ) || null;
      } catch (
        error
      ) {
        console.warn(
          '[Everia Replay] Thumbnail error:',
          error?.message || error
        );
      }

      return (
        <Pressable
          onPress={() =>
            router.push(
              `/event/${eventId}/media/${item.id}`
            )
          }
          style={
            styles.mediaTile
          }
        >
          {thumbnailUrl ? (
            <Image
              source={{
                uri:
                  thumbnailUrl,
              }}
              style={
                StyleSheet.absoluteFillObject
              }
              contentFit="cover"
              transition={180}
            />
          ) : (
            <View
              style={
                styles.mediaPlaceholder
              }
            >
              <Ionicons
                name="image-outline"
                size={24}
                color={
                  theme.colors
                    .white40
                }
              />
            </View>
          )}

          <LinearGradient
            colors={[
              'rgba(20,8,22,0.00)',
              'rgba(20,8,22,0.75)',
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
              styles.indexPill
            }
          >
            <Text
              style={
                styles.indexText
              }
            >
              {String(
                index + 1
              ).padStart(
                2,
                '0'
              )}
            </Text>
          </View>

          {item.media_type ===
          'video' ? (
            <View
              style={
                styles.videoIcon
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
        </Pressable>
      );
    };

  // ==========================================================
  // SCREEN
  // ==========================================================

  return (
    <View
      style={
        styles.screen
      }
    >
      <Header
        title="Best Of"
        subtitle="L’histoire sélectionnée par Everia"
        dark
      />

      <FlatList
        data={asArray(media)}
        keyExtractor={
          (item, index) =>
            String(
              item?.id ||
              `media-${index}`
            )
        }
        numColumns={2}
        columnWrapperStyle={
          styles.gridRow
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
        refreshing={
          effectiveLoading ||
          generating
        }
        onRefresh={
          refreshBestOf
        }
        ListHeaderComponent={
          renderHeader
        }
        ListEmptyComponent={
          !effectiveLoading &&
          !generating ? (
            <EmptyState
              dark
              icon="sparkles-outline"
              title="Best Of en préparation"
              subtitle="Everia attend suffisamment de souvenirs pour construire une sélection pertinente."
            />
          ) : null
        }
        renderItem={
          renderMediaItem
        }
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
          .replay,
    },

    intro: {
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      justifyContent:
        'space-between',
      marginTop:
        14,
      marginBottom:
        18,
    },

    introCopy: {
      flex: 1,
      paddingRight:
        18,
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
        1.6,
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
        28,
      lineHeight:
        34,
      marginTop:
        7,
    },

    subtitle: {
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
        9,
    },

    refreshButton: {
      width:
        42,
      height:
        42,
      borderRadius:
        21,
      backgroundColor:
        'rgba(255,255,255,0.07)',
      borderWidth:
        1,
      borderColor:
        theme.colors
          .white10,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    refreshButtonDisabled: {
      opacity:
        0.55,
    },

    segment: {
      marginBottom:
        18,
    },

    videoCard: {
      height:
        270,
      borderRadius:
        24,
      overflow:
        'hidden',
      marginBottom:
        16,
      backgroundColor:
        theme.colors
          .surfaceDark2,
    },

    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        'rgba(0,0,0,0.12)',
    },

    readyBadge: {
      position:
        'absolute',
      left:
        14,
      top:
        14,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap:
        6,
      backgroundColor:
        'rgba(22,10,24,0.78)',
      paddingHorizontal:
        10,
      paddingVertical:
        7,
      borderRadius:
        999,
    },

    readyBadgeText: {
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
        1.2,
    },

    processingCard: {
      minHeight:
        270,
      borderRadius:
        24,
      overflow:
        'hidden',
      marginBottom:
        16,
      paddingHorizontal:
        24,
      paddingVertical:
        28,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    processingIcon: {
      width:
        62,
      height:
        62,
      borderRadius:
        22,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(217,184,120,0.10)',
      marginBottom:
        16,
    },

    processingTitle: {
      color:
        theme.colors
          .white,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize:
        21,
      textAlign:
        'center',
    },

    processingDescription: {
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
      textAlign:
        'center',
      marginTop:
        10,
      maxWidth:
        320,
    },

    processingState: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop:
        18,
      gap:
        7,
    },

    processingStateText: {
      color:
        theme.colors
          .champagneLight,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize:
        11,
    },

    metaCard: {
      flexDirection:
        'row',
      gap:
        14,
      backgroundColor:
        theme.colors
          .surfaceDark2,
      borderRadius:
        22,
      borderWidth:
        1,
      borderColor:
        theme.colors
          .white10,
      padding:
        16,
      marginBottom:
        28,
    },

    metaIcon: {
      width:
        40,
      height:
        40,
      borderRadius:
        14,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(217,184,120,0.10)',
    },

    metaEyebrow: {
      color:
        theme.colors
          .champagneLight,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize:
        8,
      letterSpacing:
        1.2,
    },

    metaTitle: {
      color:
        theme.colors
          .white,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize:
        18,
      marginTop:
        4,
    },

    metaDescription: {
      color:
        theme.colors
          .white60,
      fontFamily:
        theme.typography
          .families
          .body,
      fontSize:
        11,
      lineHeight:
        17,
      marginTop:
        5,
    },

    sectionHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom:
        14,
    },

    sectionEyebrow: {
      color:
        theme.colors
          .champagneLight,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize:
        8,
      letterSpacing:
        1.4,
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
        5,
    },

    countPill: {
      minWidth:
        34,
      height:
        34,
      paddingHorizontal:
        10,
      borderRadius:
        17,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        theme.colors
          .champagne,
    },

    countText: {
      color:
        theme.colors
          .primaryDark,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize:
        11,
    },

    gridRow: {
      gap:
        12,
      marginBottom:
        12,
    },

    mediaTile: {
      flex: 1,
      height:
        190,
      borderRadius:
        20,
      overflow:
        'hidden',
      backgroundColor:
        theme.colors
          .surfaceDark2,
    },

    mediaPlaceholder: {
      ...StyleSheet.absoluteFillObject,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        theme.colors
          .surfaceDark2,
    },

    indexPill: {
      position:
        'absolute',
      top:
        10,
      left:
        10,
      minWidth:
        28,
      height:
        26,
      paddingHorizontal:
        8,
      borderRadius:
        13,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(22,10,24,0.72)',
    },

    indexText: {
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
        0.8,
    },

    videoIcon: {
      position:
        'absolute',
      right:
        10,
      bottom:
        10,
      width:
        26,
      height:
        26,
      borderRadius:
        13,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(22,10,24,0.78)',
    },
  });
