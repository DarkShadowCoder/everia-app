// app/event/[id]/guestbook.js
// ------------------------------------------------------------
// EVERIA — Guestbook / Memory Wall
// Refonte UI/UX complète.
//
// Direction artistique :
// - Premium editorial / social memory wall
// - Hero compact et émotionnel
// - Cartes de témoignages plus aérées et hiérarchisées
// - Composer flottant avec 3 modes : texte / audio / vidéo
// - Conservation intégrale des flux Supabase et upload existants
// ------------------------------------------------------------

import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import theme from '@/theme';
import Header from '@/components/ui/Header';
import BottomSheet from '@/components/ui/BottomSheet';
import Input from '@/components/ui/Input';
import GuestbookEntryCard from '@/components/event/GuestbookEntryCard';
import EmptyState from '@/components/ui/EmptyState';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useEventStore } from '@/store/eventStore';
import { supabase } from '@/lib/supabase';
import { fetchProfilesByIds } from '@/lib/profiles';

const COMPOSER_MODES = [
  {
    key: 'text',
    label: 'Texte',
    description: 'Écrire un mot doux',
    icon: 'create-outline',
    accent: theme.colors.primary,
    soft: theme.colors.primarySoft,
  },
  {
    key: 'audio',
    label: 'Audio',
    description: 'Enregistrer votre voix',
    icon: 'mic-outline',
    accent: theme.colors.mediaAudio,
    soft: theme.colors.successLight,
  },
  {
    key: 'video',
    label: 'Vidéo',
    description: 'Filmer un souvenir',
    icon: 'videocam-outline',
    accent: theme.colors.mediaVideo,
    soft: theme.colors.primarySoft,
  },
];

