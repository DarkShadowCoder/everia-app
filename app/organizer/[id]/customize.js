// app/organizer/[id]/customize.js

import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import theme from '@/theme';

import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import EventStatusBadge from '@/components/event/EventStatusBadge';

import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

import { supabase } from '@/lib/supabase';

const EVENT_COVERS_BUCKET = 'event-covers';

const STATUS_FLOW = {
  draft: {
    next: 'active',
    label: 'Publier l’événement',
    icon: 'rocket-outline',
  },

  active: {
    next: 'live',
    label: 'Passer en direct',
    icon: 'flash-outline',
  },

  live: {
    next: 'closing',
    label: 'Clore les envois',
    icon: 'hourglass-outline',
  },
};

const FEATURE_TOGGLES = [
  {
    key: 'live_wall_enabled',
    label: 'Live Wall',
    description: 'Mur de photos en temps réel.',
    icon: 'images-outline',
  },

  {
    key: 'allow_challenges',
    label: 'Défis',
    description: 'Activer les défis gamifiés.',
    icon: 'trophy-outline',
  },

  {
    key: 'require_media_approval',
    label: 'Modération avant publication',
    description: 'Valider chaque photo/vidéo avant diffusion.',
    icon: 'shield-checkmark-outline',
  },

  {
    key: 'allow_guest_access',
    label: 'Accès invité sans compte',
    description: 'Autoriser la participation sans créer de compte.',
    icon: 'person-outline',
  },
];

function normalizeId(value) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function isValidUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

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

