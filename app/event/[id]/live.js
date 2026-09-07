// app/event/[id]/live.js
// ============================================================
// EVERIA — Live Wall
// Refonte UI/UX complète
//
// Direction artistique :
// Immersive Social Live Wall / Editorial Gallery
//
// Fonctionnalités conservées :
// - Supabase Realtime
// - Chargement initial
// - Filtrage ready / published
// - Association des profils
// - Affichage des photos
// ============================================================

import React, { useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

import theme from '@/theme';
import Header from '@/components/ui/Header';
import EmptyState from '@/components/ui/EmptyState';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { supabase } from '@/lib/supabase';
import { fetchProfilesByIds } from '@/lib/profiles';
import { mediaThumbnail } from '@/lib/storage';

const SCREEN_WIDTH =
  Dimensions.get('window').width;

const HORIZONTAL_PADDING =
  theme.layout.screenHorizontal;

const GRID_GAP = 7;

const SMALL_TILE =
  (SCREEN_WIDTH -
    HORIZONTAL_PADDING * 2 -
    GRID_GAP) /
  2;

const LARGE_TILE =
  SCREEN_WIDTH -
  HORIZONTAL_PADDING * 2;

// ============================================================
// SCREEN
// ============================================================

export default function LiveWall() {
  const { id } = useLocalSearchParams();

  const {
    items: media,
    isLoading,
  } = useRealtimeList({
    table: 'media',
    filter: `event_id=eq.${id}`,

    initialFetch: async () => {
      const { data, error } =
        await supabase
          .from('media')
          .select(
            '*, guest:uploader_guest_id(display_name)'
          )
          .eq('event_id', id)
          .in('status', [
            'ready',
            'published',
          ])
          .order('created_at', {
            ascending: false,
          })
          .limit(60);

      if (error) {
        throw error;
      }

      const profilesById =
        await fetchProfilesByIds(
          (data || []).map(
            (item) =>
              item.uploader_user_id
          )
        );

      return (data || []).map(
        (item) => ({
          ...item,
          uploader_name:
            profilesById[
              item.uploader_user_id
            ]?.display_name ||
            item.guest
              ?.display_name ||
            'Invité',
        })
      );
    },

    sortFn: (a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at),
  });

  // ----------------------------------------------------------
  // PHOTO DATA
  // ----------------------------------------------------------

  const photos = useMemo(
    () =>
      (media || []).filter(
        (item) =>
          item.media_type === 'photo'
      ),
    [media]
  );

  const totalPhotos = photos.length;

  const latestPhoto = photos[0] || null;

  const remainingPhotos = photos.slice(
    1
  );

  // ==========================================================
  // HEADER
  // ==========================================================

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.liveIntro}>
        <View style={styles.liveIntroCopy}>
          <View style={styles.eyebrowRow}>
            <View
              style={styles.eyebrowLine}
            />

            <Text
              style={styles.eyebrow}
            >
              EVENT EN DIRECT
            </Text>
          </View>

          <Text style={styles.title}>
            Le moment se vit{'\n'}maintenant.
          </Text>

          <Text
            style={styles.subtitle}
          >
            Les souvenirs publiés par les
            participants apparaissent ici
            instantanément.
          </Text>
        </View>

        <View style={styles.liveOrb}>
          <View style={styles.liveOrbInner}>
            <Ionicons
              name="radio-outline"
              size={25}
              color={
                theme.colors.champagne
              }
            />
          </View>

          <View
            style={styles.liveOrbDot}
          />
        </View>
      </View>

      {/* ------------------------------------------------------
          LIVE STATUS
      ------------------------------------------------------ */}

      <View style={styles.statusCard}>
        <View style={styles.statusMain}>
          <View
            style={styles.statusDotWrap}
          >
            <View
              style={styles.statusDot}
            />
          </View>

          <View style={styles.statusCopy}>
            <Text
              style={styles.statusTitle}
            >
              EN DIRECT
            </Text>

            <Text
              style={styles.statusSubtitle}
            >
              Le mur évolue en temps réel
            </Text>
          </View>
        </View>

        <View
          style={styles.statusDivider}
        />

        <View style={styles.counterBlock}>
          <Text
            style={styles.counterValue}
          >
            {totalPhotos}
          </Text>

          <Text
            style={styles.counterLabel}
          >
            photos
          </Text>
        </View>
      </View>

      {/* ------------------------------------------------------
          LATEST MEMORY
      ------------------------------------------------------ */}

      {latestPhoto ? (
        <View style={styles.latestSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={styles.sectionEyebrow}
              >
                DERNIER SOUVENIR
              </Text>

              <Text
                style={styles.sectionTitle}
              >
                Tout juste partagé
              </Text>
            </View>

            <View
              style={
                styles.sectionHeaderIcon
              }
            >
              <Ionicons
                name="flash-outline"
                size={16}
                color={
                  theme.colors.champagneDark
                }
              />
            </View>
          </View>

          <Pressable
            onPress={() =>
              router.push(
                `/event/${id}/media/${latestPhoto.id}`
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
                  latestPhoto
                ),
              }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={300}
            />

            <LinearGradient
              colors={[
                'transparent',
                'rgba(22,10,24,0.90)',
              ]}
              style={styles.featuredOverlay}
            />

            <View
              style={styles.featuredBadge}
            >
              <View
                style={
                  styles.featuredBadgeDot
                }
              />

              <Text
                style={
                  styles.featuredBadgeText
                }
              >
                NOUVEAU
              </Text>
            </View>

            <View
              style={
                styles.featuredBottom
              }
            >
              <View
                style={
                  styles.featuredIdentity
                }
              >
                <View
                  style={
                    styles.featuredIcon
                  }
                >
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={
                      theme.colors.white
                    }
                  />
                </View>

                <View
                  style={
                    styles.featuredAuthorWrap
                  }
                >
                  <Text
                    style={
                      styles.featuredAuthor
                    }
                    numberOfLines={1}
                  >
                    {latestPhoto.uploader_name ||
                      'Invité'}
                  </Text>

                  <Text
                    style={
                      styles.featuredCaption
                    }
                  >
                    Vient de partager ce
                    souvenir
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.featuredArrow
                }
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={18}
                  color={
                    theme.colors.primaryDeep
                  }
                />
              </View>
            </View>
          </Pressable>
        </View>
      ) : null}

      {/* ------------------------------------------------------
          WALL HEADER
      ------------------------------------------------------ */}

      {remainingPhotos.length > 0 ? (
        <View
          style={styles.wallHeader}
        >
          <View>
            <Text
              style={styles.sectionEyebrow}
            >
              LE MUR
            </Text>

            <Text
              style={styles.sectionTitle}
            >
              Les souvenirs du moment
            </Text>
          </View>

          <View
            style={styles.wallLiveIndicator}
          >
            <Ionicons
              name="sparkles-outline"
              size={14}
              color={
                theme.colors.champagne
              }
            />

            <Text
              style={styles.wallLiveText}
            >
              LIVE
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  const emptyState =
    !isLoading && !photos.length ? (
      <View style={styles.emptyWrap}>
        <EmptyState
          dark
          icon="images-outline"
          title="Le mur est prêt"
          subtitle="Les photos publiées pendant l'événement apparaîtront ici instantanément."
        />
      </View>
    ) : null;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <View style={styles.screen}>
      <Header
        title="Live Wall"
        dark
        rightActions={[
          {
            icon: 'expand-outline',
            onPress: () => {},
          },
        ]}
      />

      <FlatList
        data={remainingPhotos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={
          remainingPhotos.length > 0
            ? styles.gridRow
            : undefined
        }
        contentContainerStyle={[
          styles.listContent,
          remainingPhotos.length === 0 &&
            styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={
          false
        }
        ListHeaderComponent={
          renderHeader()
        }
        ListEmptyComponent={
          emptyState
        }
        renderItem={({ item, index }) => (
          <LivePhotoTile
            media={item}
            id={id}
            index={index}
          />
        )}
      />
    </View>
  );
}

// ============================================================
// PHOTO TILE
// ============================================================

function LivePhotoTile({
  media,
  id,
  index,
}) {
  const isLarge =
    index % 7 === 0;

  return (
    <Pressable
      onPress={() =>
        router.push(
          `/event/${id}/media/${media.id}`
        )
      }
      style={({ pressed }) => [
        styles.photoTile,
        isLarge &&
          styles.photoTileLarge,
        pressed &&
          styles.cardPressed,
      ]}
    >
      <Image
        source={{
          uri: mediaThumbnail(media),
        }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={220}
      />

      <LinearGradient
        colors={[
          'transparent',
          'rgba(22,10,24,0.84)',
        ]}
        style={styles.tileGradient}
      />

      <View style={styles.tileTop}>
        <View
          style={styles.tileLivePill}
        >
          <View
            style={styles.tileLiveDot}
          />

          <Text
            style={styles.tileLiveText}
          >
            LIVE
          </Text>
        </View>
      </View>

      <View style={styles.tileBottom}>
        <Text
          style={styles.tileAuthor}
          numberOfLines={1}
        >
          {media.uploader_name ||
            'Invité'}
        </Text>

        <Ionicons
          name="arrow-up-outline"
          size={14}
          color={theme.colors.white}
        />
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
      theme.colors.darkBackground,
  },

  listContent: {
    paddingHorizontal:
      HORIZONTAL_PADDING,
    paddingBottom: 36,
  },

  listContentEmpty: {
    flexGrow: 1,
  },

  headerContent: {
    paddingTop: 18,
  },

  // ----------------------------------------------------------
  // INTRO
  // ----------------------------------------------------------

  liveIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
    marginBottom: 17,
  },

  liveIntroCopy: {
    flex: 1,
    paddingRight: 14,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  eyebrowLine: {
    width: 22,
    height: 1,
    marginRight: 7,
    backgroundColor:
      theme.colors.champagne,
  },

  eyebrow: {
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 8.5,
    letterSpacing: 1.7,
    color:
      theme.colors.champagneLight,
  },

  title: {
    fontFamily:
      theme.typography.families
        .displaySemiBold,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.4,
    color:
      theme.colors.white,
  },

  subtitle: {
    marginTop: 9,
    maxWidth: 325,
    fontFamily:
      theme.typography.families.body,
    fontSize: 11.5,
    lineHeight: 18,
    color:
      theme.colors.white60,
  },

  liveOrb: {
    width: 60,
    height: 60,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  liveOrbInner: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor:
      theme.colors.darkSurface,
    borderWidth: 1,
    borderColor:
      'rgba(217,184,120,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  liveOrbDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    right: 1,
    top: 0,
    backgroundColor:
      theme.colors.eventLive,
    borderWidth: 2,
    borderColor:
      theme.colors.darkBackground,
  },

  // ----------------------------------------------------------
  // STATUS CARD
  // ----------------------------------------------------------

  statusCard: {
    minHeight: 71,
    borderRadius: 20,
    backgroundColor:
      theme.colors.darkSurface,
    borderWidth: 1,
    borderColor:
      theme.colors.borderDark,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDotWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor:
      'rgba(201,81,100,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor:
      theme.colors.eventLive,
  },

  statusCopy: {
    marginLeft: 9,
  },

  statusTitle: {
    fontFamily:
      theme.typography.families
        .bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color:
      theme.colors.white,
  },

  statusSubtitle: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    color:
      theme.colors.white40,
  },

  statusDivider: {
    width: 1,
    height: 33,
    backgroundColor:
      theme.colors.dividerDark,
    marginHorizontal: 13,
  },

  counterBlock: {
    alignItems: 'flex-end',
    minWidth: 46,
  },

  counterValue: {
    fontFamily:
      theme.typography.families
        .displaySemiBold,
    fontSize: 21,
    lineHeight: 24,
    color:
      theme.colors.champagne,
  },

  counterLabel: {
    marginTop: 1,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8,
    color:
      theme.colors.white40,
  },

  // ----------------------------------------------------------
  // FEATURED
  // ----------------------------------------------------------

  latestSection: {
    marginTop: 25,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent:
      'space-between',
    marginBottom: 10,
  },

  sectionEyebrow: {
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 8,
    letterSpacing: 1.7,
    color:
      theme.colors.champagne,
  },

  sectionTitle: {
    marginTop: 3,
    fontFamily:
      theme.typography.families
        .displaySemiBold,
    fontSize: 21,
    lineHeight: 26,
    color:
      theme.colors.white,
  },

  sectionHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor:
      'rgba(217,184,120,0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(217,184,120,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featuredCard: {
    height: 282,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor:
      theme.colors.darkSurface2,
  },

  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  featuredBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    height: 25,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor:
      'rgba(22,10,24,0.66)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.12)',
  },

  featuredBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.eventLive,
  },

  featuredBadgeText: {
    fontFamily:
      theme.typography.families
        .bodyBold,
    fontSize: 7.5,
    letterSpacing: 1,
    color:
      theme.colors.white,
  },

  featuredBottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 60,
    paddingLeft: 9,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor:
      'rgba(22,10,24,0.72)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  featuredIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  featuredIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor:
      'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featuredAuthorWrap: {
    flex: 1,
    marginLeft: 8,
  },

  featuredAuthor: {
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 11.5,
    color:
      theme.colors.white,
  },

  featuredCaption: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8.5,
    color:
      theme.colors.white60,
  },

  featuredArrow: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor:
      theme.colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ----------------------------------------------------------
  // WALL HEADER
  // ----------------------------------------------------------

  wallHeader: {
    marginTop: 26,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent:
      'space-between',
  },

  wallLiveIndicator: {
    marginBottom: 3,
    height: 27,
    borderRadius: 999,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor:
      'rgba(217,184,120,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(217,184,120,0.14)',
  },

  wallLiveText: {
    fontFamily:
      theme.typography.families
        .bodyBold,
    fontSize: 7.5,
    letterSpacing: 1,
    color:
      theme.colors.champagne,
  },

  // ----------------------------------------------------------
  // GRID
  // ----------------------------------------------------------

  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  photoTile: {
    width: SMALL_TILE,
    height: SMALL_TILE,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor:
      theme.colors.darkSurface2,
  },

  photoTileLarge: {
    width: LARGE_TILE,
    height: 225,
  },

  tileGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  tileTop: {
    position: 'absolute',
    top: 8,
    left: 8,
  },

  tileLivePill: {
    height: 20,
    borderRadius: 999,
    paddingHorizontal: 6,
    backgroundColor:
      'rgba(22,10,24,0.58)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  tileLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      theme.colors.eventLive,
  },

  tileLiveText: {
    fontFamily:
      theme.typography.families
        .bodyBold,
    fontSize: 6.5,
    letterSpacing: 0.8,
    color:
      theme.colors.white,
  },

  tileBottom: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
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
    fontSize: 9.5,
    color:
      theme.colors.white,
  },

  // ----------------------------------------------------------
  // EMPTY
  // ----------------------------------------------------------

  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 90,
  },

  // ----------------------------------------------------------
  // PRESS
  // ----------------------------------------------------------

  cardPressed: {
    opacity: 0.92,
    transform: [
      {
        scale: 0.995,
      },
    ],
  },
});