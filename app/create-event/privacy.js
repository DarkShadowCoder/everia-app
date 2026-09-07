// app/create-event/privacy.js
// Étape 3/4 — Confidentialité & options
// Refonte UI : Access & Experience premium.
// Les valeurs du createEventStore et la navigation existante sont conservées.

import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import theme from '@/theme';
import Button from '@/components/ui/Button';
import { useCreateEventStore } from '@/store/createEventStore';

const VISIBILITY_OPTIONS = [
  {
    value: 'invite_only',
    icon: 'mail-outline',
    label: 'Sur invitation',
    shortLabel: 'Invitation',
    description:
      'Seules les personnes que vous invitez peuvent accéder à l’événement.',
    accent: 'gold',
  },
  {
    value: 'code_only',
    icon: 'key-outline',
    label: 'Par code',
    shortLabel: 'Code',
    description:
      'Toute personne disposant du code ou du QR code peut rejoindre.',
    accent: 'plum',
  },
  {
    value: 'public',
    icon: 'globe-outline',
    label: 'Public',
    shortLabel: 'Public',
    description:
      'L’événement peut être découvert et rejoint librement.',
    accent: 'green',
  },
  {
    value: 'private',
    icon: 'lock-closed-outline',
    label: 'Privé',
    shortLabel: 'Privé',
    description:
      'L’accès reste strictement limité aux personnes autorisées.',
    accent: 'rose',
  },
];

const EXPERIENCE_OPTIONS = [
  {
    key: 'allowGuestAccess',
    icon: 'person-add-outline',
    label: 'Accès invité sans compte',
    description:
      'Vos invités peuvent participer sans créer de compte Everia.',
  },
  {
    key: 'requireApproval',
    icon: 'shield-checkmark-outline',
    label: 'Modération avant publication',
    description:
      'Les photos et vidéos doivent être validées avant d’être visibles.',
  },
  {
    key: 'allowChallenges',
    icon: 'trophy-outline',
    label: 'Défis photo & vidéo',
    description:
      'Proposez des défis pour encourager les participants à capturer le moment.',
  },
  {
    key: 'liveWallEnabled',
    icon: 'tv-outline',
    label: 'Live Wall',
    description:
      'Affichez les souvenirs en temps réel sur un grand écran.',
  },
];