export default function Guestbook() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const event = useEventStore((state) => state.event);
  const showToast = useUIStore((s) => s.showToast);

  const { uploadAsset } = useMediaUpload({
    eventId: id,
    uploaderId: user?.id,
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [posting, setPosting] = useState(false);

  // guestbook_entries n'a pas de colonnes audio_path/video_path :
  // les médias sont stockés dans `media`, puis référencés via media_id.
  const {
    data: entries,
    isLoading,
    refresh,
  } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('guestbook_entries')
      .select('*, media:media_id(*)')
      .eq('event_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const profilesById = await fetchProfilesByIds(
      (data || []).map((entry) => entry.user_id)
    );

    return (data || []).map((entry) => ({
      ...entry,
      author_name: profilesById[entry.user_id]?.display_name,
      author_avatar: profilesById[entry.user_id]?.avatar_path,
    }));
  }, [id]);

  const messageCount = entries?.length || 0;
  const eventName = event?.name || 'Votre événement';

  const activeMode = useMemo(
    () =>
      COMPOSER_MODES.find((item) => item.key === mode) ||
      COMPOSER_MODES[0],
    [mode]
  );

  const closeSheet = () => {
    if (isRecording) {
      return;
    }

    setSheetOpen(false);
    setText('');
    setMode('text');
  };

  const openComposer = (initialMode = 'text') => {
    setMode(initialMode);
    setSheetOpen(true);
  };

  const postTextEntry = async () => {
    const trimmedText = text.trim();

    if (!trimmedText || !user?.id) {
      return;
    }

    setPosting(true);

    const { error } = await supabase
      .from('guestbook_entries')
      .insert({
        event_id: id,
        user_id: user.id,
        entry_type: 'text',
        text_content: trimmedText,
      });

    setPosting(false);

    if (error) {
      showToast(error.message, 'error');
      return;
    }

    closeSheet();
    refresh();
  };

  const startRecordingAudio = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        showToast(
          'Autorisez le micro pour enregistrer un message vocal.',
          'warning'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } =
        await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

      setRecording(rec);
      setIsRecording(true);
    } catch (error) {
      showToast(
        error?.message ||
          'Impossible de démarrer l’enregistrement.',
        'error'
      );
    }
  };

  const stopRecordingAudio = async () => {
    if (!recording) {
      return;
    }

    setIsRecording(false);
    setPosting(true);

    try {
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();

      setRecording(null);

      if (!uri) {
        throw new Error(
          'Le fichier audio n’a pas pu être récupéré.'
        );
      }

      const mediaRow = await uploadAsset({
        uri,
        type: 'audio',
        fileName: `voice-${Date.now()}.m4a`,
      });

      const { error } = await supabase
        .from('guestbook_entries')
        .insert({
          event_id: id,
          user_id: user?.id,
          entry_type: 'audio',
          media_id: mediaRow.id,
        });

      if (error) {
        throw error;
      }

      closeSheet();
      refresh();
    } catch (error) {
      showToast(
        error?.message ||
          'Impossible de publier le message vocal.',
        'error'
      );

      setRecording(null);
    } finally {
      setPosting(false);
    }
  };

  const recordVideo = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        showToast(
          'Autorisez la caméra pour filmer votre message.',
          'warning'
        );
        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Videos,
          videoMaxDuration: 60,
          quality: 0.7,
        });

      if (result.canceled) {
        return;
      }

      setPosting(true);

      const asset = result.assets?.[0];

      if (!asset?.uri) {
        throw new Error(
          'La vidéo n’a pas pu être récupérée.'
        );
      }

      const mediaRow = await uploadAsset({
        uri: asset.uri,
        type: 'video',
        fileName: `video-msg-${Date.now()}.mp4`,
        duration: asset.duration,
      });

      const { error } = await supabase
        .from('guestbook_entries')
        .insert({
          event_id: id,
          user_id: user?.id,
          entry_type: 'video',
          media_id: mediaRow.id,
        });

      if (error) {
        throw error;
      }

      closeSheet();
      refresh();
    } catch (error) {
      showToast(
        error?.message ||
          'Impossible de publier le message vidéo.',
        'error'
      );
    } finally {
      setPosting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.eyebrowRow}>
        <View style={styles.eyebrowLine} />

        <Text style={styles.eyebrow}>
          LES MOTS QUI RESTENT
        </Text>
      </View>

      <View style={styles.heroCopyRow}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>
            Un mot pour marquer{'\n'}
            le moment.
          </Text>

          <Text style={styles.heroSubtitle}>
            Partagez un souvenir, une émotion ou une
            petite attention pour {eventName}.
          </Text>
        </View>

        <View style={styles.heroMark}>
          <Ionicons
            name="book-outline"
            size={28}
            color={theme.colors.champagneDark}
          />

          <View style={styles.heroMarkDot} />
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsIcon}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={19}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.statsCopy}>
          <Text style={styles.statsValue}>
            {messageCount}
          </Text>

          <Text style={styles.statsLabel}>
            {messageCount > 1
              ? 'messages partagés'
              : 'message partagé'}
          </Text>
        </View>

        <View style={styles.statsDivider} />

        <View style={styles.statsHintWrap}>
          <Ionicons
            name="sparkles-outline"
            size={16}
            color={theme.colors.champagneDark}
          />

          <Text style={styles.statsHint}>
            Chaque voix compte
          </Text>
        </View>
      </View>

      {messageCount > 0 ? (
        <View style={styles.sectionIntro}>
          <Text style={styles.sectionTitle}>
            Les mots de vos invités
          </Text>

          <Text style={styles.sectionSubtitle}>
            Des messages à relire, écouter et garder.
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <Header
        title="Livre d'or"
        subtitle={eventName}
        rightActions={[
          {
            icon: 'create-outline',
            onPress: () => openComposer('text'),
          },
        ]}
      />

      <FlatList
        data={entries || []}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          !entries?.length &&
            styles.listContentEmpty,
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="heart-outline"
              title="Votre livre d'or commence ici"
              subtitle="Le premier message donne le ton. Invitez vos proches à laisser un souvenir qui restera avec l'événement."
              actionLabel="Écrire le premier message"
              onAction={() => openComposer('text')}
            />
          ) : null
        }
        renderItem={({ item, index }) => (
          <GuestbookEntryCard
            entry={item}
            index={index}
            onPress={() => {}}
          />
        )}
        ListFooterComponent={
          <View style={{ height: 128 }} />
        }
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Laisser un message"
        onPress={() => openComposer('text')}
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
        ]}
      >
        <View style={styles.fabIcon}>
          <Ionicons
            name="add"
            size={22}
            color={theme.colors.primaryDeep}
          />
        </View>

        <View style={styles.fabCopy}>
          <Text style={styles.fabEyebrow}>
            LIVRE D'OR
          </Text>

          <Text style={styles.fabTitle}>
            Laisser un message
          </Text>
        </View>

        <Ionicons
          name="arrow-up-outline"
          size={18}
          color={theme.colors.primaryDeep}
        />
      </Pressable>

      <BottomSheet
        visible={sheetOpen}
        onClose={closeSheet}
        dark={false}
        maxHeightRatio={0.88}
      >
        <KeyboardAvoidingView
          style={styles.sheetKeyboard}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              styles.sheetScrollContent
            }
          >
            <View style={styles.sheetBody}>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetEyebrow}>
                    PARTAGER UN SOUVENIR
                  </Text>

                  <Text style={styles.sheetTitle}>
                    Votre voix mérite sa place.
                  </Text>
                </View>

                <View style={styles.sheetHeaderIcon}>
                  <Ionicons
                    name="sparkles-outline"
                    size={19}
                    color={theme.colors.champagneDark}
                  />
                </View>
              </View>

              <View style={styles.modeGrid}>
                {COMPOSER_MODES.map((item) => (
                  <ModeButton
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    active={mode === item.key}
                    accent={item.accent}
                    soft={item.soft}
                    onPress={() => {
                      if (isRecording || posting) {
                        return;
                      }

                      setMode(item.key);
                    }}
                  />
                ))}
              </View>

              <View
                style={[
                  styles.activeModeBar,
                  {
                    borderColor:
                      activeMode.accent + '30',
                  },
                ]}
              >
                <View
                  style={[
                    styles.activeModeIcon,
                    {
                      backgroundColor:
                        activeMode.soft,
                    },
                  ]}
                >
                  <Ionicons
                    name={activeMode.icon}
                    size={18}
                    color={activeMode.accent}
                  />
                </View>

                <View
                  style={styles.activeModeCopy}
                >
                  <Text style={styles.activeModeTitle}>
                    {activeMode.label}
                  </Text>

                  <Text
                    style={
                      styles.activeModeDescription
                    }
                  >
                    {activeMode.description}
                  </Text>
                </View>

                <View
                  style={[
                    styles.activeModeDot,
                    {
                      backgroundColor:
                        activeMode.accent,
                    },
                  ]}
                />
              </View>

              {mode === 'text' ? (
                <>
                  <Input
                    value={text}
                    onChangeText={setText}
                    placeholder="Écrivez quelques lignes sincères..."
                    multiline
                    numberOfLines={7}
                    inputStyle={
                      styles.messageInput
                    }
                    style={
                      styles.messageField
                    }
                    maxLength={500}
                  />

                  <View
                    style={styles.fieldFooter}
                  >
                    <View
                      style={
                        styles.fieldFooterHint
                      }
                    >
                      <Ionicons
                        name="heart-outline"
                        size={14}
                        color={
                          theme.colors.textMuted
                        }
                      />

                      <Text
                        style={
                          styles.fieldFooterText
                        }
                      >
                        Un message authentique suffit.
                      </Text>
                    </View>

                    <Text style={styles.counter}>
                      {text.length}/500
                    </Text>
                  </View>

                  <ComposerAction
                    title="Publier le message"
                    icon="arrow-up-outline"
                    onPress={postTextEntry}
                    loading={posting}
                    disabled={!text.trim() || posting}
                  />
                </>
              ) : null}

              {mode === 'audio' ? (
                <View
                  style={styles.mediaComposer}
                >
                  <View
                    style={
                      styles.mediaComposerBadge
                    }
                  >
                    <Ionicons
                      name="mic-outline"
                      size={22}
                      color={
                        theme.colors.mediaAudio
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.mediaComposerTitle
                    }
                  >
                    {isRecording
                      ? 'Votre message est en cours...'
                      : 'Laissez parler votre voix'}
                  </Text>

                  <Text
                    style={
                      styles.mediaComposerDescription
                    }
                  >
                    Enregistrez un message vocal
                    court, naturel et spontané.
                  </Text>

                  <Pressable
                    onPress={
                      isRecording
                        ? stopRecordingAudio
                        : startRecordingAudio
                    }
                    disabled={posting}
                    style={({ pressed }) => [
                      styles.recordButton,
                      isRecording &&
                        styles.recordButtonActive,
                      pressed &&
                        styles.recordButtonPressed,
                      posting &&
                        styles.recordButtonDisabled,
                    ]}
                  >
                    <View
                      style={
                        styles.recordButtonInner
                      }
                    >
                      <Ionicons
                        name={
                          isRecording
                            ? 'stop'
                            : 'mic'
                        }
                        size={29}
                        color={theme.colors.white}
                      />
                    </View>
                  </Pressable>

                  <Text style={styles.recordHint}>
                    {isRecording
                      ? 'Appuyez pour arrêter et publier'
                      : 'Appuyez pour commencer'}
                  </Text>
                </View>
              ) : null}

              {mode === 'video' ? (
                <View
                  style={styles.mediaComposer}
                >
                  <View
                    style={[
                      styles.mediaComposerBadge,
                      styles.videoBadge,
                    ]}
                  >
                    <Ionicons
                      name="videocam-outline"
                      size={22}
                      color={
                        theme.colors.mediaVideo
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.mediaComposerTitle
                    }
                  >
                    Montrez le moment, pas seulement
                    les mots
                  </Text>

                  <Text
                    style={
                      styles.mediaComposerDescription
                    }
                  >
                    Filmez jusqu'à 60 secondes pour
                    transmettre l'ambiance, le sourire
                    ou le souvenir.
                  </Text>

                  <ComposerAction
                    title="Filmer mon message"
                    icon="videocam-outline"
                    onPress={recordVideo}
                    loading={posting}
                    disabled={posting}
                    variant="video"
                  />
                </View>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
}

function ModeButton({
  icon,
  label,
  description,
  active,
  accent,
  soft,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeButton,
        active && [
          styles.modeButtonActive,
          {
            borderColor:
              accent + '45',
            backgroundColor: soft,
          },
        ],
        pressed && styles.modeButtonPressed,
      ]}
    >
      <View
        style={[
          styles.modeButtonIcon,
          active && {
            backgroundColor:
              theme.colors.white,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            active
              ? accent
              : theme.colors.textSecondary
          }
        />
      </View>

      <View style={styles.modeButtonCopy}>
        <Text
          style={[
            styles.modeButtonLabel,
            active && {
              color: accent,
            },
          ]}
        >
          {label}
        </Text>

        <Text
          style={styles.modeButtonDescription}
          numberOfLines={1}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function ComposerAction({
  title,
  icon,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}) {
  const isVideo = variant === 'video';
  const backgroundColor = isVideo
    ? theme.colors.primary
    : theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.composerAction,
        {
          backgroundColor,
        },
        (disabled || loading) &&
          styles.composerActionDisabled,
        pressed &&
          styles.composerActionPressed,
      ]}
    >
      {loading ? (
        <View style={styles.loadingDots}>
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
        </View>
      ) : (
        <>
          <Text
            style={styles.composerActionTitle}
          >
            {title}
          </Text>

          <View
            style={styles.composerActionIcon}
          >
            <Ionicons
              name={icon}
              size={18}
              color={theme.colors.primaryDeep}
            />
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.screens.guestbook,
  },

  listContent: {
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingTop: 18,
  },

  listContentEmpty: {
    paddingBottom: 40,
  },

  listHeader: {
    marginBottom: 18,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  eyebrowLine: {
    width: 24,
    height: 1,
    backgroundColor:
      theme.colors.champagne,
    marginRight: 8,
  },

  eyebrow: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9.5,
    lineHeight: 13,
    letterSpacing: 1.8,
    color: theme.colors.textGold,
  },

  heroCopyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  heroCopy: {
    flex: 1,
    paddingRight: 12,
  },

  heroTitle: {
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 31,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: theme.colors.textPrimary,
  },

  heroSubtitle: {
    marginTop: 10,
    maxWidth: 325,
    fontFamily:
      theme.typography.families.body,
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },

  heroMark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor:
      theme.colors.champagnePale,
    borderWidth: 1,
    borderColor:
      theme.colors.champagneSoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  heroMarkDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor:
      theme.colors.champagne,
    right: 10,
    bottom: 10,
  },

  statsCard: {
    minHeight: 76,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },

  statsIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor:
      theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsCopy: {
    marginLeft: 10,
  },

  statsValue: {
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 24,
    lineHeight: 26,
    color: theme.colors.textPrimary,
  },

  statsLabel: {
    marginTop: 1,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },

  statsDivider: {
    width: 1,
    height: 34,
    backgroundColor:
      theme.colors.divider,
    marginHorizontal: 14,
  },

  statsHintWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },

  statsHint: {
    maxWidth: 92,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 10.5,
    lineHeight: 14,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },

  sectionIntro: {
    marginTop: 26,
    marginBottom: 4,
  },

  sectionTitle: {
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 22,
    lineHeight: 27,
    color: theme.colors.textPrimary,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontFamily:
      theme.typography.families.body,
    fontSize: 11.5,
    color: theme.colors.textMuted,
  },

  fab: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 22,
    minHeight: 68,
    borderRadius: 22,
    backgroundColor:
      theme.colors.champagne,
    borderWidth: 1,
    borderColor:
      theme.colors.champagneLight,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.md,
  },

  fabPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },

  fabIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fabCopy: {
    flex: 1,
    marginHorizontal: 10,
  },

  fabEyebrow: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8.5,
    letterSpacing: 1.5,
    color: theme.colors.primary,
  },

  fabTitle: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 14,
    color: theme.colors.primaryDeep,
  },

  sheetKeyboard: {
    flex: 1,
  },

  sheetScrollContent: {
    paddingBottom: 18,
  },

  sheetBody: {
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingBottom: 16,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  sheetEyebrow: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.7,
    color: theme.colors.textGold,
  },

  sheetTitle: {
    marginTop: 4,
    maxWidth: 275,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 25,
    lineHeight: 30,
    color: theme.colors.textPrimary,
  },

  sheetHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor:
      theme.colors.champagnePale,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modeGrid: {
    gap: 8,
  },

  modeButton: {
    minHeight: 60,
    borderRadius: 17,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    backgroundColor:
      theme.colors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  modeButtonActive: {
    borderWidth: 1,
  },

  modeButtonPressed: {
    opacity: 0.8,
  },

  modeButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor:
      theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modeButtonCopy: {
    flex: 1,
    marginLeft: 10,
  },

  modeButtonLabel: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 12.5,
    color: theme.colors.textPrimary,
  },

  modeButtonDescription: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },

  activeModeBar: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  activeModeIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeModeCopy: {
    flex: 1,
    marginHorizontal: 9,
  },

  activeModeTitle: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11.5,
    color: theme.colors.textPrimary,
  },

  activeModeDescription: {
    marginTop: 1,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  activeModeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },

  messageField: {
    marginTop: 12,
  },

  messageInput: {
    minHeight: 132,
    paddingTop: 13,
    lineHeight: 21,
  },

  fieldFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },

  fieldFooterHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  fieldFooterText: {
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  counter: {
    fontFamily:
      theme.typography.families.mono,
    fontSize: 9,
    color: theme.colors.textMuted,
  },

  composerAction: {
    minHeight: 54,
    marginTop: 16,
    borderRadius: 17,
    paddingLeft: 17,
    paddingRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  composerActionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },

  composerActionDisabled: {
    opacity: 0.45,
  },

  composerActionTitle: {
    flex: 1,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 13,
    color: theme.colors.white,
  },

  composerActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      theme.colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingDots: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  loadingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      theme.colors.white,
  },

  mediaComposer: {
    alignItems: 'center',
    paddingTop: 22,
  },

  mediaComposerBadge: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor:
      theme.colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  videoBadge: {
    backgroundColor:
      theme.colors.primarySoft,
  },

  mediaComposerTitle: {
    marginTop: 14,
    maxWidth: 290,
    textAlign: 'center',
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 21,
    lineHeight: 26,
    color: theme.colors.textPrimary,
  },

  mediaComposerDescription: {
    marginTop: 6,
    maxWidth: 310,
    textAlign: 'center',
    fontFamily:
      theme.typography.families.body,
    fontSize: 11.5,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  recordButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginTop: 24,
    backgroundColor:
      theme.colors.mediaAudio,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },

  recordButtonActive: {
    backgroundColor:
      theme.colors.error,
  },

  recordButtonPressed: {
    transform: [{ scale: 0.96 }],
  },

  recordButtonDisabled: {
    opacity: 0.5,
  },

  recordButtonInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  recordHint: {
    marginTop: 10,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 10.5,
    color: theme.colors.textSecondary,
  },
});