// app/event/[id]/media/[mediaId].js
// ============================================================
// EVERIA — Media Viewer
// Refonte UI/UX : Immersive Editorial + Premium Glass
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import theme from '@/theme';
import IconButton from '@/components/ui/IconButton';
import ReactionBar from '@/components/event/ReactionBar';
import CommentSheet from '@/components/event/CommentSheet';
import Avatar from '@/components/ui/Avatar';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { mediaFullUrl } from '@/lib/storage';
import { fetchProfilesByIds } from '@/lib/profiles';
import { useAuthStore } from '@/store/authStore';
import { formatRelative } from '@/lib/format';

// ============================================================
// HELPERS
// ============================================================

function normalizeParam(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getMediaLabel(type) {
  return type === 'video' ? 'VIDÉO' : 'PHOTO';
}

function getVisibilityLabel(media) {
  if (media?.visibility === 'private') return 'Privé';
  if (media?.visibility === 'members') return 'Participants';
  return 'Événement';
}

// ============================================================
// SMALL UI PIECES
// ============================================================

function FloatingPill({ icon, label }) {
  return (
    <View style={styles.floatingPill}>
      <Ionicons
        name={icon}
        size={12}
        color={theme.colors.white80}
      />

      <Text style={styles.floatingPillText}>
        {label}
      </Text>
    </View>
  );
}

function MetaChip({ icon, label }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons
        name={icon}
        size={12}
        color={theme.colors.champagneLight}
      />

      <Text style={styles.metaChipText}>
        {label}
      </Text>
    </View>
  );
}

// ============================================================
// MAIN SCREEN
// ============================================================

