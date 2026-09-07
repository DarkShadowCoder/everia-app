// app/event/[id]/replay.js
// ============================================================
// EVERIA — Replay
// ============================================================

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Video,
  ResizeMode,
} from 'expo-av';

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
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

import {
  useAuthStore,
} from '@/store/authStore';

import {
  useSupabaseQuery,
} from '@/hooks/useSupabaseQuery';

import {
  getReplay,
  getReplayItems,
  regenerateAndRenderReplay,
  getSignedReplayUrl,
} from '@/lib/replayEngine';

import {
  mediaThumbnail,
} from '@/lib/storage';

export default function Replay() {
  const {
    id,
  } =
    useLocalSearchParams();

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const [
    scope,
    setScope,
  ] =
    useState('event');

  const [
    rendering,
    setRendering,
  ] =
    useState(false);

  const [
    videoUrl,
    setVideoUrl,
  ] =
    useState(null);

  const kind =
    scope === 'mine'
      ? 'personal'
      : 'best_of';

  const {
    data: replay,
    isLoading,
    refresh,
  } =
    useSupabaseQuery(
      () =>
        getReplay(
          id,
          kind,
          user?.id
        ),
      [
        id,
        kind,
        user?.id,
      ]
    );

  const {
    data: items = [],
    refresh:
      refreshItems,
  } =
    useSupabaseQuery(
      () =>
        getReplayItems(
          replay?.id
        ),
      [replay?.id]
    );

  const ready =
    [
      'ready',
      'published',
    ].includes(
      replay?.status
    ) &&
    !!replay?.output_path;

  useEffect(
    () => {
      let mounted =
        true;

      (async () => {
        if (!ready) {
          if (mounted) {
            setVideoUrl(
              null
            );
          }

          return;
        }

        const url =
          await getSignedReplayUrl(
            replay.output_path,
            3600
          ).catch(
            () => null
          );

        if (mounted) {
          setVideoUrl(
            url
          );
        }
      })();

      return () => {
        mounted = false;
      };
    },
    [
      ready,
      replay?.output_path,
    ]
  );

  const render =
    useCallback(
      async () => {
        setRendering(
          true
        );

        try {
          const result =
            await regenerateAndRenderReplay(
              id,
              {
                kind,
              }
            );

          await Promise.all([
            refresh(),
            refreshItems(),
          ]);

          const url =
            result
              ?.replay
              ?.output_path
              ? await getSignedReplayUrl(
                  result
                    .replay
                    .output_path,
                  3600
                )
              : null;

          setVideoUrl(
            url
          );

          Alert.alert(
            'Replay prêt',
            'Votre film Everia est maintenant disponible.'
          );
        } catch (
          error
        ) {
          Alert.alert(
            'Rendu impossible',
            error?.message ||
              'Le moteur de rendu n’a pas pu terminer le Replay.'
          );
        } finally {
          setRendering(
            false
          );
        }
      },
      [
        id,
        kind,
        refresh,
        refreshItems,
      ]
    );

  const totalDuration =
    useMemo(
      () => {
        const duration =
          Number(
            replay?.duration_ms ||
              0
          ) ||
          items.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.duration_ms ||
                  0
              ),
            0
          );

        return Math.round(
          duration / 1000
        );
      },
      [
        replay?.duration_ms,
        items,
      ]
    );

  return (
    <View
      style={
        styles.screen
      }
    >
      <Header
        title="Replay"
        subtitle={
          scope ===
          'event'
            ? 'Best Of de l’événement'
            : 'Mon Replay'
        }
        dark
      />

      <ScrollView
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
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.switcher
          }
        >
          <Button
            title="Event Replay"
            variant={
              scope ===
              'event'
                ? 'gold'
                : 'outline'
            }
            fullWidth={false}
            size="sm"
            onPress={() =>
              setScope(
                'event'
              )
            }
            style={
              styles.switchButton
            }
          />

          <Button
            title="Mon Replay"
            variant={
              scope ===
              'mine'
                ? 'gold'
                : 'outline'
            }
            fullWidth={false}
            size="sm"
            onPress={() =>
              setScope(
                'mine'
              )
            }
            style={
              styles.switchButton
            }
          />
        </View>

        {videoUrl ? (
          <View
            style={
              styles.videoWrap
            }
          >
            <Video
              source={{
                uri:
                  videoUrl,
              }}
              style={
                StyleSheet.absoluteFillObject
              }
              resizeMode={
                ResizeMode.COVER
              }
              useNativeControls
            />

            <View
              style={
                styles.videoBadge
              }
            >
              <Ionicons
                name="checkmark-circle"
                size={15}
                color={
                  theme.colors
                    .champagneLight
                }
              />

              <Text
                style={
                  styles.videoBadgeText
                }
              >
                FILM DISPONIBLE
              </Text>
            </View>
          </View>
        ) : (
          <LinearGradient
            colors={
              theme.gradients
                .plumGold
            }
            style={
              styles.hero
            }
          >
            <Ionicons
              name="film-outline"
              size={34}
              color={
                theme.colors
                  .champagneLight
              }
            />

            <Text
              style={
                styles.heroTitle
              }
            >
              {replay
                ? 'Votre histoire est prête à être rendue.'
                : 'Construisez votre histoire.'}
            </Text>

            <Text
              style={
                styles.heroText
              }
            >
              {replay
                ? `${items.length} séquences · ${
                    totalDuration ||
                    '—'
                  } s`
                : 'Everia va sélectionner les meilleurs souvenirs puis créer le film.'}
            </Text>

            <Button
              title={
                rendering
                  ? 'Rendu en cours…'
                  : 'Générer le film'
              }
              variant="gold"
              onPress={
                render
              }
              loading={
                rendering
              }
              style={{
                marginTop:
                  18,
              }}
            />
          </LinearGradient>
        )}

        {replay?.render_error ? (
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
                replay.render_error
              }
            </Text>
          </View>
        ) : null}

        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Séquences
          </Text>

          <Text
            style={
              styles.count
            }
          >
            {
              items.length
            }
          </Text>
        </View>

        {items.length ? (
          <View
            style={
              styles.grid
            }
          >
            {items.map(
              (item) => (
                <View
                  key={
                    item.id
                  }
                  style={
                    styles.tile
                  }
                >
                  <View
                    style={
                      styles.tileImage
                    }
                  >
                    {item.media ? (
                      <ImageTile
                        media={
                          item.media
                        }
                      />
                    ) : (
                      <Ionicons
                        name="text-outline"
                        size={20}
                        color={
                          theme.colors
                            .white
                        }
                      />
                    )}

                    <View
                      style={
                        styles.tileOverlay
                      }
                    >
                      <Text
                        style={
                          styles.tileDuration
                        }
                      >
                        {Math.round(
                          Number(
                            item.duration_ms ||
                              0
                          ) /
                            1000
                        )}
                        s
                      </Text>
                    </View>
                  </View>
                </View>
              )
            )}
          </View>
        ) : (
          <EmptyState
            icon="film-outline"
            title="Aucune séquence"
            subtitle="Publiez quelques souvenirs puis générez votre Replay."
          />
        )}
      </ScrollView>
    </View>
  );
}