export default function CreateEventStep3() {
  const { draft, setField } = useCreateEventStore();

  const visibility =
    draft.visibility || 'invite_only';

  const selectedVisibility = useMemo(
    () =>
      VISIBILITY_OPTIONS.find(
        (option) => option.value === visibility
      ) || VISIBILITY_OPTIONS[0],
    [visibility]
  );

  const enabledExperienceCount = [
    draft.allowGuestAccess ?? true,
    draft.requireApproval ?? false,
    draft.allowChallenges ?? true,
    draft.liveWallEnabled ?? true,
  ].filter(Boolean).length;

  const eventName =
    draft.name?.trim() || 'Votre événement';

  return (
    <LinearGradient
      colors={theme.gradients.darkLuxury}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar style="light" />

      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retourner en arrière"
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={theme.colors.white}
          />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>
            CRÉATION D’ÉVÉNEMENT
          </Text>

          <Text style={styles.headerStep}>
            Étape 3 sur 4
          </Text>
        </View>

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            03
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={styles.progressDone} />
        <View style={styles.progressDone} />
        <View style={styles.progressActive} />
        <View style={styles.progressRemaining} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBlock}>
          <View style={styles.heroIconShell}>
            <LinearGradient
              colors={theme.gradients.goldSoft}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroIcon}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={theme.colors.primaryDark}
              />
            </LinearGradient>
          </View>

          <Text style={styles.heroEyebrow}>
            ACCÈS & EXPÉRIENCE
          </Text>

          <Text style={styles.heroTitle}>
            Vous gardez le contrôle
            {'\n'}
            de votre événement.
          </Text>

          <Text style={styles.heroDescription}>
            Définissez qui peut rejoindre votre espace et choisissez
            les fonctionnalités que vous souhaitez offrir à vos invités.
          </Text>
        </View>

        <View style={styles.contextCard}>
          <View style={styles.contextIcon}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={theme.colors.champagneDark}
            />
          </View>

          <View style={styles.contextCopy}>
            <Text style={styles.contextEyebrow}>
              CONFIGURATION DE
            </Text>

            <Text
              style={styles.contextTitle}
              numberOfLines={1}
            >
              {eventName}
            </Text>
          </View>

          <View style={styles.contextStep}>
            <Text style={styles.contextStepText}>
              03 / 04
            </Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>
                01 — CONFIDENTIALITÉ
              </Text>

              <Text style={styles.sectionTitle}>
                Qui peut entrer ?
              </Text>

              <Text style={styles.sectionSubtitle}>
                Choisissez le niveau d’ouverture qui correspond à votre événement.
              </Text>
            </View>

            <View style={styles.selectionBadge}>
              <Ionicons
                name={selectedVisibility.icon}
                size={12}
                color={theme.colors.champagneDark}
              />

              <Text
                style={styles.selectionBadgeText}
                numberOfLines={1}
              >
                {selectedVisibility.shortLabel}
              </Text>
            </View>
          </View>

          <View style={styles.visibilityList}>
            {VISIBILITY_OPTIONS.map((option) => (
              <VisibilityCard
                key={option.value}
                option={option}
                selected={
                  visibility === option.value
                }
                onPress={() =>
                  setField(
                    'visibility',
                    option.value
                  )
                }
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionEyebrow}>
                02 — EXPÉRIENCE
              </Text>

              <Text style={styles.sectionTitle}>
                Quel type d’expérience ?
              </Text>

              <Text style={styles.sectionSubtitle}>
                Activez uniquement les fonctionnalités utiles à votre événement.
              </Text>
            </View>

            <View style={styles.optionsCount}>
              <Text style={styles.optionsCountValue}>
                {enabledExperienceCount}
              </Text>

              <Text style={styles.optionsCountLabel}>
                actives
              </Text>
            </View>
          </View>

          <View style={styles.experienceCard}>
            {EXPERIENCE_OPTIONS.map(
              (option, index) => {
                const value =
                  draft[option.key] ??
                  getDefaultExperienceValue(
                    option.key
                  );

                return (
                  <ExperienceRow
                    key={option.key}
                    option={option}
                    value={value}
                    last={
                      index ===
                      EXPERIENCE_OPTIONS.length - 1
                    }
                    onChange={(nextValue) =>
                      setField(
                        option.key,
                        nextValue
                      )
                    }
                  />
                );
              }
            )}
          </View>
        </View>

        <View style={styles.privacyPromise}>
          <View style={styles.promiseIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={17}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.promiseCopy}>
            <Text style={styles.promiseTitle}>
              Vos choix restent entre vos mains.
            </Text>

            <Text style={styles.promiseText}>
              Vous pourrez ajuster ces paramètres depuis votre espace
              organisateur après la création.
            </Text>
          </View>
        </View>

        <View style={styles.finalSummary}>
          <View style={styles.finalSummaryTop}>
            <View>
              <Text style={styles.finalSummaryEyebrow}>
                VOTRE CONFIGURATION
              </Text>

              <Text style={styles.finalSummaryTitle}>
                Tout est presque prêt.
              </Text>
            </View>

            <View style={styles.finalCheck}>
              <Ionicons
                name="checkmark"
                size={16}
                color={theme.colors.primaryDark}
              />
            </View>
          </View>

          <View style={styles.finalDivider} />

          <SummaryItem
            icon={selectedVisibility.icon}
            label="Accès"
            value={selectedVisibility.label}
          />

          <SummaryItem
            icon="people-outline"
            label="Participants"
            value={
              draft.allowGuestAccess
                ? 'Accès simplifié'
                : 'Compte Everia requis'
            }
          />

          <SummaryItem
            icon="sparkles-outline"
            label="Expérience"
            value={`${enabledExperienceCount}/4 fonctionnalités activées`}
            last
          />
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerProgress}>
          <View style={styles.footerProgressCopy}>
            <Text style={styles.footerEyebrow}>
              DERNIÈRE CONFIGURATION
            </Text>

            <Text style={styles.footerText}>
              Vérifiez vos choix avant la révision finale.
            </Text>
          </View>

          <View style={styles.footerDots}>
            <View style={styles.footerDotDoneLong} />
            <View style={styles.footerDotDoneLong} />
            <View style={styles.footerDotActiveLong} />
            <View style={styles.footerDot} />
          </View>
        </View>

        <Button
          title="Réviser mon événement"
          variant="gold"
          icon="arrow-forward"
          iconPosition="right"
          onPress={() =>
            router.push('/create-event/review')
          }
        />
      </View>
    </LinearGradient>
  );
}