export default function MediaViewer() {
  const params = useLocalSearchParams();

  const id = normalizeParam(params.id);
  const mediaId = normalizeParam(params.mediaId);

  const { user } = useAuthStore();

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [sharing, setSharing] = useState(false);

  // ----------------------------------------------------------
  // MEDIA
  // ----------------------------------------------------------

  const {
    data: media,
    isLoading: mediaLoading,
  } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('media')
      .select(
        '*, guest:uploader_guest_id(display_name, avatar_path)'
      )
      .eq('id', mediaId)
      .single();

    if (error) throw error;

    const profilesById = await fetchProfilesByIds(
      data.uploader_user_id
        ? [data.uploader_user_id]
        : []
    );

    const profile =
      profilesById[data.uploader_user_id];

    return {
      ...data,
      uploader_name:
        profile?.display_name ||
        data.guest?.display_name,
      uploader_avatar:
        profile?.avatar_path ||
        data.guest?.avatar_path,
    };
  }, [mediaId]);

  // ----------------------------------------------------------
  // REACTIONS
  // ----------------------------------------------------------

  const {
    data: reactionInfo,
    refresh: refreshReactions,
  } = useSupabaseQuery(async () => {
    const { count } = await supabase
      .from('media_reactions')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('media_id', mediaId);

    const { data: mine } = await supabase
      .from('media_reactions')
      .select('reaction')
      .eq('media_id', mediaId)
      .eq('user_id', user?.id)
      .maybeSingle();

    return {
      count: count || 0,
      mine: mine?.reaction || null,
    };
  }, [mediaId, user?.id]);

  // ----------------------------------------------------------
  // COMMENTS
  // ----------------------------------------------------------

  const {
    data: comments,
    refresh: refreshComments,
  } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('media_id', mediaId)
      .order('created_at', {
        ascending: true,
      });

    if (error) throw error;

    const profilesById =
      await fetchProfilesByIds(
        (data || []).map(
          (comment) => comment.user_id
        )
      );

    return (data || []).map((comment) => ({
      ...comment,
      author_name:
        profilesById[comment.user_id]
          ?.display_name,
      author_avatar:
        profilesById[comment.user_id]
          ?.avatar_path,
    }));
  }, [mediaId]);

  // ----------------------------------------------------------
  // FAVORITE
  // ----------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!user?.id || !mediaId) return;

      const { data } = await supabase
        .from('user_favorites')
        .select('media_id')
        .eq('media_id', mediaId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (mounted) {
        setIsFavorite(!!data);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [mediaId, user?.id]);

  const toggleFavorite = async () => {
    const nextValue = !isFavorite;

    setIsFavorite(nextValue);

    try {
      const { error } = nextValue
        ? await supabase.rpc(
            'add_favorite',
            {
              p_media_id: mediaId,
            }
          )
        : await supabase.rpc(
            'remove_favorite',
            {
              p_media_id: mediaId,
            }
          );

      if (error) throw error;
    } catch (error) {
      setIsFavorite(!nextValue);

      Alert.alert(
        'Action impossible',
        error?.message ||
          'Impossible de modifier le favori.'
      );
    }
  };

  // ----------------------------------------------------------
  // SHARE
  // ----------------------------------------------------------

  const handleShare = async () => {
    const url = mediaFullUrl(media);

    if (!url || sharing) return;

    setSharing(true);

    try {
      const fileName =
        media.file_name || 'everia-media';

      const localPath = `${FileSystem.cacheDirectory}${fileName}`;

      const { uri } =
        await FileSystem.downloadAsync(
          url,
          localPath
        );

      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert(
        'Partage impossible',
        'Une erreur est survenue lors du partage du média.'
      );
    } finally {
      setSharing(false);
    }
  };

  // ----------------------------------------------------------
  // METADATA
  // ----------------------------------------------------------

  const metadata = useMemo(() => {
    const items = [
      {
        icon:
          media?.media_type === 'video'
            ? 'videocam-outline'
            : 'image-outline',

        label: getMediaLabel(
          media?.media_type
        ),
      },

      {
        icon: 'globe-outline',
        label: getVisibilityLabel(media),
      },
    ];

    if (
      media?.captured_at ||
      media?.created_at
    ) {
      items.push({
        icon: 'time-outline',
        label: formatRelative(
          media.captured_at ||
            media.created_at
        ),
      });
    }

    return items;
  }, [media]);

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (mediaLoading && !media) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="small"
          color={theme.colors.champagneLight}
        />

        <Text style={styles.loadingText}>
          Ouverture du souvenir…
        </Text>
      </View>
    );
  }

  // ----------------------------------------------------------
  // NOT FOUND
  // ----------------------------------------------------------

  if (!media) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.missingIcon}>
          <Ionicons
            name="image-outline"
            size={24}
            color={theme.colors.champagneLight}
          />
        </View>

        <Text style={styles.missingTitle}>
          Média introuvable
        </Text>

        <Text style={styles.missingText}>
          Ce souvenir n’est plus disponible dans cet événement.
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            Retour
          </Text>
        </Pressable>
      </View>
    );
  }

  const url = mediaFullUrl(media);

  return (
    <View style={styles.container}>
      {/* ==================================================== */}
      {/* IMMERSIVE MEDIA AREA */}
      {/* ==================================================== */}

      <View style={styles.mediaStage}>
        {media.media_type === 'video' ? (
          <Video
            source={{ uri: url }}
            style={
              StyleSheet.absoluteFillObject
            }
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
            isLooping
          />
        ) : (
          <Image
            source={{ uri: url }}
            style={
              StyleSheet.absoluteFillObject
            }
            contentFit="contain"
            transition={180}
          />
        )}

        {/* Top cinematic gradient */}
        <LinearGradient
          colors={[
            'rgba(8,4,9,0.82)',
            'rgba(8,4,9,0.24)',
            'transparent',
          ]}
          locations={[0, 0.35, 0.72]}
          style={styles.topOverlay}
        />

        {/* Bottom cinematic gradient */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(8,4,9,0.18)',
            'rgba(8,4,9,0.94)',
          ]}
          locations={[0.35, 0.62, 1]}
          style={styles.bottomOverlay}
        />

        {/* ================================================== */}
        {/* TOP CONTROLS */}
        {/* ================================================== */}

        <View style={styles.topControls}>
          <IconButton
            icon="close"
            variant="glass"
            onPress={() => router.back()}
          />

          <View style={styles.topControlsRight}>
            <IconButton
              icon={
                isFavorite
                  ? 'heart'
                  : 'heart-outline'
              }
              variant="glass"
              color={
                isFavorite
                  ? theme.colors.error
                  : theme.colors.primaryDark
              }
              onPress={toggleFavorite}
            />

            <IconButton
              icon="share-social-outline"
              variant="glass"
              onPress={handleShare}
              disabled={sharing}
            />
          </View>
        </View>

        {/* ================================================== */}
        {/* MEDIA TYPE */}
        {/* ================================================== */}

        <View
          style={styles.mediaTypePillPosition}
        >
          <FloatingPill
            icon={
              media.media_type === 'video'
                ? 'videocam-outline'
                : 'image-outline'
            }
            label={getMediaLabel(
              media.media_type
            )}
          />
        </View>

        {/* ================================================== */}
        {/* BOTTOM INFORMATION */}
        {/* ================================================== */}

        <View style={styles.bottomContent}>
          <View style={styles.authorRow}>
            <Avatar
              name={
                media.uploader_name ||
                'Participant'
              }
              uri={media.uploader_avatar}
              size="md"
            />

            <View style={styles.authorCopy}>
              <Text style={styles.authorName}>
                {media.uploader_name ||
                  'Participant'}
              </Text>

              <Text style={styles.authorTime}>
                {formatRelative(
                  media.captured_at ||
                    media.created_at
                )}
              </Text>
            </View>
          </View>

          {/* ================================================= */}
          {/* METADATA */}
          {/* ================================================= */}

          <View style={styles.metadataRow}>
            {metadata.map((item) => (
              <MetaChip
                key={`${item.icon}-${item.label}`}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </View>

          {/* ================================================= */}
          {/* SOCIAL INTERACTIONS */}
          {/* ================================================= */}

          <View style={styles.interactionCard}>
            <View
              style={styles.interactionHeader}
            >
              <View>
                <Text
                  style={
                    styles.interactionEyebrow
                  }
                >
                  SOUVENIR COMMUN
                </Text>

                <Text
                  style={
                    styles.interactionTitle
                  }
                >
                  Faites vivre ce moment
                </Text>
              </View>

              <View
                style={
                  styles.interactionSpark
                }
              >
                <Ionicons
                  name="sparkles"
                  size={14}
                  color={
                    theme.colors.champagneLight
                  }
                />
              </View>
            </View>

            <ReactionBar
              mediaId={mediaId}
              myReaction={
                reactionInfo?.mine
              }
              reactionsCount={
                reactionInfo?.count || 0
              }
              commentsCount={
                comments?.length || 0
              }
              onOpenComments={() =>
                setCommentsVisible(true)
              }
              onReacted={
                refreshReactions
              }
            />
          </View>
        </View>
      </View>

      {/* ====================================================== */}
      {/* COMMENTS */}
      {/* ====================================================== */}

      <CommentSheet
        visible={commentsVisible}
        onClose={() =>
          setCommentsVisible(false)
        }
        eventId={id}
        mediaId={mediaId}
        comments={comments || []}
        currentUserId={user?.id}
        onPosted={refreshComments}
      />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080508',
  },

  mediaStage: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#080508',
  },

  loadingScreen: {
    flex: 1,
    backgroundColor:
      theme.colors.darkBackground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  loadingText: {
    marginTop: 10,
    color: theme.colors.white60,
    fontFamily:
      theme.typography.families.body,
    fontSize: 11,
  },

  missingIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(217,184,120,0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(217,184,120,0.18)',
  },

  missingTitle: {
    marginTop: 16,
    color: theme.colors.white,
    fontFamily:
      theme.typography.families
        .displaySemiBold,
    fontSize: 22,
  },

  missingText: {
    marginTop: 7,
    textAlign: 'center',
    color: theme.colors.white60,
    fontFamily:
      theme.typography.families.body,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 300,
  },

  backButton: {
    marginTop: 22,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.champagne,
  },

  backButtonText: {
    color: theme.colors.primaryDeep,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 12,
  },

  topOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 260,
  },

  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 410,
  },

  topControls: {
    position: 'absolute',
    top: 52,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  topControlsRight: {
    flexDirection: 'row',
    gap: 8,
  },

  mediaTypePillPosition: {
    position: 'absolute',
    top: 116,
    left: theme.spacing.lg,
  },

  floatingPill: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor:
      'rgba(18,8,20,0.54)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.12)',
  },

  floatingPillText: {
    color: theme.colors.white80,
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.1,
  },

  bottomContent: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: 34,
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  authorCopy: {
    marginLeft: 10,
  },

  authorName: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 14,
  },

  authorTime: {
    marginTop: 2,
    color: theme.colors.white60,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
  },

  metadataRow: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  metaChip: {
    height: 27,
    paddingHorizontal: 9,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor:
      'rgba(255,255,255,0.075)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
  },

  metaChipText: {
    color: theme.colors.white60,
    fontFamily:
      theme.typography.families
        .bodyMedium,
    fontSize: 9,
  },

  interactionCard: {
    marginTop: 15,
    padding: 14,
    borderRadius: 22,
    backgroundColor:
      'rgba(20,10,22,0.76)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
  },

  interactionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  interactionEyebrow: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 8,
    letterSpacing: 1.7,
  },

  interactionTitle: {
    marginTop: 3,
    color: theme.colors.white,
    fontFamily:
      theme.typography.families
        .displaySemiBold,
    fontSize: 16,
  },

  interactionSpark: {
    width: 31,
    height: 31,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(217,184,120,0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(217,184,120,0.15)',
  },
});