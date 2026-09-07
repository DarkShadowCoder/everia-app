
// app/create-event/review.js
// Étape 4/4 — Révision & création
// Refonte UI : confirmation finale premium avant publication de l'événement.

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
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
import { useUIStore } from '@/store/uiStore';
import { supabase } from '@/lib/supabase';
import { formatEventDate } from '@/lib/format';

const VISIBILITY_LABELS = {
  invite_only: 'Sur invitation',
  code_only: 'Par code',
  public: 'Public',
  private: 'Privé',
};

export default function CreateEventReview() {
  const {
    draft,
    isSubmitting,
    setSubmitting,
    reset,
  } = useCreateEventStore();

  const showToast = useUIStore(
    (state) => state.showToast
  );

  const typeSpec = theme.helpers.getEventType(
    draft.category
  );

  const visibility =
    draft.visibility || 'invite_only';

  const allowGuestAccess =
    draft.allowGuestAccess ?? true;

  const requireApproval =
    draft.requireApproval ?? false;

  const allowChallenges =
    draft.allowChallenges ?? true;

  const liveWallEnabled =
    draft.liveWallEnabled ?? true;

  const handleCreate = async () => {
    if (isSubmitting) {
      return;
    }

    setSubmitting(true);

    try {
      const { data: event, error } =
        await supabase.rpc('create_event', {
          p_name: draft.name.trim(),
          p_category: draft.category,
          p_description:
            draft.description || null,
          p_start_at: draft.startAt,
          p_end_at: draft.endAt,
          p_timezone: draft.timezone,
          p_visibility: visibility,
        });

      if (error) {
        throw error;
      }

      // La RPC couvre les champs essentiels.
      // Les options avancées sont appliquées après la création.
      const { error: updateError } =
        await supabase
          .from('events')
          .update({
            venue_name:
              draft.venueName || null,
            allow_guest_access:
              allowGuestAccess,
            require_media_approval:
              requireApproval,
            allow_challenges:
              allowChallenges,
            live_wall_enabled:
              liveWallEnabled,
          })
          .eq('id', event.id);

      if (updateError) {
        throw updateError;
      }

      showToast(
        'Événement créé avec succès !',
        'success'
      );

      reset();

      router.replace(
        `/organizer/${event.id}/dashboard`
      );
    } catch (err) {
      showToast(
        err?.message ||
          "Impossible de créer l'événement.",
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            Étape 4 sur 4 · Révision finale
          </Text>
        </View>

        <View style={styles.headerBadge}>
          <Ionicons
            name="checkmark"
            size={17}
            color={theme.colors.champagneLight}
          />
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={styles.progressSegmentDone} />
        <View style={styles.progressSegmentDone} />
        <View style={styles.progressSegmentDone} />
        <View style={styles.progressSegmentActive} />
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
                name="sparkles-outline"
                size={23}
                color={theme.colors.primaryDark}
              />
            </LinearGradient>
          </View>

          <Text style={styles.heroEyebrow}>
            PRESQUE PRÊT
          </Text>

          <Text style={styles.heroTitle}>
            Votre moment est prêt
            {'\n'}
            à devenir un événement.
          </Text>

          <Text style={styles.heroDescription}>
            Vérifiez les informations ci-dessous. Une fois créé,
            Everia générera automatiquement votre code événement
            et votre QR code d’invitation.
          </Text>
        </View>

        <View style={styles.eventPreviewCard}>
          <View style={styles.previewCover}>
            <LinearGradient
              colors={theme.gradients.luxury}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.previewCoverOrb} />

            <View style={styles.previewTypeIcon}>
              <Ionicons
                name={typeSpec.icon}
                size={22}
                color={theme.colors.champagneLight}
              />
            </View>

            <View style={styles.previewTypeBadge}>
              <Text style={styles.previewTypeText}>
                {typeSpec.label}
              </Text>
            </View>
          </View>

          <View style={styles.previewBody}>
            <Text style={styles.previewEyebrow}>
              VOTRE ÉVÉNEMENT
            </Text>

            <Text
              style={styles.previewEventName}
              numberOfLines={3}
            >
              {draft.name?.trim() ||
                'Nom de votre événement'}
            </Text>

            <View style={styles.previewMetaStack}>
              <MetaRow
                icon="calendar-outline"
                label="Date"
                value={
                  draft.startAt
                    ? formatEventDate(
                        draft.startAt
                      )
                    : 'À définir'
                }
                muted={!draft.startAt}
              />

              <MetaRow
                icon="location-outline"
                label="Lieu"
                value={
                  draft.venueName?.trim() ||
                  'Lieu à définir'
                }
                muted={!draft.venueName?.trim()}
              />
            </View>
          </View>
        </View>

        <SectionTitle
          eyebrow="01 — INFORMATIONS"
          title="Les essentiels"
        />

        <View style={styles.infoCard}>
          <ReviewRow
            icon={typeSpec.icon}
            label="Type"
            value={typeSpec.label}
          />

          <ReviewRow
            icon="calendar-outline"
            label="Date & heure"
            value={
              draft.startAt
                ? formatEventDate(
                    draft.startAt
                  )
                : 'Non définie'
            }
            muted={!draft.startAt}
          />

          <ReviewRow
            icon="location-outline"
            label="Lieu"
            value={
              draft.venueName?.trim() ||
              'Non défini'
            }
            muted={!draft.venueName?.trim()}
          />

          <ReviewRow
            icon="create-outline"
            label="Description"
            value={
              draft.description?.trim()
                ? 'Présentation ajoutée'
                : 'Aucune description'
            }
            muted={!draft.description?.trim()}
            last
          />
        </View>

        <SectionTitle
          eyebrow="02 — CONFIDENTIALITÉ"
          title="Qui peut rejoindre ?"
        />

        <View style={styles.privacyCard}>
          <View style={styles.privacyIcon}>
            <Ionicons
              name={
                visibility === 'public'
                  ? 'globe-outline'
                  : visibility === 'code_only'
                    ? 'key-outline'
                    : visibility === 'private'
                      ? 'lock-closed-outline'
                      : 'mail-outline'
              }
              size={19}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.privacyCopy}>
            <Text style={styles.privacyLabel}>
              MODE D’ACCÈS
            </Text>

            <Text style={styles.privacyTitle}>
              {VISIBILITY_LABELS[visibility] ||
                visibility}
            </Text>

            <Text style={styles.privacyText}>
              {getVisibilityDescription(
                visibility
              )}
            </Text>
          </View>

          <Ionicons
            name="checkmark-circle"
            size={21}
            color={theme.colors.success}
          />
        </View>

        <SectionTitle
          eyebrow="03 — EXPÉRIENCE"
          title="Fonctionnalités activées"
        />

        <View style={styles.optionsCard}>
          <OptionRow
            icon="person-add-outline"
            label="Accès invité sans compte"
            description="Les invités peuvent participer sans créer de compte."
            enabled={allowGuestAccess}
          />

          <OptionRow
            icon="shield-checkmark-outline"
            label="Modération avant publication"
            description="Les médias sont validés avant d’apparaître."
            enabled={requireApproval}
          />

          <OptionRow
            icon="trophy-outline"
            label="Défis photo & vidéo"
            description="Les participants peuvent relever des défis."
            enabled={allowChallenges}
          />

          <OptionRow
            icon="tv-outline"
            label="Live Wall"
            description="Les médias peuvent être affichés en direct."
            enabled={liveWallEnabled}
            last
          />
        </View>

        <View style={styles.generationCard}>
          <View style={styles.generationIcon}>
            <Ionicons
              name="qr-code-outline"
              size={21}
              color={theme.colors.champagneDark}
            />
          </View>

          <View style={styles.generationCopy}>
            <Text style={styles.generationTitle}>
              Tout sera généré automatiquement
            </Text>

            <Text style={styles.generationText}>
              Votre code événement, votre QR code et votre espace
              organisateur seront créés dès la publication.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerCopy}>
          <View style={styles.readyBadge}>
            <View style={styles.readyDot} />

            <Text style={styles.readyText}>
              PRÊT À PUBLIER
            </Text>
          </View>

          <Text style={styles.footerTitle}>
            Une dernière étape.
          </Text>

          <Text style={styles.footerSubtitle}>
            Votre événement sera immédiatement disponible.
          </Text>
        </View>

        <Button
          title="Créer l’événement"
          variant="gold"
          icon="sparkles-outline"
          iconPosition="left"
          loading={isSubmitting}
          onPress={handleCreate}
        />
      </View>
    </LinearGradient>
  );
}

