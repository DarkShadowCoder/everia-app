
// app/profile/edit.js

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import {
  router,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  Image,
} from 'expo-image';

import theme from '@/theme';

import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

import {
  useAuthStore,
} from '@/store/authStore';

import {
  useUIStore,
} from '@/store/uiStore';

import {
  supabase,
} from '@/lib/supabase';

import {
  avatarUrl,
  uploadAvatarFile,
} from '@/lib/storage';

// ============================================================
// HELPERS
// ============================================================

function getErrorMessage(error) {
  if (!error) {
    return 'Une erreur inconnue est survenue.';
  }

  return (
    error.message ||
    error.error_description ||
    error.details ||
    'Une erreur inconnue est survenue.'
  );
}

// ============================================================
// MAIN SCREEN
// ============================================================

export default function EditProfile() {
  const {
    user,
    profile,
    refreshProfile,
  } = useAuthStore();

  const showToast =
    useUIStore(
      (state) =>
        state.showToast
    );

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [
    displayName,
    setDisplayName,
  ] = useState(
    profile?.display_name ||
      ''
  );

  const [
    bio,
    setBio,
  ] = useState(
    profile?.bio ||
      ''
  );

  const [
    avatarPath,
    setAvatarPath,
  ] = useState(
    profile?.avatar_path ||
      null
  );

  const [
    saving,
    setSaving,
  ] = useState(
    false
  );

  const [
    uploadingAvatar,
    setUploadingAvatar,
  ] = useState(
    false
  );

  // ==========================================================
  // SYNC PROFILE -> FORM
  // ==========================================================

  useEffect(() => {
    if (!profile) {
      return;
    }

    setDisplayName(
      profile.display_name ||
        ''
    );

    setBio(
      profile.bio ||
        ''
    );

    setAvatarPath(
      profile.avatar_path ||
        null
    );
  }, [profile]);

  // ==========================================================
  // AVATAR URL
  // ==========================================================

  const currentAvatarUrl =
    useMemo(
      () =>
        avatarPath
          ? avatarUrl(
              avatarPath
            )
          : null,
      [avatarPath]
    );

  // ==========================================================
  // PICK AVATAR
  // ==========================================================

  const pickAvatar =
    async () => {
      if (
        uploadingAvatar ||
        saving
      ) {
        return;
      }

      if (!user?.id) {
        showToast(
          'Utilisateur non authentifié.',
          'error'
        );

        return;
      }

      // ------------------------------------------------------
      // Permission
      // ------------------------------------------------------

      const permission =
        await ImagePicker
          .requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showToast(
          'L’accès à la galerie est nécessaire pour modifier votre photo.',
          'warning'
        );

        return;
      }

      // ------------------------------------------------------
      // Picker
      // ------------------------------------------------------

      let result;

      try {
        result =
          await ImagePicker
            .launchImageLibraryAsync(
              {
                mediaTypes:
                  ImagePicker
                    .MediaTypeOptions
                    .Images,

                allowsEditing:
                  true,

                aspect: [
                  1,
                  1,
                ],

                quality:
                  0.88,
              }
            );
      } catch (error) {
        console.error(
          '[EditProfile] Image picker error:',
          error
        );

        showToast(
          getErrorMessage(
            error
          ),
          'error'
        );

        return;
      }

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const asset =
        result.assets[0];

      if (!asset?.uri) {
        showToast(
          'Impossible de récupérer l’image sélectionnée.',
          'error'
        );

        return;
      }

      // ------------------------------------------------------
      // Upload
      // ------------------------------------------------------

      setUploadingAvatar(
        true
      );

      try {
        // ----------------------------------------------------
        // Vérifier la session réelle
        // ----------------------------------------------------

        const {
          data:
            sessionData,
          error:
            sessionError,
        } =
          await supabase.auth
            .getSession();

        if (
          sessionError
        ) {
          throw sessionError;
        }

        const currentUserId =
          sessionData
            ?.session
            ?.user
            ?.id;

        if (!currentUserId) {
          throw new Error(
            'Votre session a expiré. Veuillez vous reconnecter.'
          );
        }

        if (
          currentUserId !==
          user.id
        ) {
          throw new Error(
            'La session utilisateur actuelle ne correspond pas au profil.'
          );
        }

        // ----------------------------------------------------
        // Upload dans le bucket avatars
        // ----------------------------------------------------

        const uploadedPath =
          await uploadAvatarFile({
            userId:
              currentUserId,

            uri:
              asset.uri,

            fileName:
              asset.fileName ||
              `avatar-${Date.now()}.jpg`,

            contentType:
              asset.mimeType ||
              'image/jpeg',
          });

        if (
          !uploadedPath
        ) {
          throw new Error(
            'Le chemin de la photo de profil est introuvable.'
          );
        }

        // ----------------------------------------------------
        // Mise à jour locale immédiate
        // ----------------------------------------------------

        setAvatarPath(
          uploadedPath
        );

        showToast(
          'Photo de profil importée.',
          'success'
        );
      } catch (error) {
        console.error(
          '[EditProfile] Avatar upload error:',
          error
        );

        showToast(
          getErrorMessage(
            error
          ),
          'error'
        );
      } finally {
        setUploadingAvatar(
          false
        );
      }
    };

  // ==========================================================
  // SAVE PROFILE
  // ==========================================================

  const handleSave =
    async () => {
      if (!user?.id) {
        showToast(
          'Utilisateur non authentifié.',
          'error'
        );

        return;
      }

      const cleanDisplayName =
        displayName.trim();

      const cleanBio =
        bio.trim();

      if (
        !cleanDisplayName
      ) {
        showToast(
          'Le nom affiché est obligatoire.',
          'warning'
        );

        return;
      }

      setSaving(
        true
      );

      try {
        // ----------------------------------------------------
        // Session
        // ----------------------------------------------------

        const {
          data:
            sessionData,
          error:
            sessionError,
        } =
          await supabase.auth
            .getSession();

        if (
          sessionError
        ) {
          throw sessionError;
        }

        const currentUserId =
          sessionData
            ?.session
            ?.user
            ?.id;

        if (!currentUserId) {
          throw new Error(
            'Votre session a expiré. Veuillez vous reconnecter.'
          );
        }

        if (
          currentUserId !==
          user.id
        ) {
          throw new Error(
            'La session utilisateur actuelle ne correspond pas au profil.'
          );
        }

        // ----------------------------------------------------
        // Update DB
        // ----------------------------------------------------

        const {
          error,
        } =
          await supabase
            .from('profiles')
            .update({
              display_name:
                cleanDisplayName,

              bio:
                cleanBio ||
                null,

              avatar_path:
                avatarPath ||
                null,

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              'id',
              currentUserId
            );

        if (error) {
          throw error;
        }

        // ----------------------------------------------------
        // Refresh global store
        // ----------------------------------------------------

        await refreshProfile();

        showToast(
          'Profil mis à jour avec succès.',
          'success'
        );

        router.back();
      } catch (error) {
        console.error(
          '[EditProfile] Save error:',
          error
        );

        showToast(
          getErrorMessage(
            error
          ),
          'error'
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel =
    () => {
      if (
        saving ||
        uploadingAvatar
      ) {
        return;
      }

      router.back();
    };

  // ==========================================================
  // DELETE / REMOVE AVATAR
  // ==========================================================

  const confirmRemoveAvatar =
    () => {
      if (
        !avatarPath ||
        uploadingAvatar ||
        saving
      ) {
        return;
      }

      Alert.alert(
        'Supprimer la photo',

        'Voulez-vous supprimer votre photo de profil ?',

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
              removeAvatar,
          },
        ]
      );
    };

  const removeAvatar =
    async () => {
      if (
        !user?.id ||
        !avatarPath
      ) {
        return;
      }

      setUploadingAvatar(
        true
      );

      try {
        // ----------------------------------------------------
        // Vérification session
        // ----------------------------------------------------

        const {
          data:
            sessionData,
          error:
            sessionError,
        } =
          await supabase.auth
            .getSession();

        if (
          sessionError
        ) {
          throw sessionError;
        }

        const currentUserId =
          sessionData
            ?.session
            ?.user
            ?.id;

        if (!currentUserId) {
          throw new Error(
            'Votre session a expiré.'
          );
        }

        // ----------------------------------------------------
        // Supprimer le fichier
        // ----------------------------------------------------

        const {
          error:
            storageError,
        } =
          await supabase.storage
            .from(
              'avatars'
            )
            .remove([
              avatarPath,
            ]);

        if (
          storageError
        ) {
          console.warn(
            '[EditProfile] Avatar storage delete error:',
            storageError
          );
        }

        // ----------------------------------------------------
        // Supprimer la référence DB
        // ----------------------------------------------------

        const {
          error:
            profileError,
        } =
          await supabase
            .from('profiles')
            .update({
              avatar_path:
                null,

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              'id',
              currentUserId
            );

        if (
          profileError
        ) {
          throw profileError;
        }

        setAvatarPath(
          null
        );

        await refreshProfile();

        showToast(
          'Photo de profil supprimée.',
          'success'
        );
      } catch (error) {
        console.error(
          '[EditProfile] Remove avatar error:',
          error
        );

        showToast(
          getErrorMessage(
            error
          ),
          'error'
        );
      } finally {
        setUploadingAvatar(
          false
        );
      }
    };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (!user) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="small"
          color={
            theme.colors
              .champagneDark
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Chargement du profil…
        </Text>
      </View>
    );
  }

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
        title="Modifier mon profil"
        rightActions={[
          {
            icon:
              'close-outline',

            onPress:
              handleCancel,
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* ================================================== */}
        {/* PROFILE HERO */}
        {/* ================================================== */}

        <View
          style={
            styles.profileHero
          }
        >
          <View
            style={
              styles.avatarContainer
            }
          >
            {currentAvatarUrl ? (
              <Image
                source={{
                  uri:
                    currentAvatarUrl,
                }}
                style={
                  styles.avatarImage
                }
                contentFit="cover"
                transition={
                  180
                }
              />
            ) : (
              <View
                style={
                  styles.avatarFallback
                }
              >
                <Ionicons
                  name="person-outline"
                  size={38}
                  color={
                    theme.colors
                      .champagneDark
                  }
                />
              </View>
            )}

            <Pressable
              onPress={
                pickAvatar
              }
              disabled={
                uploadingAvatar ||
                saving
              }
              style={({
                pressed,
              }) => [
                styles.cameraButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              {uploadingAvatar ? (
                <ActivityIndicator
                  size="small"
                  color={
                    theme.colors
                      .white
                  }
                />
              ) : (
                <Ionicons
                  name="camera"
                  size={17}
                  color={
                    theme.colors
                      .white
                  }
                />
              )}
            </Pressable>
          </View>

          <Text
            style={
              styles.profileName
            }
          >
            {displayName ||
              'Votre profil'}
          </Text>

          <Text
            style={
              styles.profileHint
            }
          >
            Votre photo sera visible
            par les participants avec
            lesquels vous partagez des
            souvenirs.
          </Text>

          {avatarPath ? (
            <Pressable
              onPress={
                confirmRemoveAvatar
              }
              disabled={
                uploadingAvatar ||
                saving
              }
              style={
                styles.removeAvatarButton
              }
            >
              <Ionicons
                name="trash-outline"
                size={13}
                color={
                  theme.colors
                    .error
                }
              />

              <Text
                style={
                  styles.removeAvatarText
                }
              >
                Supprimer la photo
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* ================================================== */}
        {/* FORM */}
        {/* ================================================== */}

        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionEyebrow
            }
          >
            INFORMATIONS
          </Text>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Votre identité
          </Text>

          <View
            style={
              styles.formCard
            }
          >
            <Input
              label="Nom affiché"
              value={
                displayName
              }
              onChangeText={
                setDisplayName
              }
              placeholder="Votre nom"
              style={
                styles.firstInput
              }
              editable={
                !saving &&
                !uploadingAvatar
              }
            />

            <Input
              label="Biographie"
              value={
                bio
              }
              onChangeText={
                setBio
              }
              placeholder="Parlez un peu de vous…"
              multiline
              numberOfLines={
                4
              }
              style={
                styles.bioInput
              }
              editable={
                !saving &&
                !uploadingAvatar
              }
            />
          </View>
        </View>

        {/* ================================================== */}
        {/* ACCOUNT INFO */}
        {/* ================================================== */}

        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionEyebrow
            }
          >
            COMPTE
          </Text>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Informations du compte
          </Text>

          <View
            style={
              styles.accountCard
            }
          >
            <View
              style={
                styles.accountIcon
              }
            >
              <Ionicons
                name="person-circle-outline"
                size={19}
                color={
                  theme.colors
                    .champagneDark
                }
              />
            </View>

            <View
              style={
                styles.accountCopy
              }
            >
              <Text
                style={
                  styles.accountLabel
                }
              >
                Identifiant
              </Text>

              <Text
                style={
                  styles.accountValue
                }
                numberOfLines={
                  1
                }
              >
                {user.id}
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* ACTIONS */}
        {/* ================================================== */}

        <View
          style={
            styles.actions
          }
        >
          <Button
            title="Enregistrer les modifications"
            onPress={
              handleSave
            }
            loading={
              saving
            }
            disabled={
              uploadingAvatar
            }
            icon="checkmark"
            style={
              styles.saveButton
            }
          />

          <Pressable
            onPress={
              handleCancel
            }
            disabled={
              saving ||
              uploadingAvatar
            }
            style={
              styles.cancelButton
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

        <View
          style={
            styles.bottomSpacer
          }
        />
      </ScrollView>
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

  loadingScreen: {
    flex: 1,

    alignItems:
      'center',

    justifyContent:
      'center',

    backgroundColor:
      theme.colors
        .background,
  },

  loadingText: {
    marginTop:
      10,

    color:
      theme.colors
        .textSecondary,

    fontFamily:
      theme.typography
        .families
        .body,

    fontSize: 11,
  },

  content: {
    paddingHorizontal:
      theme.layout
        .screenHorizontal,

    paddingTop:
      theme.spacing.lg,

    paddingBottom: 50,
  },

  // ==========================================================
  // PROFILE HERO
  // ==========================================================

  profileHero: {
    alignItems:
      'center',

    paddingVertical:
      theme.spacing.lg,
  },

  avatarContainer: {
    width: 118,
    height: 118,

    borderRadius: 59,

    position:
      'relative',

    backgroundColor:
      theme.colors
        .surfaceSoft,

    borderWidth: 1,

    borderColor:
      theme.colors
        .border,

    ...theme.shadows.md,
  },

  avatarImage: {
    width: '100%',
    height: '100%',

    borderRadius: 59,
  },

  avatarFallback: {
    width: '100%',
    height: '100%',

    borderRadius: 59,

    alignItems:
      'center',

    justifyContent:
      'center',

    backgroundColor:
      theme.colors
        .champagneSoft,
  },

  cameraButton: {
    position:
      'absolute',

    right: 0,
    bottom: 3,

    width: 39,
    height: 39,

    borderRadius: 20,

    alignItems:
      'center',

    justifyContent:
      'center',

    backgroundColor:
      theme.colors
        .primary,

    borderWidth: 3,

    borderColor:
      theme.colors
        .background,
  },

  buttonPressed: {
    opacity: 0.8,

    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  profileName: {
    marginTop:
      theme.spacing.md,

    color:
      theme.colors
        .textPrimary,

    fontFamily:
      theme.typography
        .families
        .displaySemiBold,

    fontSize: 22,
  },

  profileHint: {
    marginTop: 6,

    maxWidth: 310,

    textAlign:
      'center',

    color:
      theme.colors
        .textSecondary,

    fontFamily:
      theme.typography
        .families
        .body,

    fontSize: 10.5,

    lineHeight: 16,
  },

  removeAvatarButton: {
    marginTop:
      theme.spacing.md,

    flexDirection:
      'row',

    alignItems:
      'center',

    gap: 5,
  },

  removeAvatarText: {
    color:
      theme.colors
        .error,

    fontFamily:
      theme.typography
        .families
        .bodySemiBold,

    fontSize: 10,
  },

  // ==========================================================
  // SECTIONS
  // ==========================================================

  section: {
    marginTop:
      theme.spacing.xxxl,
  },

  sectionEyebrow: {
    color:
      theme.colors
        .champagneDark,

    fontFamily:
      theme.typography
        .families
        .bodySemiBold,

    fontSize: 9,

    letterSpacing: 1.7,
  },

  sectionTitle: {
    marginTop: 3,

    color:
      theme.colors
        .textPrimary,

    fontFamily:
      theme.typography
        .families
        .displaySemiBold,

    fontSize: 21,

    lineHeight: 27,
  },

  // ==========================================================
  // FORM
  // ==========================================================

  formCard: {
    marginTop:
      theme.spacing.md,

    padding: 15,

    borderRadius:
      theme.radius.xl,

    backgroundColor:
      theme.colors
        .surfaceSoft,

    borderWidth: 1,

    borderColor:
      theme.colors
        .border,
  },

  firstInput: {
    marginTop: 0,
  },

  bioInput: {
    marginTop:
      theme.spacing.lg,
  },

  // ==========================================================
  // ACCOUNT
  // ==========================================================

  accountCard: {
    marginTop:
      theme.spacing.md,

    minHeight: 68,

    paddingHorizontal: 12,

    flexDirection:
      'row',

    alignItems:
      'center',

    borderRadius:
      theme.radius.xl,

    backgroundColor:
      theme.colors
        .surfaceSoft,

    borderWidth: 1,

    borderColor:
      theme.colors
        .border,
  },

  accountIcon: {
    width: 39,
    height: 39,

    borderRadius: 13,

    alignItems:
      'center',

    justifyContent:
      'center',

    backgroundColor:
      theme.colors
        .champagneSoft,
  },

  accountCopy: {
    flex: 1,

    marginLeft: 11,
  },

  accountLabel: {
    color:
      theme.colors
        .textSecondary,

    fontFamily:
      theme.typography
        .families
        .bodyMedium,

    fontSize: 9,
  },

  accountValue: {
    marginTop: 3,

    color:
      theme.colors
        .textPrimary,

    fontFamily:
      theme.typography
        .families
        .mono,

    fontSize: 9,
  },

  // ==========================================================
  // ACTIONS
  // ==========================================================

  actions: {
    marginTop:
      theme.spacing.xxxl,
  },

  saveButton: {
    width:
      '100%',
  },

  cancelButton: {
    height: 43,

    marginTop:
      theme.spacing.md,

    alignItems:
      'center',

    justifyContent:
      'center',

    borderRadius:
      theme.radius.pill,

    borderWidth: 1,

    borderColor:
      theme.colors
        .border,
  },

  cancelText: {
    color:
      theme.colors
        .textSecondary,

    fontFamily:
      theme.typography
        .families
        .bodySemiBold,

    fontSize: 11,
  },

  bottomSpacer: {
    height: 30,
  },
});