export default function OrganizerCustomize() {
  const params = useLocalSearchParams();

  const routeEventId = normalizeId(params.id);

  const {
    event,
    loadEvent,
  } = useEventStore();

  const eventId = isValidUuid(routeEventId)
    ? routeEventId
    : isValidUuid(event?.id)
      ? event.id
      : null;

  const user = useAuthStore(
    (state) => state.user
  );

  const showToast = useUIStore(
    (state) => state.showToast
  );

  const [
    name,
    setName,
  ] = useState('');

  const [
    venueName,
    setVenueName,
  ] = useState('');

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploadingCover,
    setUploadingCover,
  ] = useState(false);

  const [
    coverUrl,
    setCoverUrl,
  ] = useState(null);

  useEffect(() => {
    if (!event) {
      return;
    }

    setName(event.name || '');
    setVenueName(event.venue_name || '');
  }, [event]);

  useEffect(() => {
    let mounted = true;

    const loadCoverUrl = async () => {
      if (!event?.cover_path) {
        if (mounted) {
          setCoverUrl(null);
        }

        return;
      }

      const {
        data,
        error,
      } = await supabase.storage
        .from(EVENT_COVERS_BUCKET)
        .createSignedUrl(
          event.cover_path,
          3600
        );

      if (error) {
        console.warn(
          '[OrganizerCustomize] Signed cover URL error:',
          error
        );

        if (mounted) {
          setCoverUrl(null);
        }

        return;
      }

      if (mounted) {
        setCoverUrl(
          data?.signedUrl || null
        );
      }
    };

    loadCoverUrl();

    return () => {
      mounted = false;
    };
  }, [event?.cover_path]);

  const refreshEvent = async () => {
    if (!eventId) {
      return;
    }

    try {
      await loadEvent(
        eventId,
        user?.id
      );
    } catch (error) {
      console.warn(
        '[OrganizerCustomize] loadEvent error:',
        error
      );
    }
  };

  const toggleFeature = async (
    key,
    value
  ) => {
    if (!eventId) {
      showToast(
        'Impossible de déterminer l’événement à modifier.',
        'error'
      );

      return;
    }

    const {
      error,
    } = await supabase
      .from('events')
      .update({
        [key]: value,
      })
      .eq(
        'id',
        eventId
      );

    if (error) {
      console.error(
        '[OrganizerCustomize] Feature update error:',
        error
      );

      showToast(
        getErrorMessage(error),
        'error'
      );

      return;
    }

    await refreshEvent();
  };

  const pickCover = async () => {
    if (
      uploadingCover ||
      !eventId
    ) {
      if (!eventId) {
        showToast(
          'Impossible de déterminer l’événement à modifier.',
          'error'
        );
      }

      return;
    }

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        '[OrganizerCustomize] Session error:',
        sessionError
      );

      showToast(
        'Impossible de vérifier votre session.',
        'error'
      );

      return;
    }

    const currentUserId =
      sessionData?.session?.user?.id;

    if (!currentUserId) {
      showToast(
        'Votre session a expiré. Veuillez vous reconnecter.',
        'error'
      );

      return;
    }

    const permission =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showToast(
        'L’autorisation d’accès à la galerie est nécessaire.',
        'warning'
      );

      return;
    }

    let result;

    try {
      result =
        await ImagePicker
          .launchImageLibraryAsync({
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .Images,

            allowsEditing: true,

            aspect: [
              16,
              9,
            ],

            quality: 0.9,
          });
    } catch (error) {
      console.error(
        '[OrganizerCustomize] Image picker error:',
        error
      );

      showToast(
        getErrorMessage(error),
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

    setUploadingCover(true);

    try {
      const extension =
        asset.fileName
          ?.split('.')
          .pop()
          ?.toLowerCase();

      const safeExtension = [
        'jpg',
        'jpeg',
        'png',
        'webp',
        'heic',
        'heif',
      ].includes(extension)
        ? extension
        : 'jpg';

      const storagePath =
        `${eventId}/cover.${safeExtension}`;

      const response =
        await fetch(asset.uri);

      if (!response.ok) {
        throw new Error(
          'Impossible de lire l’image sélectionnée.'
        );
      }

      const arrayBuffer =
        await response.arrayBuffer();

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(EVENT_COVERS_BUCKET)
          .upload(
            storagePath,
            arrayBuffer,
            {
              contentType:
                asset.mimeType ||
                'image/jpeg',

              cacheControl: '3600',
              upsert: true,
            }
          );

      if (uploadError) {
        console.error(
          '[OrganizerCustomize] Storage upload rejected:',
          {
            bucket:
              EVENT_COVERS_BUCKET,

            path:
              storagePath,

            userId:
              currentUserId,

            eventId,
            error:
              uploadError,
          }
        );

        throw uploadError;
      }

      const {
        error: updateError,
      } =
        await supabase
          .from('events')
          .update({
            cover_path:
              storagePath,
          })
          .eq(
            'id',
            eventId
          );

      if (updateError) {
        throw updateError;
      }

      const {
        data: signedData,
        error: signedError,
      } =
        await supabase.storage
          .from(EVENT_COVERS_BUCKET)
          .createSignedUrl(
            storagePath,
            3600
          );

      if (!signedError) {
        setCoverUrl(
          signedData?.signedUrl || null
        );
      }

      await refreshEvent();

      showToast(
        'Photo de couverture mise à jour.',
        'success'
      );
    } catch (error) {
      console.error(
        '[OrganizerCustomize] Cover upload error:',
        error
      );

      showToast(
        getErrorMessage(error),
        'error'
      );
    } finally {
      setUploadingCover(false);
    }
  };

  const saveDetails = async () => {
    if (!eventId) {
      showToast(
        'Impossible de déterminer l’événement à modifier.',
        'error'
      );

      return;
    }

    const trimmedName =
      name.trim();

    const trimmedVenue =
      venueName.trim();

    if (!trimmedName) {
      showToast(
        'Le nom de l’événement est obligatoire.',
        'warning'
      );

      return;
    }

    setSaving(true);

    try {
      const {
        error,
      } = await supabase
        .from('events')
        .update({
          name:
            trimmedName,

          venue_name:
            trimmedVenue ||
            null,
        })
        .eq(
          'id',
          eventId
        );

      if (error) {
        throw error;
      }

      await refreshEvent();

      showToast(
        'Événement mis à jour.',
        'success'
      );
    } catch (error) {
      console.error(
        '[OrganizerCustomize] Save details error:',
        error
      );

      showToast(
        getErrorMessage(error),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const finalizeEvent = async () => {
    if (!eventId) {
      showToast(
        'Impossible de déterminer l’événement à modifier.',
        'error'
      );

      return;
    }

    const {
      error,
    } = await supabase.rpc(
      'finalize_event',
      {
        p_event_id:
          eventId,
      }
    );

    if (error) {
      showToast(
        getErrorMessage(error),
        'error'
      );

      return;
    }

    showToast(
      'Événement clôturé avec succès.',
      'success'
    );

    await refreshEvent();
  };

  const confirmFinalize = () => {
    Alert.alert(
      'Clôturer l’événement',
      "Une fois clôturé, l'événement passera en mode Replay/Best Of. Continuer ?",
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },

        {
          text: 'Clôturer',
          style: 'destructive',
          onPress:
            finalizeEvent,
        },
      ]
    );
  };

  const advanceStatus = async () => {
    if (
      !event?.status ||
      !eventId
    ) {
      return;
    }

    const step =
      STATUS_FLOW[event.status];

    if (!step) {
      return;
    }

    const {
      error,
    } = await supabase
      .from('events')
      .update({
        status:
          step.next,
      })
      .eq(
        'id',
        eventId
      );

    if (error) {
      showToast(
        getErrorMessage(error),
        'error'
      );

      return;
    }

    showToast(
      'Statut de l’événement mis à jour.',
      'success'
    );

    await refreshEvent();
  };

  if (!event) {
    return (
      <View style={styles.loadingScreen}>
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
          Chargement de l’événement…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        title="Personnalisation"
        subtitle={
          event.name ||
          'Événement'
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
        <View
          style={
            styles.statusRow
          }
        >
          <EventStatusBadge
            status={event.status}
          />
        </View>

        <View
          style={
            styles.coverSection
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <View
              style={
                styles.sectionHeaderText
              }
            >
              <Text
                style={
                  styles.sectionEyebrow
                }
              >
                IDENTITÉ VISUELLE
              </Text>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Photo de couverture
              </Text>
            </View>

            <View
              style={
                styles.sectionIcon
              }
            >
              <Ionicons
                name="image-outline"
                size={17}
                color={
                  theme.colors
                    .primaryDark
                }
              />
            </View>
          </View>

          <Pressable
            onPress={pickCover}
            disabled={
              uploadingCover
            }
            style={({
              pressed,
            }) => [
              styles.coverWrap,
              pressed &&
                !uploadingCover &&
                styles.coverPressed,
            ]}
          >
            {coverUrl ? (
              <Image
                source={{
                  uri: coverUrl,
                }}
                style={
                  StyleSheet.absoluteFillObject
                }
                contentFit="cover"
                transition={250}
              />
            ) : (
              <View
                style={
                  styles.coverPlaceholder
                }
              >
                <View
                  style={
                    styles.coverPlaceholderIcon
                  }
                >
                  <Ionicons
                    name="image-outline"
                    size={26}
                    color={
                      theme.colors
                        .champagneDark
                    }
                  />
                </View>

                <Text
                  style={
                    styles.coverPlaceholderTitle
                  }
                >
                  Aucune couverture
                </Text>

                <Text
                  style={
                    styles.coverPlaceholderText
                  }
                >
                  Ajoutez une image
                  au format paysage
                </Text>
              </View>
            )}

            <View
              style={
                styles.coverOverlay
              }
            >
              <View
                style={
                  styles.coverAction
                }
              >
                {uploadingCover ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      theme.colors
                        .white
                    }
                  />
                ) : (
                  <Ionicons
                    name="camera-outline"
                    size={19}
                    color={
                      theme.colors
                        .white
                    }
                  />
                )}

                <Text
                  style={
                    styles.coverLabel
                  }
                >
                  {uploadingCover
                    ? 'Upload en cours…'
                    : coverUrl
                      ? 'Changer la couverture'
                      : 'Ajouter une couverture'}
                </Text>
              </View>
            </View>
          </Pressable>

          <Text
            style={
              styles.coverHint
            }
          >
            Une image en format paysage offre le
            meilleur rendu sur les cartes et pages
            de l’événement.
          </Text>
        </View>

        <View
          style={
            styles.detailsSection
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <View
              style={
                styles.sectionHeaderText
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
                Détails de l’événement
              </Text>
            </View>
          </View>

          <Input
            label="Nom de l'événement"
            value={name}
            onChangeText={setName}
            style={
              styles.inputFirst
            }
          />

          <Input
            label="Lieu"
            value={venueName}
            onChangeText={
              setVenueName
            }
            icon="location-outline"
            style={
              styles.inputSecond
            }
          />

          <Button
            title="Enregistrer"
            onPress={saveDetails}
            loading={saving}
            style={
              styles.saveButton
            }
          />
        </View>

        <View
          style={
            styles.featuresSection
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <View
              style={
                styles.sectionHeaderText
              }
            >
              <Text
                style={
                  styles.sectionEyebrow
                }
              >
                EXPÉRIENCE
              </Text>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Fonctionnalités
              </Text>
            </View>
          </View>

          <View
            style={
              styles.featureCard
            }
          >
            {FEATURE_TOGGLES.map(
              (
                toggle,
                index
              ) => (
                <View
                  key={
                    toggle.key
                  }
                  style={[
                    styles.toggleRow,
                    index ===
                      FEATURE_TOGGLES.length -
                        1 &&
                      styles.toggleRowLast,
                  ]}
                >
                  <View
                    style={
                      styles.toggleIcon
                    }
                  >
                    <Ionicons
                      name={
                        toggle.icon
                      }
                      size={16}
                      color={
                        theme.colors
                          .champagneDark
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.toggleTextWrap
                    }
                  >
                    <Text
                      style={
                        styles.toggleLabel
                      }
                    >
                      {
                        toggle.label
                      }
                    </Text>

                    <Text
                      style={
                        styles.toggleDesc
                      }
                    >
                      {
                        toggle.description
                      }
                    </Text>
                  </View>

                  <Switch
                    value={
                      !!event[
                        toggle.key
                      ]
                    }
                    onValueChange={(
                      value
                    ) =>
                      toggleFeature(
                        toggle.key,
                        value
                      )
                    }
                    trackColor={{
                      false:
                        theme.colors
                          .border,
                      true:
                        theme.colors
                          .primary,
                    }}
                    thumbColor={
                      theme.colors
                        .white
                    }
                  />
                </View>
              )
            )}
          </View>
        </View>

        {STATUS_FLOW[
          event.status
        ] && (
          <Button
            title={
              STATUS_FLOW[
                event.status
              ].label
            }
            icon={
              STATUS_FLOW[
                event.status
              ].icon
            }
            variant="gold"
            onPress={
              advanceStatus
            }
            style={
              styles.statusButton
            }
          />
        )}

        <Button
          title="Clôturer l'événement"
          variant="danger"
          onPress={
            confirmFinalize
          }
          style={
            styles.finalizeButton
          }
        />

        <View
          style={
            styles.bottomSpacer
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    color:
      theme.colors.textSecondary,
    fontFamily:
      theme.typography.families.body,
    fontSize: 11,
  },

  body: {
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingTop:
      theme.spacing.md,
    paddingBottom: 60,
  },

  statusRow: {
    marginBottom:
      theme.spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent:
      'space-between',
    marginBottom:
      theme.spacing.md,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionEyebrow: {
    color:
      theme.colors.champagneDark,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.7,
  },

  sectionTitle: {
    marginTop: 3,
    color:
      theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 21,
    lineHeight: 27,
  },

  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.champagneSoft,
  },

  coverSection: {
    marginBottom:
      theme.spacing.xxxl,
  },

  coverWrap: {
    height: 210,
    borderRadius:
      theme.radius.xl,
    overflow: 'hidden',
    backgroundColor:
      theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },

  coverPressed: {
    opacity: 0.9,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  coverPlaceholderIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.champagneSoft,
  },

  coverPlaceholderTitle: {
    marginTop: 12,
    color:
      theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 13,
  },

  coverPlaceholderText: {
    marginTop: 4,
    color:
      theme.colors.textSecondary,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
  },

  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      'rgba(8,4,10,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  coverAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    height: 42,
    borderRadius:
      theme.radius.pill,
    backgroundColor:
      'rgba(20,9,23,0.74)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.16)',
  },

  coverLabel: {
    color:
      theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11,
  },

  coverHint: {
    marginTop: 8,
    color:
      theme.colors.textSecondary,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
    lineHeight: 15,
  },

  detailsSection: {
    marginBottom:
      theme.spacing.xxxl,
  },

  inputFirst: {
    marginTop: 2,
  },

  inputSecond: {
    marginTop:
      theme.spacing.lg,
  },

  saveButton: {
    marginTop:
      theme.spacing.lg,
  },

  featuresSection: {
    marginBottom:
      theme.spacing.xxxl,
  },

  featureCard: {
    overflow: 'hidden',
    borderRadius:
      theme.radius.xl,
    backgroundColor:
      theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
  },

  toggleRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    borderBottomColor:
      theme.colors.border,
  },

  toggleRowLast: {
    borderBottomWidth: 0,
  },

  toggleIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.champagneSoft,
  },

  toggleTextWrap: {
    flex: 1,
    marginLeft: 11,
    marginRight: 10,
  },

  toggleLabel: {
    color:
      theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 12.5,
  },

  toggleDesc: {
    marginTop: 3,
    color:
      theme.colors.textSecondary,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    lineHeight: 15,
  },

  statusButton: {
    marginTop: 1,
  },

  finalizeButton: {
    marginTop:
      theme.spacing.md,
  },

  bottomSpacer: {
    height: 30,
  },
});