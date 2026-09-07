// app/event/[id]/challenge/[challengeId].js
// ============================================================
// EVERIA — Challenge Detail
// ============================================================

import React, {
  useMemo,
  useState,
} from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import {
  Image,
} from 'expo-image';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import theme from '@/theme';

import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

import {
  useSupabaseQuery,
} from '@/hooks/useSupabaseQuery';

import {
  useAuthStore,
} from '@/store/authStore';

import {
  useUIStore,
} from '@/store/uiStore';

import {
  useMediaUpload,
} from '@/hooks/useMediaUpload';

import {
  getChallenge,
  submitChallenge,
} from '@/lib/challengeEngine';

export default function ChallengeDetail() {
  const {
    id,
    challengeId,
  } =
    useLocalSearchParams();

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const showToast =
    useUIStore(
      (state) =>
        state.showToast
    );

  const [
    asset,
    setAsset,
  ] =
    useState(null);

  const [
    text,
    setText,
  ] =
    useState('');

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const upload =
    useMediaUpload({
      eventId:
        id,

      uploaderId:
        user?.id,
    });

  const {
    data:
      challenge,
    isLoading,
    refresh,
  } =
    useSupabaseQuery(
      () =>
        getChallenge(
          challengeId,
          user?.id
        ),
      [
        challengeId,
        user?.id,
      ]
    );

  const requiresMedia =
    useMemo(
      () =>
        [
          'photo',
          'video',
        ].includes(
          challenge
            ?.challenge_type
        ),
      [
        challenge
          ?.challenge_type,
      ]
    );

  const requiresText =
    challenge
      ?.challenge_type ===
    'text';

  const pickMedia =
    async () => {
      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .All,

            quality:
              0.85,

            videoMaxDuration:
              60,
          }
        );

      if (
        !result.canceled
      ) {
        setAsset(
          result.assets[
            0
          ]
        );
      }
    };

  const submit =
    async () => {
      if (
        requiresMedia &&
        !asset
      ) {
        showToast(
          'Ajoutez le média demandé par ce défi.',
          'warning'
        );

        return;
      }

      if (
        requiresText &&
        !text.trim()
      ) {
        showToast(
          'Écrivez votre réponse.',
          'warning'
        );

        return;
      }

      setSubmitting(
        true
      );

      try {
        let mediaId =
          null;

        if (asset) {
          const media =
            await upload.uploadAsset(
              asset
            );

          mediaId =
            media?.id ||
            upload
              .currentMedia
              ?.id ||
            null;
        }

        await submitChallenge(
          {
            challengeId,
            mediaId,
            textResponse:
              text.trim() ||
              null,
          }
        );

        showToast(
          'Participation enregistrée.',
          'success'
        );

        setAsset(null);
        setText('');

        refresh();
      } catch (
        error
      ) {
        showToast(
          error?.message ||
            'Impossible de soumettre le défi.',
          'error'
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  if (
    isLoading &&
    !challenge
  ) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Text
          style={
            styles.loading
          }
        >
          Chargement…
        </Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Text
          style={
            styles.loading
          }
        >
          Défi introuvable.
        </Text>
      </View>
    );
  }

  const latest =
    challenge.mySubmission;

  const canSubmit =
    challenge.status ===
      'active' &&
    latest?.status !==
      'submitted' &&
    latest?.status !==
      'approved';

  return (
    <View
      style={
        styles.screen
      }
    >
      <Header
        title="Défi"
        dark
        onBack={() =>
          router.back()
        }
      />

      <ScrollView
        contentContainerStyle={
          styles.body
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Badge
          label={`${challenge.reward_points || 0} points`}
          backgroundColor={
            theme.challenges
              .pointsBadge
              .backgroundColor
          }
          textColor={
            theme.challenges
              .pointsBadge
              .textColor
          }
        />

        <Text
          style={
            styles.title
          }
        >
          {challenge.title}
        </Text>

        {challenge.description ? (
          <Text
            style={
              styles.description
            }
          >
            {
              challenge.description
            }
          </Text>
        ) : null}

        {latest ? (
          <View
            style={
              styles.statusCard
            }
          >
            <Ionicons
              name={
                latest.status ===
                'approved'
                  ? 'checkmark-circle'
                  : latest.status ===
                    'rejected'
                  ? 'close-circle'
                  : 'time-outline'
              }
              size={22}
              color={
                latest.status ===
                'approved'
                  ? theme.colors
                      .success
                  : latest.status ===
                    'rejected'
                  ? theme.colors
                      .error
                  : theme.colors
                      .warning
              }
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.statusTitle
                }
              >
                {latest.status ===
                'approved'
                  ? 'Défi validé'
                  : latest.status ===
                    'rejected'
                  ? 'Soumission à refaire'
                  : 'Soumission en validation'}
              </Text>

              <Text
                style={
                  styles.statusText
                }
              >
                {
                  latest.validation_reason ||
                  'Everia suit votre participation.'
                }
              </Text>
            </View>
          </View>
        ) : null}

        {canSubmit ? (
          <>
            {requiresMedia ? (
              <Pressable
                onPress={
                  pickMedia
                }
                style={
                  styles.mediaPicker
                }
              >
                {asset?.uri ? (
                  <Image
                    source={{
                      uri:
                        asset.uri,
                    }}
                    style={
                      StyleSheet.absoluteFillObject
                    }
                    contentFit="cover"
                  />
                ) : (
                  <>
                    <Ionicons
                      name={
                        challenge
                          .challenge_type ===
                        'video'
                          ? 'videocam-outline'
                          : 'camera-outline'
                      }
                      size={30}
                      color={
                        theme.colors
                          .champagneLight
                      }
                    />

                    <Text
                      style={
                        styles.mediaLabel
                      }
                    >
                      Ajouter{' '}
                      {challenge.challenge_type ===
                      'video'
                        ? 'une vidéo'
                        : 'une photo'}
                    </Text>
                  </>
                )}
              </Pressable>
            ) : null}

            <Input
              label={
                requiresText
                  ? 'Votre réponse'
                  : 'Message (optionnel)'
              }
              value={text}
              onChangeText={
                setText
              }
              placeholder={
                requiresText
                  ? 'Votre réponse…'
                  : 'Racontez ce moment…'
              }
              dark
              multiline
              numberOfLines={4}
              style={{
                marginTop:
                  theme.spacing
                    .lg,
              }}
            />

            <Button
              title="Soumettre ma participation"
              variant="gold"
              onPress={submit}
              loading={
                submitting ||
                upload.isUploading
              }
              style={{
                marginTop:
                  theme.spacing
                    .xl,
              }}
            />
          </>
        ) : null}

        {challenge.status !==
        'active' ? (
          <View
            style={
              styles.info
            }
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={
                theme.colors
                  .white60
              }
            />

            <Text
              style={
                styles.infoText
              }
            >
              Ce défi n'est pas disponible actuellement.
            </Text>
          </View>
        ) : null}
      </ScrollView>
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

    body: {
      paddingHorizontal:
        theme.layout
          .screenHorizontal,
      paddingBottom: 42,
      paddingTop: 12,
    },

    title: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 28,
      lineHeight: 34,
      marginTop: 15,
    },

    description: {
      color:
        theme.colors
          .white60,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 10,
    },

    statusCard: {
      flexDirection:
        'row',
      gap: 10,
      alignItems:
        'flex-start',
      padding: 15,
      borderRadius: 18,
      backgroundColor:
        theme.colors
          .darkSurface2,
      borderWidth: 1,
      borderColor:
        theme.colors
          .borderDark,
      marginTop: 22,
    },

    statusTitle: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 13,
    },

    statusText: {
      color:
        theme.colors
          .white60,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 3,
    },

    mediaPicker: {
      height: 210,
      borderRadius: 20,
      marginTop: 24,
      overflow: 'hidden',
      backgroundColor:
        theme.colors
          .darkSurface2,
      borderWidth: 1,
      borderColor:
        theme.colors
          .borderDark,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    mediaLabel: {
      marginTop: 8,
      color:
        theme.colors
          .champagneLight,
      fontFamily:
        theme.typography
          .families
          .bodyMedium,
      fontSize: 12,
    },

    info: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 9,
      padding: 14,
      borderRadius: 16,
      backgroundColor:
        'rgba(255,255,255,0.05)',
      marginTop: 22,
    },

    infoText: {
      flex: 1,
      color:
        theme.colors
          .white60,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 12,
    },

    center: {
      flex: 1,
      backgroundColor:
        theme.screens
          .challenges,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    loading: {
      color:
        theme.colors
          .white60,
      fontFamily:
        theme.typography
          .families.body,
    },
  });