function SectionTitle({
  eyebrow,
  title,
}) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionEyebrow}>
        {eyebrow}
      </Text>

      <Text style={styles.sectionTitle}>
        {title}
      </Text>
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
  muted = false,
}) {
  return (
    <View style={styles.metaRow}>
      <View style={styles.metaIcon}>
        <Ionicons
          name={icon}
          size={13}
          color={theme.colors.champagneDark}
        />
      </View>

      <View style={styles.metaCopy}>
        <Text style={styles.metaLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.metaValue,
            muted && styles.metaValueMuted,
          ]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function ReviewRow({
  icon,
  label,
  value,
  muted = false,
  last = false,
}) {
  return (
    <View
      style={[
        styles.reviewRow,
        !last && styles.reviewRowBorder,
      ]}
    >
      <View style={styles.reviewIcon}>
        <Ionicons
          name={icon}
          size={15}
          color={theme.colors.champagneLight}
        />
      </View>

      <Text style={styles.reviewLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.reviewValue,
          muted && styles.reviewValueMuted,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function OptionRow({
  icon,
  label,
  description,
  enabled,
  last = false,
}) {
  return (
    <View
      style={[
        styles.optionRow,
        !last && styles.optionRowBorder,
      ]}
    >
      <View
        style={[
          styles.optionIcon,
          enabled && styles.optionIconEnabled,
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={
            enabled
              ? theme.colors.primary
              : theme.colors.textMuted
          }
        />
      </View>

      <View style={styles.optionCopy}>
        <Text style={styles.optionLabel}>
          {label}
        </Text>

        <Text style={styles.optionDescription}>
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.optionStatus,
          enabled &&
            styles.optionStatusEnabled,
        ]}
      >
        <Ionicons
          name={
            enabled
              ? 'checkmark'
              : 'remove'
          }
          size={12}
          color={
            enabled
              ? theme.colors.success
              : theme.colors.textMuted
          }
        />
      </View>
    </View>
  );
}

function getVisibilityDescription(
  visibility
) {
  switch (visibility) {
    case 'public':
      return 'Tout le monde peut découvrir et rejoindre cet événement.';

    case 'code_only':
      return 'Les personnes disposant du code ou du QR code peuvent rejoindre.';

    case 'private':
      return 'L’accès reste limité à l’organisateur et aux personnes ajoutées.';

    case 'invite_only':
    default:
      return 'Seules les personnes invitées peuvent accéder à l’événement.';
  }
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
    right: -90,
    backgroundColor:
      'rgba(217,184,120,0.10)',
  },

  orbBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: 60,
    left: -140,
    backgroundColor:
      'rgba(147,101,150,0.10)',
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

  headerBadge: {
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

  progressTrack: {
    height: 3,
    marginHorizontal:
      theme.layout.screenHorizontal,
    flexDirection: 'row',
    gap: 5,
  },

  progressSegmentDone: {
    flex: 1,
    borderRadius: 3,
    backgroundColor:
      theme.colors.champagne,
  },

  progressSegmentActive: {
    flex: 1,
    borderRadius: 3,
    backgroundColor:
      theme.colors.champagneLight,
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
    maxWidth: 345,
  },

  eventPreviewCard: {
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      theme.colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
    marginBottom: theme.spacing.xxl,
    ...theme.shadows.md,
  },

  previewCover: {
    height: 148,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor:
      theme.colors.primaryDark,
  },

  previewCoverOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -105,
    right: -60,
    backgroundColor:
      'rgba(217,184,120,0.13)',
  },

  previewTypeIcon: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(24,10,27,0.42)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.12)',
  },

  previewTypeBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.champagne,
  },

  previewTypeText: {
    color: theme.colors.primaryDark,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 7.5,
    letterSpacing: 0.65,
    textTransform: 'uppercase',
  },

  previewBody: {
    padding: theme.spacing.lg,
  },

  previewEyebrow: {
    color: theme.colors.textGold,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.85,
  },

  previewEventName: {
    color: theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 23,
    lineHeight: 29,
    marginTop: 3,
  },

  previewMetaStack: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor:
      theme.colors.borderLight,
    gap: theme.spacing.sm,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor:
      theme.colors.champagnePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  metaCopy: {
    flex: 1,
  },

  metaLabel: {
    color: theme.colors.textMuted,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7,
    lineHeight: 10,
    letterSpacing: 0.65,
    textTransform: 'uppercase',
  },

  metaValue: {
    color: theme.colors.textPrimary,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 1,
  },

  metaValueMuted: {
    opacity: 0.48,
  },

  sectionTitleWrap: {
    marginBottom: theme.spacing.md,
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

  infoCard: {
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    borderRadius:
      theme.radius.cardLarge,
    overflow: 'hidden',
    marginBottom: theme.spacing.xxl,
  },

  reviewRow: {
    minHeight: 66,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  reviewRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.07)',
  },

  reviewIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor:
      'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  reviewLabel: {
    color: theme.colors.white,
    opacity: 0.47,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    width: 75,
  },

  reviewValue: {
    flex: 1,
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'right',
  },

  reviewValueMuted: {
    opacity: 0.38,
    fontFamily:
      theme.typography.families.body,
  },

  privacyCard: {
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      theme.colors.champagnePale,
    borderWidth: 1,
    borderColor:
      'rgba(184,143,77,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },

  privacyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor:
      'rgba(255,255,255,0.44)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  privacyCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  privacyLabel: {
    color: theme.colors.primary,
    opacity: 0.48,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7,
    lineHeight: 10,
    letterSpacing: 0.7,
  },

  privacyTitle: {
    color: theme.colors.primaryDark,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },

  privacyText: {
    color: theme.colors.primary,
    opacity: 0.65,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 2,
  },

  optionsCard: {
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    borderRadius:
      theme.radius.cardLarge,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
  },

  optionRow: {
    minHeight: 77,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.07)',
  },

  optionIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.045)',
    marginRight: 10,
  },

  optionIconEnabled: {
    backgroundColor:
      theme.colors.primarySoft,
  },

  optionCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 9,
  },

  optionLabel: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11.5,
    lineHeight: 16,
  },

  optionDescription: {
    color: theme.colors.white,
    opacity: 0.40,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
  },

  optionStatus: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.045)',
  },

  optionStatusEnabled: {
    backgroundColor:
      'rgba(110,146,119,0.13)',
  },

  generationCard: {
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
  },

  generationIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor:
      theme.colors.champagnePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  generationCopy: {
    flex: 1,
  },

  generationTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11.5,
    lineHeight: 16,
  },

  generationText: {
    color: theme.colors.white,
    opacity: 0.43,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.2,
    lineHeight: 14,
    marginTop: 2,
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

  footerCopy: {
    marginBottom: 8,
  },

  readyBadge: {
    alignSelf: 'flex-start',
    minHeight: 22,
    paddingHorizontal: 7,
    borderRadius: theme.radius.pill,
    backgroundColor:
      'rgba(110,146,119,0.12)',
    borderWidth: 1,
    borderColor:
      'rgba(110,146,119,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  readyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor:
      theme.colors.success,
    marginRight: 5,
  },

  readyText: {
    color: theme.colors.white,
    opacity: 0.68,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 6.8,
    letterSpacing: 0.75,
  },

  footerTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 4,
  },

  footerSubtitle: {
    color: theme.colors.white,
    opacity: 0.42,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 1,
  },

  pressed: {
    opacity: 0.78,
  },
});
