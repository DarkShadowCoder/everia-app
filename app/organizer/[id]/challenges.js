// app/organizer/[id]/challenges.js
// ============================================================
// EVERIA — Organizer Challenges
// ============================================================

import React, {
  useState,
} from 'react';

import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/ui/Avatar';

import {
  useSupabaseQuery,
} from '@/hooks/useSupabaseQuery';

import {
  listEventChallenges,
  createChallenge,
  publishChallenge,
  deleteChallenge,
  reviewChallenge,
} from '@/lib/challengeEngine';

import {
  useAuthStore,
} from '@/store/authStore';

import {
  supabase,
} from '@/lib/supabase';

import {
  fetchProfilesByIds,
} from '@/lib/profiles';

import {
  avatarUrl,
} from '@/lib/storage';

export default function OrganizerChallenges() {
  const {
    id,
  } =
    useLocalSearchParams();

  useAuthStore(
    (state) =>
      state.user
  );

  const [
    showCreate,
    setShowCreate,
  ] =
    useState(false);

  const [
    title,
    setTitle,
  ] =
    useState('');

  const [
    description,
    setDescription,
  ] =
    useState('');

  const [
    type,
    setType,
  ] =
    useState('photo');

  const [
    points,
    setPoints,
  ] =
    useState('25');

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const {
    data:
      challenges,
    isLoading,
    refresh,
  } =
    useSupabaseQuery(
      () =>
        listEventChallenges(
          id
        ),
      [id]
    );

  const {
    data:
      pending,
    refresh:
      refreshPending,
  } =
    useSupabaseQuery(
      async () => {
        const ids =
          (
            challenges ||
            []
          ).map(
            (item) =>
              item.id
          );

        if (!ids.length) {
          return [];
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'challenge_submissions'
            )
            .select('*')
            .in(
              'challenge_id',
              ids
            )
            .eq(
              'status',
              'submitted'
            )
            .order(
              'submitted_at',
              {
                ascending: false,
              }
            );

        if (error) {
          throw error;
        }

        const profiles =
          await fetchProfilesByIds(
            (
              data ||
              []
            ).map(
              (item) =>
                item.user_id
            )
          );

        return (
          data ||
          []
        ).map(
          (item) => ({
            ...item,
            profile:
              profiles[
                item.user_id
              ] ||
              null,
          })
        );
      },
      [
        JSON.stringify(
          (
            challenges ||
            []
          ).map(
            (item) =>
              item.id
          )
        ),
      ]
    );

  const create =
    async () => {
      if (
        !title.trim()
      ) {
        Alert.alert(
          'Titre requis',
          'Donnez un titre à votre défi.'
        );

        return;
      }

      setSaving(
        true
      );

      try {
        await createChallenge(
          {
            eventId:
              id,

            title,

            description,

            challengeType:
              type,

            rewardPoints:
              Number(
                points
              ) ||
              25,

            validationMethod:
              'manual',

            status:
              'active',
          }
        );

        setTitle('');
        setDescription('');
        setPoints('25');
        setShowCreate(
          false
        );

        refresh();
      } catch (
        error
      ) {
        Alert.alert(
          'Erreur',
          error?.message ||
            'Création impossible.'
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const remove =
    (challengeId) =>
      Alert.alert(
        'Supprimer le défi ?',
        'Les soumissions existantes seront également supprimées.',
        [
          {
            text:
              'Annuler',
            style:
              'cancel',
          },

          {
            text:
              'Supprimer',
            style:
              'destructive',
            onPress:
              async () => {
                try {
                  await deleteChallenge(
                    challengeId
                  );

                  refresh();
                } catch (
                  error
                ) {
                  Alert.alert(
                    'Erreur',
                    error?.message
                  );
                }
              },
          },
        ]
      );

  const review =
    async (
      submissionId,
      decision
    ) => {
      try {
        await reviewChallenge(
          {
            submissionId,
            decision,
          }
        );

        refreshPending();
        refresh();
      } catch (
        error
      ) {
        Alert.alert(
          'Erreur',
          error?.message ||
            'Validation impossible.'
        );
      }
    };

  return (
    <View
      style={
        styles.screen
      }
    >
      <Header
        title="Défis"
        subtitle="Administration"
        dark
        rightActions={[
          {
            icon:
              'add-outline',
            onPress: () =>
              setShowCreate(
                true
              ),
          },

          {
            icon:
              'close-outline',
            onPress: () =>
              router.back(),
          },
        ]}
      />

      <FlatList
        data={
          challenges ||
          []
        }
        keyExtractor={
          (item) =>
            item.id
        }
        refreshControl={
          <RefreshControl
            refreshing={
              isLoading
            }
            onRefresh={() => {
              refresh();
              refreshPending();
            }}
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
            <View
              style={
                styles.hero
              }
            >
              <Text
                style={
                  styles.eyebrow
                }
              >
                COMMAND CENTER
              </Text>

              <Text
                style={
                  styles.heroTitle
                }
              >
                Pilotez les défis de l’événement.
              </Text>

              <Text
                style={
                  styles.heroText
                }
              >
                {
                  challenges?.length ||
                  0
                }{' '}
                défis ·{' '}
                {
                  pending?.length ||
                  0
                }{' '}
                soumissions à valider.
              </Text>
            </View>

            <Text
              style={
                styles.section
              }
            >
              Défis publiés
            </Text>
          </>
        }
        renderItem={({
          item,
        }) => (
          <ChallengeRow
            challenge={
              item
            }
            onPublish={
              async () => {
                await publishChallenge(
                  item.id
                );

                refresh();
              }
            }
            onDelete={() =>
              remove(
                item.id
              )
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="trophy-outline"
            title="Aucun défi"
            subtitle="Créez le premier défi de votre événement."
          />
        }
        ListFooterComponent={
          <>
            <Text
              style={
                styles.section
              }
            >
              Soumissions en attente
            </Text>

            {(
              pending ||
              []
            ).map(
              (
                submission
              ) => (
                <SubmissionRow
                  key={
                    submission.id
                  }
                  submission={
                    submission
                  }
                  onApprove={() =>
                    review(
                      submission.id,
                      'approved'
                    )
                  }
                  onReject={() =>
                    review(
                      submission.id,
                      'rejected'
                    )
                  }
                />
              )
            )}

            {!pending?.length ? (
              <Text
                style={
                  styles.muted
                }
              >
                Aucune soumission en attente.
              </Text>
            ) : null}
          </>
        }
      />

      <Modal
        visible={
          showCreate
        }
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowCreate(
            false
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.modal
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Nouveau défi
            </Text>

            <TextInput
              value={
                title
              }
              onChangeText={
                setTitle
              }
              placeholder="Titre"
              placeholderTextColor={
                theme.colors
                  .textMuted
              }
              style={
                styles.input
              }
            />

            <TextInput
              value={
                description
              }
              onChangeText={
                setDescription
              }
              placeholder="Description"
              placeholderTextColor={
                theme.colors
                  .textMuted
              }
              multiline
              style={[
                styles.input,
                styles.multiline,
              ]}
            />

            <View
              style={
                styles.typeRow
              }
            >
              {[
                'photo',
                'video',
                'text',
              ].map(
                (
                  value
                ) => (
                  <Pressable
                    key={
                      value
                    }
                    onPress={() =>
                      setType(
                        value
                      )
                    }
                    style={[
                      styles.typeChip,
                      type ===
                        value &&
                        styles.typeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        type ===
                          value &&
                          styles.typeTextActive,
                      ]}
                    >
                      {
                        value
                      }
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <TextInput
              value={
                points
              }
              onChangeText={
                setPoints
              }
              keyboardType="number-pad"
              placeholder="Points"
              placeholderTextColor={
                theme.colors
                  .textMuted
              }
              style={
                styles.input
              }
            />

            <Button
              title="Publier le défi"
              variant="gold"
              onPress={
                create
              }
              loading={
                saving
              }
            />

            <Pressable
              onPress={() =>
                setShowCreate(
                  false
                )
              }
              style={
                styles.cancel
              }
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                Annuler
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ChallengeRow({
  challenge,
  onPublish,
  onDelete,
}) {
  return (
    <View
      style={
        styles.row
      }
    >
      <View
        style={
          styles.rowIcon
        }
      >
        <Ionicons
          name={
            challenge.challenge_type ===
            'video'
              ? 'videocam-outline'
              : challenge.challenge_type ===
                'text'
              ? 'create-outline'
              : 'camera-outline'
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
          styles.rowCopy
        }
      >
        <Text
          style={
            styles.rowTitle
          }
        >
          {
            challenge.title
          }
        </Text>

        <Text
          style={
            styles.rowMeta
          }
        >
          {
            challenge.reward_points ||
            0
          }{' '}
          pts ·{' '}
          {
            challenge.status
          }
        </Text>
      </View>

      <Pressable
        onPress={
          onPublish
        }
        disabled={
          challenge.status ===
          'active'
        }
      >
        <Ionicons
          name="flash-outline"
          size={19}
          color={
            challenge.status ===
            'active'
              ? theme.colors
                  .success
              : theme.colors
                  .champagneLight
          }
        />
      </Pressable>

      <Pressable
        onPress={
          onDelete
        }
        style={{
          marginLeft: 12,
        }}
      >
        <Ionicons
          name="trash-outline"
          size={18}
          color={
            theme.colors
              .error
          }
        />
      </Pressable>
    </View>
  );
}

function SubmissionRow({
  submission,
  onApprove,
  onReject,
}) {
  return (
    <View
      style={
        styles.submission
      }
    >
      <Avatar
        uri={avatarUrl(
          submission
            .profile
            ?.avatar_path
        )}
        name={
          submission
            .profile
            ?.display_name
        }
        size="sm"
      />

      <View
        style={
          styles.rowCopy
        }
      >
        <Text
          style={
            styles.rowTitle
          }
        >
          {
            submission
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
          Soumission ·{' '}
          {
            submission.submitted_at
              ? new Date(
                  submission.submitted_at
                ).toLocaleString(
                  'fr-FR'
                )
              : ''
          }
        </Text>
      </View>

      <Pressable
        onPress={
          onReject
        }
        style={
          styles.reject
        }
      >
        <Ionicons
          name="close"
          size={18}
          color={
            theme.colors
              .error
          }
        />
      </Pressable>

      <Pressable
        onPress={
          onApprove
        }
        style={
          styles.approve
        }
      >
        <Ionicons
          name="checkmark"
          size={18}
          color={
            theme.colors
              .success
          }
        />
      </Pressable>
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
      paddingBottom: 50,
    },

    hero: {
      padding: 20,
      borderRadius: 22,
      backgroundColor:
        theme.colors
          .darkSurface,
      borderWidth: 1,
      borderColor:
        theme.colors
          .borderDark,
      marginBottom: 22,
    },

    eyebrow: {
      color:
        theme.colors
          .champagneLight,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 9,
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
      marginTop: 6,
    },

    heroText: {
      color:
        theme.colors
          .white60,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 12,
      marginTop: 8,
    },

    section: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 19,
      marginBottom: 10,
      marginTop: 4,
    },

    row: {
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        theme.colors
          .darkSurface,
      borderWidth: 1,
      borderColor:
        theme.colors
          .borderDark,
      borderRadius: 17,
      padding: 13,
      marginBottom: 8,
    },

    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor:
        'rgba(217,184,120,0.12)',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    rowCopy: {
      flex: 1,
      marginLeft: 11,
    },

    rowTitle: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 12.5,
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

    muted: {
      color:
        theme.colors
          .white40,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 12,
      marginBottom: 18,
    },

    submission: {
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        theme.colors
          .darkSurface2,
      borderRadius: 16,
      padding: 10,
      marginBottom: 7,
    },

    approve: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor:
        'rgba(110,146,119,0.14)',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginLeft: 6,
    },

    reject: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor:
        'rgba(184,92,104,0.12)',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.55)',
      justifyContent:
        'flex-end',
    },

    modal: {
      backgroundColor:
        theme.colors.surface,
      borderTopLeftRadius:
        28,
      borderTopRightRadius:
        28,
      padding: 22,
      paddingBottom: 34,
    },

    modalTitle: {
      color:
        theme.colors
          .textPrimary,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 25,
      marginBottom: 16,
    },

    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      color:
        theme.colors
          .textPrimary,
      fontFamily:
        theme.typography
          .families.body,
      marginBottom: 10,
    },

    multiline: {
      height: 100,
      textAlignVertical:
        'top',
      paddingTop: 13,
    },

    typeRow: {
      flexDirection:
        'row',
      gap: 8,
      marginBottom: 11,
    },

    typeChip: {
      flex: 1,
      paddingVertical: 10,
      alignItems:
        'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
    },

    typeChipActive: {
      backgroundColor:
        theme.colors.primary,
      borderColor:
        theme.colors.primary,
    },

    typeText: {
      color:
        theme.colors
          .textSecondary,
      fontSize: 11,
    },

    typeTextActive: {
      color:
        theme.colors.white,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
    },

    cancel: {
      alignItems:
        'center',
      paddingTop: 14,
    },

    cancelText: {
      color:
        theme.colors
          .textSecondary,
      fontFamily:
        theme.typography
          .families
          .bodyMedium,
      fontSize: 12,
    },
  });