function ImageTile({
  media,
}) {
  const {
    Image,
  } =
    require(
      'expo-image'
    );

  return (
    <Image
      source={{
        uri:
          mediaThumbnail(
            media
          ),
      }}
      style={
        StyleSheet.absoluteFillObject
      }
      contentFit="cover"
    />
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        theme.screens
          .replay,
    },

    content: {
      paddingHorizontal:
        theme.layout
          .screenHorizontal,
      paddingBottom: 44,
    },

    switcher: {
      flexDirection:
        'row',
      gap: 8,
      marginBottom: 14,
    },

    switchButton: {
      flex: 1,
    },

    hero: {
      padding: 22,
      borderRadius: 24,
      overflow: 'hidden',
      marginBottom: 16,
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
      marginTop: 11,
    },

    heroText: {
      color:
        theme.colors
          .white60,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 6,
    },

    videoWrap: {
      height: 440,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor:
        theme.colors
          .darkSurface,
      marginBottom: 17,
    },

    videoBadge: {
      position:
        'absolute',
      left: 13,
      top: 13,
      flexDirection:
        'row',
      gap: 6,
      alignItems:
        'center',
      backgroundColor:
        'rgba(33,16,34,0.76)',
      borderRadius:
        999,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },

    videoBadgeText: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 8,
      letterSpacing: 1,
    },

    error: {
      flexDirection:
        'row',
      gap: 8,
      padding: 12,
      borderRadius: 14,
      backgroundColor:
        'rgba(184,92,104,0.12)',
      marginBottom: 15,
    },

    errorText: {
      flex: 1,
      color:
        theme.colors
          .error,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 11,
    },

    sectionHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 11,
    },

    sectionTitle: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 20,
      flex: 1,
    },

    count: {
      color:
        theme.colors
          .white40,
      fontFamily:
        theme.typography
          .families
          .bodyMedium,
      fontSize: 11,
    },

    grid: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 8,
    },

    tile: {
      width: '31.8%',
    },

    tileImage: {
      aspectRatio:
        0.75,
      borderRadius: 13,
      overflow: 'hidden',
      backgroundColor:
        theme.colors
          .darkSurface2,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    tileOverlay: {
      position:
        'absolute',
      left: 7,
      bottom: 7,
      backgroundColor:
        'rgba(0,0,0,0.55)',
      borderRadius:
        999,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },

    tileDuration: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 8,
    },
  });