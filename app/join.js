
// app/join.js
// ------------------------------------------------------------
// Écran "Rejoindre un événement".
//
// Refonte UI : parcours d'accès premium, centré sur deux actions
// principales : scanner un QR code ou saisir le code manuellement.
//
// La logique métier, Anonymous Auth, le scanner QR et le flux
// eventStore restent inchangés.
// ------------------------------------------------------------

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import theme from '@/theme';
import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import {
  useAuthStore,
  selectIsGuest,
} from '@/store/authStore';
import { useEventStore } from '@/store/eventStore';
import { useUIStore } from '@/store/uiStore';

export default function JoinEvent() {
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] =
    useCameraPermissions();

  const {
    session,
    joinAsGuest,
  } = useAuthStore();

  const isGuest = useAuthStore(
    selectIsGuest
  );

  const joinByCode = useEventStore(
    (state) => state.joinByCode
  );

  const isLoading = useEventStore(
    (state) => state.isLoading
  );

  const showToast = useUIStore(
    (state) => state.showToast
  );

  const needsGuestName = !session;

  const handleJoin = async (eventCode) => {
    const normalizedCode =
      eventCode?.trim();

    try {
      if (!normalizedCode) {
        showToast(
          "Entrez le code de l'événement pour continuer.",
          'warning'
        );

        return;
      }

      if (needsGuestName) {
        if (!displayName.trim()) {
          showToast(
            'Indiquez votre prénom pour rejoindre en tant qu’invité.',
            'warning'
          );

          return;
        }

        const { error } =
          await joinAsGuest(
            displayName.trim()
          );

        if (error) {
          showToast(
            error,
            'error'
          );

          return;
        }
      }

      const event =
        await joinByCode(
          normalizedCode,
          displayName.trim() ||
            undefined
        );

      router.replace(
        `/event/${event.id}`
      );
    } catch (err) {
      showToast(
        err?.message ||
          "Impossible de rejoindre l'événement.",
        'error'
      );
    }
  };

  const handleScanStart = async () => {
    if (!permission?.granted) {
      const result =
        await requestPermission();

      if (!result.granted) {
        showToast(
          'Autorisez la caméra pour scanner un QR code.',
          'warning'
        );

        return;
      }
    }

    setScanning(true);
  };

  const onBarcodeScanned = ({
    data,
  }) => {
    setScanning(false);

    // Le QR code encode typiquement :
    // everia://join?code=EVR-XXXXXX
    const match = data.match(
      /([A-Z]{2,4}-?[A-Z0-9]{4,8})/i
    );

    const extracted = match
      ? match[1].toUpperCase()
      : data.toUpperCase();

    setCode(extracted);

    handleJoin(extracted);
  };

  if (scanning) {
    return (
      <QrScanner
        onClose={() =>
          setScanning(false)
        }
        onScanned={
          onBarcodeScanned
        }
      />
    );
  }

  return (
    <LinearGradient
      colors={
        theme.gradients.darkLuxury
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View
        style={styles.backgroundOrbTop}
      />

      <View
        style={styles.backgroundOrbBottom}
      />

      <Header
        title=""
        dark
        transparent
        onBack={() =>
          router.back()
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.scrollContent
        }
      >
        <View style={styles.heroBlock}>
          <View
            style={styles.heroIconShell}
          >
            <LinearGradient
              colors={
                theme.gradients.goldSoft
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroIcon}
            >
              <Ionicons
                name="people-outline"
                size={23}
                color={
                  theme.colors.primaryDark
                }
              />
            </LinearGradient>
          </View>

          <Text style={styles.heroEyebrow}>
            EVERIA · PARTICIPATION
          </Text>

          <Text style={styles.heroTitle}>
            Entrez dans
            {'\n'}
            le moment.
          </Text>

          <Text
            style={styles.heroDescription}
          >
            Rejoignez un événement en quelques
            secondes et commencez immédiatement
            à partager votre perspective.
          </Text>
        </View>

        <View style={styles.accessCard}>
          <View
            style={styles.accessHeader}
          >
            <View
              style={styles.accessHeaderCopy}
            >
              <Text
                style={styles.accessEyebrow}
              >
                ACCÈS RAPIDE
              </Text>

              <Text
                style={styles.accessTitle}
              >
                Scannez le QR code
              </Text>

              <Text
                style={styles.accessSubtitle}
              >
                La façon la plus simple de
                rejoindre l’événement.
              </Text>
            </View>

            <View
              style={styles.qrIconWrap}
            >
              <Ionicons
                name="qr-code-outline"
                size={22}
                color={
                  theme.colors.champagneLight
                }
              />
            </View>
          </View>

          <View
            style={styles.qrPreview}
          >
            <View
              style={
                styles.qrCornerTopLeft
              }
            />

            <View
              style={
                styles.qrCornerTopRight
              }
            />

            <View
              style={
                styles.qrCornerBottomLeft
              }
            />

            <View
              style={
                styles.qrCornerBottomRight
              }
            />

            <View style={styles.qrCenter}>
              <Ionicons
                name="scan-outline"
                size={30}
                color={
                  theme.colors.champagneLight
                }
              />
            </View>

            <View
              style={styles.scanLine}
            />
          </View>

          <Button
            title="Scanner le QR code"
            icon="scan-outline"
            variant="gold"
            onPress={
              handleScanStart
            }
          />
        </View>

        <View style={styles.orDivider}>
          <View style={styles.orLine} />

          <View style={styles.orPill}>
            <Text style={styles.orText}>
              OU
            </Text>
          </View>

          <View style={styles.orLine} />
        </View>

        <View style={styles.codeCard}>
          <View
            style={styles.cardHeaderRow}
          >
            <View style={styles.cardIcon}>
              <Ionicons
                name="key-outline"
                size={18}
                color={
                  theme.colors.primary
                }
              />
            </View>

            <View
              style={styles.cardHeaderCopy}
            >
              <Text
                style={styles.cardEyebrow}
              >
                CODE ÉVÉNEMENT
              </Text>

              <Text
                style={styles.cardTitle}
              >
                Entrez votre code manuellement
              </Text>
            </View>
          </View>

          <Input
            label="Code événement"
            value={code}
            onChangeText={(value) =>
              setCode(
                value.toUpperCase()
              )
            }
            placeholder="EVR-7F9K2"
            autoCapitalize="characters"
            dark
            icon="key-outline"
            style={
              styles.codeInput
            }
          />

          {needsGuestName && (
            <View
              style={styles.guestSection}
            >
              <View
                style={styles.guestIntro}
              >
                <View
                  style={
                    styles.guestIcon
                  }
                >
                  <Ionicons
                    name="person-outline"
                    size={15}
                    color={
                      theme.colors
                        .champagneLight
                    }
                  />
                </View>

                <View
                  style={
                    styles.guestIntroCopy
                  }
                >
                  <Text
                    style={
                      styles.guestEyebrow
                    }
                  >
                    PARTICIPATION INVITÉ
                  </Text>

                  <Text
                    style={
                      styles.guestTitle
                    }
                  >
                    Comment souhaitez-vous
                    apparaître ?
                  </Text>
                </View>
              </View>

              <Input
                label="Votre prénom"
                value={displayName}
                onChangeText={
                  setDisplayName
                }
                placeholder="Ex. Sarah"
                dark
                icon="person-outline"
                style={
                  styles.guestInput
                }
              />

              <Text
                style={styles.guestHint}
              >
                Votre prénom sera visible par les
                autres participants dans l’espace
                de l’événement.
              </Text>
            </View>
          )}

          <Button
            title="Rejoindre l’événement"
            icon="arrow-forward"
            iconPosition="right"
            onPress={() =>
              handleJoin(code)
            }
            loading={isLoading}
            disabled={!code.trim()}
            variant="primaryDark"
          />
        </View>

        <View style={styles.trustCard}>
          <View style={styles.trustIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={
                theme.colors.champagneDark
              }
            />
          </View>

          <View style={styles.trustCopy}>
            <Text style={styles.trustTitle}>
              Une expérience sans friction
            </Text>

            <Text style={styles.trustText}>
              {isGuest
                ? 'Vous participez actuellement en tant qu’invité. Aucun compte supplémentaire n’est nécessaire.'
                : 'Vous pouvez participer à un événement sans créer de compte supplémentaire.'}
            </Text>
          </View>
        </View>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsEyebrow}>
            COMMENT ÇA MARCHE
          </Text>

          <Text style={styles.stepsTitle}>
            Trois secondes pour commencer.
          </Text>

          <JoinStep
            number="01"
            icon="qr-code-outline"
            title="Scannez ou saisissez le code"
            text="Utilisez le QR code de l’événement ou son identifiant."
          />

          <JoinStep
            number="02"
            icon="enter-outline"
            title="Entrez dans l’espace"
            text="Everia vous connecte immédiatement à l’événement."
          />

          <JoinStep
            number="03"
            icon="camera-outline"
            title="Partagez votre perspective"
            text="Capturez et vivez le moment avec tous les participants."
            last
          />
        </View>

        <Text
          style={styles.footerNote}
        >
          One Event. Many Perspectives. One Everia.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

function QrScanner({
  onClose,
  onScanned,
}) {
  return (
    <View style={styles.scannerScreen}>
      <CameraView
        style={
          StyleSheet.absoluteFillObject
        }
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={
          onScanned
        }
      />

      <LinearGradient
        colors={[
          'rgba(15,7,17,0.72)',
          'rgba(15,7,17,0.04)',
          'rgba(15,7,17,0.78)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={
          StyleSheet.absoluteFillObject
        }
        pointerEvents="none"
      />

      <View
        style={styles.scannerHeader}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer le scanner"
          onPress={onClose}
          style={({ pressed }) => [
            styles.scannerClose,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="close"
            size={22}
            color={theme.colors.white}
          />
        </Pressable>

        <View
          style={styles.scannerHeaderCopy}
        >
          <Text
            style={styles.scannerEyebrow}
          >
            EVERIA · SCANNER
          </Text>

          <Text
            style={styles.scannerTitle}
          >
            Rejoindre un événement
          </Text>
        </View>

        <View
          style={
            styles.scannerHeaderSpacer
          }
        />
      </View>

      <View
        style={styles.scannerCenter}
      >
        <View
          style={styles.scannerFrame}
        >
          <View
            style={
              styles.scannerCornerTopLeft
            }
          />

          <View
            style={
              styles.scannerCornerTopRight
            }
          />

          <View
            style={
              styles.scannerCornerBottomLeft
            }
          />

          <View
            style={
              styles.scannerCornerBottomRight
            }
          />

          <View
            style={styles.scannerLaser}
          />
        </View>

        <Text
          style={styles.scannerHintTitle}
        >
          Cadrez le QR code
        </Text>

        <Text
          style={styles.scannerHintText}
        >
          Positionnez le code dans le cadre
          pour rejoindre automatiquement
          l’événement.
        </Text>
      </View>

      <View
        style={styles.scannerBottom}
      >
        <View
          style={
            styles.scannerBottomBadge
          }
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={14}
            color={
              theme.colors
                .champagneLight
            }
          />

          <Text
            style={
              styles.scannerBottomText
            }
          >
            QR code Everia sécurisé
          </Text>
        </View>
      </View>
    </View>
  );
}

function JoinStep({
  number,
  icon,
  title,
  text,
  last = false,
}) {
  return (
    <View
      style={[
        styles.joinStep,
        !last &&
          styles.joinStepBorder,
      ]}
    >
      <View
        style={styles.stepNumberWrap}
      >
        <Text
          style={styles.stepNumber}
        >
          {number}
        </Text>
      </View>

      <View style={styles.stepIcon}>
        <Ionicons
          name={icon}
          size={16}
          color={
            theme.colors.champagneLight
          }
        />
      </View>

      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>
          {title}
        </Text>

        <Text style={styles.stepText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backgroundOrbTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -190,
    right: -90,
    backgroundColor:
      'rgba(217,184,120,0.10)',
  },

  backgroundOrbBottom: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    bottom: 70,
    left: -130,
    backgroundColor:
      'rgba(147,101,150,0.10)',
  },

  scrollContent: {
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingTop: theme.spacing.xs,
    paddingBottom: 100,
  },

  heroBlock: {
    paddingTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },

  heroIconShell: {
    width: 49,
    height: 49,
    borderRadius: 17,
    marginBottom: theme.spacing.md,
  },

  heroIcon: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroEyebrow: {
    color:
      theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 1,
    marginBottom: 4,
  },

  heroTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.25,
  },

  heroDescription: {
    color: theme.colors.white,
    opacity: 0.56,
    fontFamily:
      theme.typography.families.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: theme.spacing.md,
    maxWidth: 340,
  },

  accessCard: {
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.09)',
  },

  accessHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
    marginBottom: theme.spacing.md,
  },

  accessHeaderCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },

  accessEyebrow: {
    color:
      theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.8,
  },

  accessTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 20,
    lineHeight: 26,
    marginTop: 1,
  },

  accessSubtitle: {
    color: theme.colors.white,
    opacity: 0.43,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 3,
  },

  qrIconWrap: {
    width: 41,
    height: 41,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  qrPreview: {
    height: 130,
    borderRadius: 18,
    backgroundColor:
      'rgba(10,4,12,0.38)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },

  qrCenter: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(217,184,120,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scanLine: {
    position: 'absolute',
    left: 30,
    right: 30,
    top: 64,
    height: 1,
    backgroundColor:
      'rgba(217,184,120,0.44)',
  },

  qrCornerTopLeft: {
    position: 'absolute',
    width: 28,
    height: 28,
    top: 18,
    left: 22,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor:
      theme.colors.champagne,
    borderTopLeftRadius: 8,
  },

  qrCornerTopRight: {
    position: 'absolute',
    width: 28,
    height: 28,
    top: 18,
    right: 22,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor:
      theme.colors.champagne,
    borderTopRightRadius: 8,
  },

  qrCornerBottomLeft: {
    position: 'absolute',
    width: 28,
    height: 28,
    bottom: 18,
    left: 22,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor:
      theme.colors.champagne,
    borderBottomLeftRadius: 8,
  },

  qrCornerBottomRight: {
    position: 'absolute',
    width: 28,
    height: 28,
    bottom: 18,
    right: 22,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor:
      theme.colors.champagne,
    borderBottomRightRadius: 8,
  },

  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.10)',
  },

  orPill: {
    minWidth: 34,
    height: 26,
    paddingHorizontal: 7,
    marginHorizontal: 9,
    borderRadius: theme.radius.pill,
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  orText: {
    color: theme.colors.white,
    opacity: 0.45,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 7,
    letterSpacing: 0.8,
  },

  codeCard: {
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    ...theme.shadows.sm,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },

  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor:
      theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  cardHeaderCopy: {
    flex: 1,
  },

  cardEyebrow: {
    color: theme.colors.textGold,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.75,
  },

  cardTitle: {
    color: theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 16,
    lineHeight: 21,
    marginTop: 1,
  },

  codeInput: {
    marginBottom: theme.spacing.md,
  },

  guestSection: {
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor:
      theme.colors.borderLight,
  },

  guestIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  guestIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor:
      theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  guestIntroCopy: {
    flex: 1,
  },

  guestEyebrow: {
    color: theme.colors.textGold,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7,
    lineHeight: 10,
    letterSpacing: 0.65,
  },

  guestTitle: {
    color: theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 1,
  },

  guestInput: {
    marginBottom: 5,
  },

  guestHint: {
    color: theme.colors.textMuted,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8.5,
    lineHeight: 13,
    marginBottom: theme.spacing.sm,
  },

  trustCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      theme.colors.champagnePale,
    borderWidth: 1,
    borderColor:
      'rgba(184,143,77,0.13)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.44)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  trustCopy: {
    flex: 1,
  },

  trustTitle: {
    color: theme.colors.primaryDark,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11.5,
    lineHeight: 16,
  },

  trustText: {
    color: theme.colors.primary,
    opacity: 0.62,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
  },

  stepsCard: {
    marginTop: theme.spacing.xxl,
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.075)',
  },

  stepsEyebrow: {
    color:
      theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 0.85,
  },

  stepsTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 19,
    lineHeight: 24,
    marginTop: 2,
    marginBottom: theme.spacing.sm,
  },

  joinStep: {
    minHeight: 69,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },

  joinStepBorder: {
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.07)',
  },

  stepNumberWrap: {
    width: 31,
  },

  stepNumber: {
    color:
      theme.colors.champagneLight,
    opacity: 0.65,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 8,
    letterSpacing: 0.6,
  },

  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor:
      'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  stepCopy: {
    flex: 1,
  },

  stepTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 10.5,
    lineHeight: 15,
  },

  stepText: {
    color: theme.colors.white,
    opacity: 0.40,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8.5,
    lineHeight: 13,
    marginTop: 1,
  },

  footerNote: {
    color: theme.colors.white,
    opacity: 0.28,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8.5,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },

  scannerScreen: {
    flex: 1,
    backgroundColor: '#000',
  },

  scannerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 54,
    paddingHorizontal:
      theme.layout.screenHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
  },

  scannerClose: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor:
      'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scannerHeaderCopy: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },

  scannerEyebrow: {
    color:
      theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    letterSpacing: 0.8,
  },

  scannerTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 2,
  },

  scannerHeaderSpacer: {
    width: 42,
  },

  scannerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    transform: [
      {
        translateY: -150,
      },
    ],
    alignItems: 'center',
    paddingHorizontal:
      theme.layout.screenHorizontal,
  },

  scannerFrame: {
    width: 270,
    height: 270,
    borderRadius: 28,
    position: 'relative',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.18)',
  },

  scannerCornerTopLeft: {
    position: 'absolute',
    width: 44,
    height: 44,
    left: -2,
    top: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor:
      theme.colors.champagne,
    borderTopLeftRadius: 20,
  },

  scannerCornerTopRight: {
    position: 'absolute',
    width: 44,
    height: 44,
    right: -2,
    top: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor:
      theme.colors.champagne,
    borderTopRightRadius: 20,
  },

  scannerCornerBottomLeft: {
    position: 'absolute',
    width: 44,
    height: 44,
    left: -2,
    bottom: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor:
      theme.colors.champagne,
    borderBottomLeftRadius: 20,
  },

  scannerCornerBottomRight: {
    position: 'absolute',
    width: 44,
    height: 44,
    right: -2,
    bottom: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor:
      theme.colors.champagne,
    borderBottomRightRadius: 20,
  },

  scannerLaser: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '50%',
    height: 2,
    backgroundColor:
      theme.colors.champagne,
  },

  scannerHintTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 20,
    lineHeight: 26,
    marginTop: theme.spacing.xl,
  },

  scannerHintText: {
    color: theme.colors.white,
    opacity: 0.62,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: 'center',
    maxWidth: 310,
    marginTop: 5,
  },

  scannerBottom: {
    position: 'absolute',
    bottom: 42,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  scannerBottomBadge: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    backgroundColor:
      'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  scannerBottomText: {
    color: theme.colors.white,
    opacity: 0.68,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 8.5,
    marginLeft: 5,
  },

  pressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});