function VisibilityCard({
  option,
  selected,
  onPress,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected,
      }}
      accessibilityLabel={`Confidentialité : ${option.label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.visibilityCard,
        selected &&
          styles.visibilityCardSelected,
        pressed && styles.visibilityPressed,
      ]}
    >
      <View
        style={[
          styles.visibilityIcon,
          selected &&
            styles.visibilityIconSelected,
        ]}
      >
        <Ionicons
          name={option.icon}
          size={19}
          color={
            selected
              ? theme.colors.primaryDark
              : theme.colors.textOnDark
          }
        />
      </View>

      <View style={styles.visibilityCopy}>
        <View style={styles.visibilityTitleRow}>
          <Text
            style={[
              styles.visibilityTitle,
              selected &&
                styles.visibilityTitleSelected,
            ]}
          >
            {option.label}
          </Text>

          {selected && (
            <View style={styles.activeChip}>
              <View style={styles.activeChipDot} />

              <Text style={styles.activeChipText}>
                ACTIF
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.visibilityDescription,
            selected &&
              styles.visibilityDescriptionSelected,
          ]}
        >
          {option.description}
        </Text>
      </View>

      <View
        style={[
          styles.visibilityCheck,
          selected &&
            styles.visibilityCheckSelected,
        ]}
      >
        {selected && (
          <Ionicons
            name="checkmark"
            size={12}
            color={theme.colors.primaryDark}
          />
        )}
      </View>
    </Pressable>
  );
}

function ExperienceRow({
  option,
  value,
  onChange,
  last,
}) {
  return (
    <View
      style={[
        styles.experienceRow,
        !last && styles.experienceRowBorder,
      ]}
    >
      <View
        style={[
          styles.experienceIcon,
          value && styles.experienceIconEnabled,
        ]}
      >
        <Ionicons
          name={option.icon}
          size={17}
          color={
            value
              ? theme.colors.primary
              : theme.colors.textMuted
          }
        />
      </View>

      <View style={styles.experienceCopy}>
        <Text style={styles.experienceLabel}>
          {option.label}
        </Text>

        <Text style={styles.experienceDescription}>
          {option.description}
        </Text>
      </View>

      <Switch
        value={Boolean(value)}
        onValueChange={onChange}
        trackColor={{
          false: 'rgba(255,255,255,0.13)',
          true: theme.colors.champagne,
        }}
        thumbColor={
          PlatformColorSafe()
        }
        ios_backgroundColor="rgba(255,255,255,0.13)"
      />
    </View>
  );
}

function SummaryItem({
  icon,
  label,
  value,
  last = false,
}) {
  return (
    <View
      style={[
        styles.summaryItem,
        !last && styles.summaryItemBorder,
      ]}
    >
      <View style={styles.summaryIcon}>
        <Ionicons
          name={icon}
          size={14}
          color={theme.colors.champagneDark}
        />
      </View>

      <View style={styles.summaryCopy}>
        <Text style={styles.summaryLabel}>
          {label}
        </Text>

        <Text
          style={styles.summaryValue}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function getDefaultExperienceValue(key) {
  switch (key) {
    case 'allowGuestAccess':
      return true;

    case 'requireApproval':
      return false;

    case 'allowChallenges':
      return true;

    case 'liveWallEnabled':
      return true;

    default:
      return false;
  }
}

function PlatformColorSafe() {
  // React Native utilise la couleur blanche par défaut pour le thumb.
  // Cette fonction permet de garder le rendu stable sans dépendance supplémentaire.
  return theme.colors.white;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  orbTop: {
    position: 'absolute',
    width: 275,
    height: 275,
    borderRadius: 138,
    top: -180,
    right: -85,
    backgroundColor:
      'rgba(217,184,120,0.09)',
  },

  orbBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: 60,
    left: -140,
    backgroundColor:
      'rgba(147,101,150,0.11)',
  },

  header: {
    height: 76,
    paddingHorizontal:
      theme.layout.screenHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.11)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },

  headerEyebrow: {
    color: theme.colors.champagne,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8.5,
    lineHeight: 12,
    letterSpacing: 1.05,
  },

  headerStep: {
    color: theme.colors.white,
    opacity: 0.56,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 1,
  },

  stepBadge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor:
      'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepBadgeText: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 11,
    letterSpacing: 0.7,
  },

  progressTrack: {
    height: 3,
    marginHorizontal:
      theme.layout.screenHorizontal,
    flexDirection: 'row',
    gap: 5,
  },

  progressDone: {
    flex: 1,
    borderRadius: 3,
    backgroundColor:
      theme.colors.champagne,
  },

  progressActive: {
    flex: 1,
    borderRadius: 3,
    backgroundColor:
      theme.colors.champagneLight,
  },

  progressRemaining: {
    flex: 1,
    borderRadius: 3,
    backgroundColor:
      'rgba(255,255,255,0.12)',
  },

  scrollContent: {
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingTop: theme.spacing.xxl,
    paddingBottom: 35,
  },

  heroBlock: {
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
    color: theme.colors.champagneLight,
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
    fontSize: 29,
    lineHeight: 36,
    letterSpacing: -0.25,
  },

  heroDescription: {
    color: theme.colors.white,
    opacity: 0.56,
    fontFamily:
      theme.typography.families.body,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: theme.spacing.md,
    maxWidth: 340,
  },

  contextCard: {
    minHeight: 62,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.cardLarge,
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.085)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },

  contextIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.champagnePale,
    marginRight: 10,
  },

  contextCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  contextEyebrow: {
    color: theme.colors.white,
    opacity: 0.37,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7,
    lineHeight: 10,
    letterSpacing: 0.7,
  },

  contextTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },

  contextStep: {
    minHeight: 27,
    paddingHorizontal: 8,
    borderRadius: theme.radius.pill,
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  contextStepText: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 7.5,
    letterSpacing: 0.5,
  },

  sectionBlock: {
    marginBottom: theme.spacing.xxl,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent:
      'space-between',
    marginBottom: theme.spacing.md,
  },

  sectionHeaderCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },

  sectionEyebrow: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 0.9,
  },

  sectionTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 21,
    lineHeight: 27,
    marginTop: 2,
  },

  sectionSubtitle: {
    color: theme.colors.white,
    opacity: 0.45,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    maxWidth: 315,
  },

  selectionBadge: {
    minHeight: 31,
    maxWidth: 105,
    paddingHorizontal: 8,
    borderRadius: theme.radius.pill,
    backgroundColor:
      theme.colors.champagnePale,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectionBadgeText: {
    flex: 1,
    color: theme.colors.champagneDark,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8,
    marginLeft: 4,
  },

  visibilityList: {
    gap: theme.spacing.sm,
  },

  visibilityCard: {
    minHeight: 83,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.cardLarge,
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.075)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  visibilityCardSelected: {
    backgroundColor:
      theme.colors.champagnePale,
    borderColor:
      theme.colors.champagne,
  },

  visibilityPressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.988,
      },
    ],
  },

  visibilityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor:
      'rgba(255,255,255,0.065)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  visibilityIconSelected: {
    backgroundColor:
      theme.colors.champagneSoft,
  },

  visibilityCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },

  visibilityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  visibilityTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 12.5,
    lineHeight: 17,
    flex: 1,
  },

  visibilityTitleSelected: {
    color: theme.colors.primaryDark,
  },

  activeChip: {
    minHeight: 20,
    paddingHorizontal: 6,
    borderRadius: theme.radius.pill,
    backgroundColor:
      'rgba(110,146,119,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },

  activeChipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor:
      theme.colors.success,
    marginRight: 4,
  },

  activeChipText: {
    color: theme.colors.successDark,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 6.5,
    letterSpacing: 0.55,
  },

  visibilityDescription: {
    color: theme.colors.white,
    opacity: 0.44,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 3,
  },

  visibilityDescriptionSelected: {
    color: theme.colors.primary,
    opacity: 0.68,
  },

  visibilityCheck: {
    width: 23,
    height: 23,
    borderRadius: 11.5,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },

  visibilityCheckSelected: {
    backgroundColor:
      theme.colors.champagne,
    borderColor:
      theme.colors.champagne,
  },

  optionsCount: {
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 6,
    borderRadius: 15,
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionsCountValue: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 15,
    lineHeight: 19,
  },

  optionsCountLabel: {
    color: theme.colors.white,
    opacity: 0.40,
    fontFamily:
      theme.typography.families.body,
    fontSize: 7,
    lineHeight: 10,
    marginTop: 1,
  },

  experienceCard: {
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    borderRadius:
      theme.radius.cardLarge,
    overflow: 'hidden',
  },

  experienceRow: {
    minHeight: 84,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  experienceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.07)',
  },

  experienceIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  experienceIconEnabled: {
    backgroundColor:
      theme.colors.primarySoft,
  },

  experienceCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  experienceLabel: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11.5,
    lineHeight: 16,
  },

  experienceDescription: {
    color: theme.colors.white,
    opacity: 0.40,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
  },

  privacyPromise: {
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.075)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },

  promiseIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    backgroundColor:
      theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  promiseCopy: {
    flex: 1,
  },

  promiseTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11.5,
    lineHeight: 16,
  },

  promiseText: {
    color: theme.colors.white,
    opacity: 0.40,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
  },

  finalSummary: {
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      theme.colors.champagnePale,
    borderWidth: 1,
    borderColor:
      'rgba(184,143,77,0.14)',
  },

  finalSummaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  finalSummaryEyebrow: {
    color: theme.colors.champagneDark,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.8,
  },

  finalSummaryTitle: {
    color: theme.colors.primaryDark,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 18,
    lineHeight: 23,
    marginTop: 1,
  },

  finalCheck: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.44)',
  },

  finalDivider: {
    height: 1,
    backgroundColor:
      'rgba(91,49,93,0.11)',
    marginVertical: theme.spacing.sm,
  },

  summaryItem: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(91,49,93,0.08)',
  },

  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.46)',
    marginRight: 8,
  },

  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },

  summaryLabel: {
    color: theme.colors.primary,
    opacity: 0.46,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7,
    lineHeight: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  summaryValue: {
    color: theme.colors.primaryDark,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 1,
  },

  bottomSpace: {
    height: 5,
  },

  footer: {
    paddingTop: 10,
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingBottom: 26,
    backgroundColor:
      'rgba(22,10,24,0.95)',
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.08)',
  },

  footerProgress: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 7,
  },

  footerProgressCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },

  footerEyebrow: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7,
    lineHeight: 10,
    letterSpacing: 0.8,
  },

  footerText: {
    color: theme.colors.white,
    opacity: 0.43,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8.5,
    lineHeight: 12,
    marginTop: 1,
  },

  footerDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  footerDotDoneLong: {
    width: 13,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      theme.colors.champagne,
  },

  footerDotActiveLong: {
    width: 13,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      theme.colors.champagneLight,
  },

  footerDot: {
    width: 6,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      'rgba(255,255,255,0.14)',
  },

  pressed: {
    opacity: 0.78,
  },
});