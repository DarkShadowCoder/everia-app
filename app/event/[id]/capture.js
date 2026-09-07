// app/event/[id]/capture.js
// ============================================================
// EVERIA — Event Capture
// Refonte UI/UX complète
//
// Direction artistique :
// Premium Immersive Camera / Social Capture
//
// Fonctionnalités conservées :
// - Caméra avant / arrière
// - Flash
// - Photo
// - Vidéo via appui long
// - Import depuis la galerie
// - Upload Supabase
// - Progression d'upload
// ============================================================

import React, {
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';

import * as ImagePicker from 'expo-image-picker';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import theme from '@/theme';

import IconButton from '@/components/ui/IconButton';

import {
  useAuthStore,
} from '@/store/authStore';

import {
  useMediaUpload,
} from '@/hooks/useMediaUpload';

import {
  useUIStore,
} from '@/store/uiStore';

// ============================================================
// SCREEN
// ============================================================

export default function EventCapture() {
  const {
    id,
  } = useLocalSearchParams();

  const {
    user,
  } = useAuthStore();

  const showToast =
    useUIStore(
      (state) =>
        state.showToast
    );

  const {
    uploadAsset,
    isUploading,
    progress,
  } =
    useMediaUpload({
      eventId: id,
      uploaderId:
        user?.id,
    });

  const [
    permission,
    requestPermission,
  ] =
    useCameraPermissions();

  const [
    micPermission,
    requestMicPermission,
  ] =
    useMicrophonePermissions();

  const [
    facing,
    setFacing,
  ] = useState(
    'back'
  );

  const [
    flash,
    setFlash,
  ] = useState(
    'off'
  );

  const [
    isRecording,
    setIsRecording,
  ] = useState(
    false
  );

  const [
    activeMode,
    setActiveMode,
  ] = useState(
    'photo'
  );

  const cameraRef =
    useRef(null);

  // ==========================================================
  // PERMISSION
  // ==========================================================

  if (
    !permission?.granted
  ) {
    return (
      <PermissionScreen
        onRequest={
          requestPermission
        }
      />
    );
  }

  // ==========================================================
  // UPLOAD
  // ==========================================================

  const finalizeUpload =
    async (
      asset
    ) => {
      try {
        await uploadAsset(
          asset
        );

        showToast(
          'Souvenir ajouté ! Il apparaîtra sous peu dans la galerie.',
          'success'
        );

        router.back();
      } catch (error) {
        showToast(
          error?.message ||
            "Échec de l'envoi.",
          'error'
        );
      }
    };

  // ==========================================================
  // PHOTO
  // ==========================================================

  const takePhoto =
    async () => {
      if (
        !cameraRef.current ||
        isUploading ||
        isRecording
      ) {
        return;
      }

      try {
        const photo =
          await cameraRef.current.takePictureAsync(
            {
              quality: 0.85,
            }
          );

        if (!photo?.uri) {
          return;
        }

        await finalizeUpload(
          {
            uri: photo.uri,
            type: 'photo',
            width:
              photo.width,
            height:
              photo.height,
            fileName:
              `photo-${Date.now()}.jpg`,
          }
        );
      } catch (error) {
        showToast(
          error?.message ||
            'Impossible de capturer la photo.',
          'error'
        );
      }
    };

  // ==========================================================
  // VIDEO
  // ==========================================================

  const startVideo =
    async () => {
      if (
        !cameraRef.current ||
        isUploading ||
        isRecording
      ) {
        return;
      }

      try {
        if (
          !micPermission?.granted
        ) {
          const response =
            await requestMicPermission();

          if (
            !response.granted
          ) {
            showToast(
              'Autorisez le micro pour filmer une vidéo.',
              'warning'
            );

            return;
          }
        }

        setActiveMode(
          'video'
        );

        setIsRecording(
          true
        );

        const video =
          await cameraRef.current.recordAsync(
            {
              maxDuration: 30,
            }
          );

        if (video?.uri) {
          await finalizeUpload(
            {
              uri: video.uri,
              type: 'video',
              fileName:
                `video-${Date.now()}.mp4`,
            }
          );
        }
      } catch (error) {
        showToast(
          error?.message ||
            'Impossible de filmer la vidéo.',
          'error'
        );

        setIsRecording(
          false
        );
      }
    };

  const stopVideo =
    () => {
      setIsRecording(
        false
      );

      cameraRef.current?.stopRecording();
    };

  // ==========================================================
  // LIBRARY
  // ==========================================================

  const pickFromLibrary =
    async () => {
      if (
        isUploading ||
        isRecording
      ) {
        return;
      }

      try {
        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes:
                ImagePicker
                  .MediaTypeOptions
                  .All,
              allowsMultipleSelection:
                true,
              quality: 0.85,
            }
          );

        if (
          result.canceled
        ) {
          return;
        }

        const assets =
          result.assets ||
          [];

        if (!assets.length) {
          return;
        }

        for (
          const asset of assets
        ) {
          // eslint-disable-next-line no-await-in-loop
          await uploadAsset({
            uri: asset.uri,
            type:
              asset.type ===
              'video'
                ? 'video'
                : 'photo',
            width:
              asset.width,
            height:
              asset.height,
            duration:
              asset.duration,
            fileName:
              asset.fileName ||
              `import-${Date.now()}`,
          });
        }

        showToast(
          assets.length > 1
            ? `${assets.length} souvenirs ajoutés !`
            : 'Souvenir ajouté !',
          'success'
        );

        router.back();
      } catch (error) {
        showToast(
          error?.message ||
            "Échec de l'import.",
          'error'
        );
      }
    };

  // ==========================================================
  // SWITCH CAMERA
  // ==========================================================

  const switchCamera =
    () => {
      if (
        isRecording ||
        isUploading
      ) {
        return;
      }

      setFacing(
        (current) =>
          current === 'back'
            ? 'front'
            : 'back'
      );
    };

  // ==========================================================
  // SWITCH FLASH
  // ==========================================================

  const toggleFlash =
    () => {
      if (
        isRecording ||
        isUploading
      ) {
        return;
      }

      setFlash(
        (current) =>
          current === 'off'
            ? 'on'
            : 'off'
      );
    };

  // ==========================================================
  // CAMERA MODE
  // ==========================================================

  const cameraMode =
    isRecording
      ? 'video'
      : activeMode;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <View
      style={
        styles.container
      }
    >
      {/* ------------------------------------------------------
          CAMERA
      ------------------------------------------------------ */}

      <CameraView
        ref={cameraRef}
        style={
          StyleSheet.absoluteFillObject
        }
        facing={facing}
        flash={flash}
        mode={
          cameraMode ===
          'video'
            ? 'video'
            : 'picture'
        }
      />

      {/* ------------------------------------------------------
          TOP GRADIENT
      ------------------------------------------------------ */}

      <View
        pointerEvents="none"
        style={
          styles.topGradient
        }
      />

      {/* ------------------------------------------------------
          BOTTOM GRADIENT
      ------------------------------------------------------ */}

      <View
        pointerEvents="none"
        style={
          styles.bottomGradient
        }
      />

      {/* ------------------------------------------------------
          TOP BAR
      ------------------------------------------------------ */}

      <View
        style={
          styles.topBar
        }
      >
        <IconButton
          icon="close"
          variant="glass"
          color="white"
          onPress={() =>
            router.back()
          }
        />

        <View
          style={
            styles.liveLabel
          }
        >
          <View
            style={
              styles.liveLabelDot
            }
          />

          <Text
            style={
              styles.liveLabelText
            }
          >
            CAPTURE
          </Text>
        </View>

        <View
          style={
            styles.topControls
          }
        >
          <IconButton
            icon={
              flash === 'off'
                ? 'flash-off-outline'
                : 'flash-outline'
            }
            variant="glass"
            color="white"
            onPress={
              toggleFlash
            }
          />

          <IconButton
            icon="camera-reverse-outline"
            variant="glass"
            color="white"
            onPress={
              switchCamera
            }
          />
        </View>
      </View>

      {/* ------------------------------------------------------
          CENTER FRAMING
      ------------------------------------------------------ */}

      <View
        pointerEvents="none"
        style={
          styles.frameArea
        }
      >
        <View
          style={
            [
              styles.corner,
              styles.cornerTopLeft,
            ]
          }
        />

        <View
          style={
            [
              styles.corner,
              styles.cornerTopRight,
            ]
          }
        />

        <View
          style={
            [
              styles.corner,
              styles.cornerBottomLeft,
            ]
          }
        />

        <View
          style={
            [
              styles.corner,
              styles.cornerBottomRight,
            ]
          }
        />

        <View
          style={
            styles.frameCenter
          }
        >
          <View
            style={
              styles.frameCenterHorizontal
            }
          />

          <View
            style={
              styles.frameCenterVertical
            }
          />
        </View>
      </View>

      {/* ------------------------------------------------------
          RECORDING
      ------------------------------------------------------ */}

      {isRecording ? (
        <View
          style={
            styles.recordingPill
          }
        >
          <View
            style={
              styles.recordingDot
            }
          />

          <Text
            style={
              styles.recordingText
            }
          >
            ENREGISTREMENT
          </Text>

          <Text
            style={
              styles.recordingTime
            }
          >
            · 30 s max
          </Text>
        </View>
      ) : (
        <View
          style={
            styles.instructionPill
          }
        >
          <Ionicons
            name="sparkles-outline"
            size={13}
            color={
              theme.colors
                .champagneLight
            }
          />

          <Text
            style={
              styles.instructionText
            }
          >
            Faites vivre le moment
          </Text>
        </View>
      )}

      {/* ------------------------------------------------------
          UPLOAD
      ------------------------------------------------------ */}

      {isUploading ? (
        <View
          style={
            styles.uploadCard
          }
        >
          <View
            style={
              styles.uploadIcon
            }
          >
            <ActivityIndicator
              size="small"
              color={
                theme.colors
                  .champagne
              }
            />
          </View>

          <View
            style={
              styles.uploadCopy
            }
          >
            <Text
              style={
                styles.uploadTitle
              }
            >
              Publication en cours
            </Text>

            <Text
              style={
                styles.uploadSubtitle
              }
            >
              Votre souvenir arrive
              dans la galerie...
            </Text>
          </View>

          <Text
            style={
              styles.uploadPercent
            }
          >
            {Math.round(
              progress * 100
            )}
            %
          </Text>
        </View>
      ) : null}

      {/* ------------------------------------------------------
          BOTTOM CONTROLS
      ------------------------------------------------------ */}

      <View
        style={
          styles.bottomArea
        }
      >
        {/* Mode selector */}

        <View
          style={
            styles.modeSelector
          }
        >
          <Pressable
            onPress={() => {
              if (
                !isRecording &&
                !isUploading
              ) {
                setActiveMode(
                  'photo'
                );
              }
            }}
            style={[
              styles.modeOption,
              activeMode ===
                'photo' &&
                styles.modeOptionActive,
            ]}
          >
            <Ionicons
              name="camera-outline"
              size={15}
              color={
                activeMode ===
                'photo'
                  ? theme.colors
                      .white
                  : theme.colors
                      .white60
              }
            />

            <Text
              style={[
                styles.modeText,
                activeMode ===
                  'photo' &&
                  styles.modeTextActive,
              ]}
            >
              PHOTO
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (
                !isRecording &&
                !isUploading
              ) {
                setActiveMode(
                  'video'
                );
              }
            }}
            style={[
              styles.modeOption,
              activeMode ===
                'video' &&
                styles.modeOptionActive,
            ]}
          >
            <Ionicons
              name="videocam-outline"
              size={15}
              color={
                activeMode ===
                'video'
                  ? theme.colors
                      .white
                  : theme.colors
                      .white60
              }
            />

            <Text
              style={[
                styles.modeText,
                activeMode ===
                  'video' &&
                  styles.modeTextActive,
              ]}
            >
              VIDÉO
            </Text>
          </Pressable>
        </View>

        {/* Main controls */}

        <View
          style={
            styles.captureControls
          }
        >
          <Pressable
            onPress={
              pickFromLibrary
            }
            disabled={
              isRecording ||
              isUploading
            }
            style={({ pressed }) => [
              styles.galleryButton,
              pressed &&
                styles.controlPressed,
              (isRecording ||
                isUploading) &&
                styles.controlDisabled,
            ]}
          >
            <Ionicons
              name="images-outline"
              size={22}
              color={
                theme.colors.white
              }
            />
          </Pressable>

          {/* Shutter */}

          <Pressable
            onPress={() => {
              if (
                activeMode ===
                'photo'
              ) {
                takePhoto();
              } else if (
                !isRecording
              ) {
                startVideo();
              }
            }}
            onLongPress={() => {
              if (
                activeMode ===
                'photo'
              ) {
                startVideo();
              }
            }}
            onPressOut={() => {
              if (
                isRecording
              ) {
                stopVideo();
              }
            }}
            delayLongPress={
              350
            }
            disabled={
              isUploading
            }
            style={({ pressed }) => [
              styles.shutterOuter,
              activeMode ===
                'video' &&
                styles.shutterOuterVideo,
              isRecording &&
                styles.shutterOuterRecording,
              pressed &&
                styles.shutterPressed,
              isUploading &&
                styles.controlDisabled,
            ]}
          >
            <View
              style={[
                styles.shutterInner,
                activeMode ===
                  'video' &&
                  styles.shutterInnerVideo,
                isRecording &&
                  styles.shutterInnerRecording,
              ]}
            />
          </Pressable>

          <View
            style={
              styles.sideControlPlaceholder
            }
          />
        </View>

        {/* Hint */}

        <View
          style={
            styles.hintWrap
          }
        >
          <Text
            style={
              styles.hintText
            }
          >
            {isRecording
              ? 'Relâchez pour arrêter'
              : activeMode ===
                'video'
              ? 'Maintenez pour filmer'
              : 'Touchez pour capturer'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// PERMISSION SCREEN
// ============================================================

function PermissionScreen({
  onRequest,
}) {
  return (
    <View
      style={
        styles.permissionScreen
      }
    >
      <View
        style={
          styles.permissionGlow
        }
      />

      <View
        style={
          styles.permissionIcon
        }
      >
        <Ionicons
          name="camera-outline"
          size={38}
          color={
            theme.colors
              .champagne
          }
        />
      </View>

      <Text
        style={
          styles.permissionEyebrow
        }
      >
        EVERIA CAPTURE
      </Text>

      <Text
        style={
          styles.permissionTitle
        }
      >
        Capturez ce qui mérite
        de rester.
      </Text>

      <Text
        style={
          styles.permissionText
        }
      >
        Everia a besoin d'accéder à
        votre caméra pour vous permettre
        de partager les souvenirs de
        l'événement.
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.permissionButton,
          pressed &&
            styles.permissionButtonPressed,
        ]}
        onPress={onRequest}
      >
        <Text
          style={
            styles.permissionButtonText
          }
        >
          Autoriser la caméra
        </Text>

        <View
          style={
            styles.permissionButtonIcon
          }
        >
          <Ionicons
            name="arrow-forward"
            size={17}
            color={
              theme.colors
                .primaryDeep
            }
          />
        </View>
      </Pressable>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      theme.media.capture
        .backgroundColor,
  },

  // ----------------------------------------------------------
  // GRADIENTS
  // ----------------------------------------------------------

  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    backgroundColor:
      'rgba(0,0,0,0.34)',
  },

  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 310,
    backgroundColor:
      'rgba(0,0,0,0.58)',
  },

  // ----------------------------------------------------------
  // TOP
  // ----------------------------------------------------------

  topBar: {
    position: 'absolute',
    top: 48,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  topControls: {
    flexDirection: 'row',
    gap: 8,
  },

  liveLabel: {
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 11,
    backgroundColor:
      'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.11)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  liveLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.champagne,
  },

  liveLabelText: {
    fontFamily:
      theme.typography.families
        .bodyBold,
    fontSize: 7.5,
    letterSpacing: 1.2,
    color:
      theme.colors.white,
  },

  // ----------------------------------------------------------
  // FRAME
  // ----------------------------------------------------------

  frameArea: {
    position: 'absolute',
    top: '20%',
    left: '11%',
    right: '11%',
    bottom: '31%',
  },

  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor:
      'rgba(255,255,255,0.48)',
  },

  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 10,
  },

  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 10,
  },

  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 10,
  },

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 10,
  },

  frameCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  frameCenterHorizontal: {
    position: 'absolute',
    width: 22,
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.24)',
  },

  frameCenterVertical: {
    position: 'absolute',
    width: 1,
    height: 22,
    backgroundColor:
      'rgba(255,255,255,0.24)',
  },

  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  instructionPill: {
    position: 'absolute',
    top: '14%',
    alignSelf: 'center',
    height: 31,
    borderRadius: 999,
    paddingHorizontal: 11,
    backgroundColor:
      'rgba(0,0,0,0.32)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.09)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  instructionText: {
    fontFamily:
      theme.typography.families
        .bodyMedium,
    fontSize: 8.5,
    color:
      theme.colors.champagneLight,
  },

  recordingPill: {
    position: 'absolute',
    top: '14%',
    alignSelf: 'center',
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor:
      'rgba(184,92,104,0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.white,
  },

  recordingText: {
    fontFamily:
      theme.typography.families
        .bodyBold,
    fontSize: 7.5,
    letterSpacing: 1,
    color:
      theme.colors.white,
  },

  recordingTime: {
    fontFamily:
      theme.typography.families.body,
    fontSize: 8,
    color:
      'rgba(255,255,255,0.78)',
  },

  // ----------------------------------------------------------
  // UPLOAD
  // ----------------------------------------------------------

  uploadCard: {
    position: 'absolute',
    top: 105,
    left: theme.spacing.md,
    right: theme.spacing.md,
    minHeight: 65,
    borderRadius: 19,
    paddingHorizontal: 9,
    paddingVertical: 9,
    backgroundColor:
      'rgba(22,10,24,0.82)',
    borderWidth: 1,
    borderColor:
      'rgba(217,184,120,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  uploadIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor:
      'rgba(217,184,120,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  uploadCopy: {
    flex: 1,
    marginHorizontal: 9,
  },

  uploadTitle: {
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 10.5,
    color:
      theme.colors.white,
  },

  uploadSubtitle: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8,
    color:
      theme.colors.white60,
  },

  uploadPercent: {
    fontFamily:
      theme.typography.families
        .displaySemiBold,
    fontSize: 17,
    color:
      theme.colors.champagne,
  },

  // ----------------------------------------------------------
  // BOTTOM AREA
  // ----------------------------------------------------------

  bottomArea: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: 26,
    alignItems: 'center',
  },

  // ----------------------------------------------------------
  // MODE SELECTOR
  // ----------------------------------------------------------

  modeSelector: {
    height: 39,
    borderRadius: 999,
    padding: 3,
    backgroundColor:
      'rgba(0,0,0,0.44)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
    flexDirection: 'row',
  },

  modeOption: {
    minWidth: 83,
    height: 31,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 5,
  },

  modeOptionActive: {
    backgroundColor:
      'rgba(255,255,255,0.14)',
  },

  modeText: {
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 7.5,
    letterSpacing: 0.8,
    color:
      theme.colors.white60,
  },

  modeTextActive: {
    color:
      theme.colors.white,
  },

  // ----------------------------------------------------------
  // CAPTURE CONTROLS
  // ----------------------------------------------------------

  captureControls: {
    width: '100%',
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor:
      'rgba(0,0,0,0.40)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sideControlPlaceholder: {
    width: 48,
    height: 48,
  },

  shutterOuter: {
    width:
      theme.media.capture
        .shutterOuter,
    height:
      theme.media.capture
        .shutterOuter,
    borderRadius:
      theme.media.capture
        .shutterOuter / 2,
    borderWidth:
      theme.media.capture
        .shutterBorder,
    borderColor:
      theme.colors.white,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  shutterOuterVideo: {
    borderColor:
      theme.colors.white,
  },

  shutterOuterRecording: {
    borderColor:
      theme.colors.error,
  },

  shutterInner: {
    width:
      theme.media.capture
        .shutterInner,
    height:
      theme.media.capture
        .shutterInner,
    borderRadius:
      theme.media.capture
        .shutterInner / 2,
    backgroundColor:
      theme.colors.white,
  },

  shutterInnerVideo: {
    backgroundColor:
      theme.colors.error,
  },

  shutterInnerRecording: {
    width: 29,
    height: 29,
    borderRadius: 8,
    backgroundColor:
      theme.colors.error,
  },

  shutterPressed: {
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  controlPressed: {
    transform: [
      {
        scale: 0.93,
      },
    ],
  },

  controlDisabled: {
    opacity: 0.40,
  },

  // ----------------------------------------------------------
  // HINT
  // ----------------------------------------------------------

  hintWrap: {
    marginTop: 9,
    paddingHorizontal: 11,
    minHeight: 23,
    justifyContent:
      'center',
  },

  hintText: {
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 8.5,
    color:
      theme.colors.white60,
    textAlign: 'center',
  },

  // ----------------------------------------------------------
  // PERMISSION SCREEN
  // ----------------------------------------------------------

  permissionScreen: {
    flex: 1,
    backgroundColor:
      theme.colors.darkBackground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    overflow: 'hidden',
  },

  permissionGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor:
      'rgba(217,184,120,0.07)',
    top: '23%',
    alignSelf: 'center',
  },

  permissionIcon: {
    width: 84,
    height: 84,
    borderRadius: 29,
    backgroundColor:
      'rgba(217,184,120,0.09)',
    borderWidth: 1,
    borderColor:
      'rgba(217,184,120,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  permissionEyebrow: {
    marginTop: 21,
    fontFamily:
      theme.typography.families
        .bodyBold,
    fontSize: 8,
    letterSpacing: 2,
    color:
      theme.colors.champagne,
  },

  permissionTitle: {
    marginTop: 5,
    maxWidth: 310,
    textAlign: 'center',
    fontFamily:
      theme.typography.families
        .displaySemiBold,
    fontSize: 28,
    lineHeight: 34,
    color:
      theme.colors.white,
  },

  permissionText: {
    marginTop: 11,
    maxWidth: 320,
    textAlign: 'center',
    fontFamily:
      theme.typography.families.body,
    fontSize: 11.5,
    lineHeight: 18,
    color:
      theme.colors.white60,
  },

  permissionButton: {
    marginTop: 24,
    minHeight: 54,
    borderRadius: 18,
    paddingLeft: 18,
    paddingRight: 7,
    backgroundColor:
      theme.colors.champagne,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    minWidth: 230,
  },

  permissionButtonPressed: {
    opacity: 0.90,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  permissionButtonText: {
    fontFamily:
      theme.typography.families
        .bodySemiBold,
    fontSize: 12.5,
    color:
      theme.colors.primaryDeep,
  },

  permissionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});