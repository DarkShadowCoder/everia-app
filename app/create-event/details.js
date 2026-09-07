
// app/create-event/details.js
// Étape 2/4 — Date / lieu / description
// Refonte UI : "Event Setup" premium, immersive et éditoriale.

import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import theme from '@/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useCreateEventStore } from '@/store/createEventStore';
import { formatEventDate } from '@/lib/format';

export default function CreateEventStep2() {
  const { draft, setField } = useCreateEventStore();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [androidDate, setAndroidDate] = useState(() => {
    if (draft?.startAt) {
      const parsedDate = new Date(draft.startAt);

      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    return new Date();
  });

  const getCurrentDate = () => {
    if (draft?.startAt) {
      const parsedDate = new Date(draft.startAt);

      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    return new Date();
  };

  const handleOpenDatePicker = () => {
    const currentDate = getCurrentDate();

    if (Platform.OS === 'android') {
      setAndroidDate(currentDate);
    }

    setShowDatePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    if (event?.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (!selectedDate) {
      setShowDatePicker(false);
      return;
    }

    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setAndroidDate(selectedDate);
      setShowTimePicker(true);
      return;
    }

    setField('startAt', selectedDate.toISOString());
  };

  const handleTimeChange = (event, selectedTime) => {
    if (event?.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }

    if (!selectedTime) {
      setShowTimePicker(false);
      return;
    }

    const combinedDate = new Date(androidDate);

    combinedDate.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0,
    );

    setField(
      'startAt',
      combinedDate.toISOString(),
    );

    setShowTimePicker(false);
    setAndroidDate(combinedDate);
  };

  const pickerDate = getCurrentDate();

  const formattedStartDate = draft?.startAt
    ? formatEventDate(draft.startAt)
    : 'Choisir la date et l’heure';

  const selectedDateLabel = useMemo(() => {
    if (!draft?.startAt) {
      return 'Date à définir';
    }

    return formatEventDate(draft.startAt);
  }, [draft?.startAt]);

  const hasVenue = Boolean(
    draft?.venueName?.trim(),
  );

  const hasDescription = Boolean(
    draft?.description?.trim(),
  );

  return (
    <LinearGradient
      colors={theme.gradients.darkLuxury}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
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
            Étape 2 sur 4
          </Text>
        </View>

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            02
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={styles.progressDone} />
        <View style={styles.progressActive} />
        <View style={styles.progressRemaining} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                name="calendar-outline"
                size={22}
                color={theme.colors.primaryDark}
              />
            </LinearGradient>
          </View>

          <Text style={styles.heroTitle}>
            Donnons un lieu et
            {'\n'}
            un moment à votre histoire.
          </Text>

          <Text style={styles.heroDescription}>
            Ces informations permettront à vos invités
            de comprendre immédiatement quand et où
            se déroule votre événement.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader
            eyebrow="01 — QUAND"
            title="Date & heure"
            subtitle="Choisissez le point de départ de votre événement."
            icon="time-outline"
          />

          <Pressable
            style={({ pressed }) => [
              styles.dateField,
              draft?.startAt &&
                styles.dateFieldSelected,
              pressed && styles.pressed,
            ]}
            onPress={handleOpenDatePicker}
            accessibilityRole="button"
            accessibilityLabel="Sélectionner la date et l'heure de l'événement"
          >
            <View
              style={[
                styles.fieldIcon,
                draft?.startAt &&
                  styles.fieldIconSelected,
              ]}
            >
              <Ionicons
                name={
                  draft?.startAt
                    ? 'checkmark'
                    : 'calendar-outline'
                }
                size={18}
                color={
                  draft?.startAt
                    ? theme.colors.primaryDark
                    : theme.colors.champagneLight
                }
              />
            </View>

            <View style={styles.dateCopy}>
              <Text style={styles.fieldLabel}>
                {draft?.startAt
                  ? 'Votre date'
                  : 'Date & heure de début'}
              </Text>

              <Text
                style={[
                  styles.dateText,
                  !draft?.startAt &&
                    styles.datePlaceholder,
                ]}
                numberOfLines={2}
              >
                {formattedStartDate}
              </Text>
            </View>

            <View style={styles.fieldChevron}>
              <Ionicons
                name="chevron-forward"
                size={17}
                color={theme.colors.textMuted}
              />
            </View>
          </Pressable>

          {showDatePicker && (
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <View>
                  <Text style={styles.pickerEyebrow}>
                    SÉLECTION
                  </Text>

                  <Text style={styles.pickerTitle}>
                    Choisissez votre date
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fermer le sélecteur de date"
                  onPress={() =>
                    setShowDatePicker(false)
                  }
                  style={styles.closePicker}
                >
                  <Ionicons
                    name="close"
                    size={17}
                    color={theme.colors.textMuted}
                  />
                </Pressable>
              </View>

              <DateTimePicker
                value={
                  Platform.OS === 'android'
                    ? androidDate
                    : pickerDate
                }
                mode={
                  Platform.OS === 'ios'
                    ? 'datetime'
                    : 'date'
                }
                display={
                  Platform.OS === 'ios'
                    ? 'inline'
                    : 'default'
                }
                onChange={handleDateChange}
                themeVariant="dark"
              />
            </View>
          )}

          {showTimePicker &&
            Platform.OS === 'android' && (
              <View
                style={styles.androidTimeCard}
              >
                <View
                  style={styles.androidTimeHeader}
                >
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={
                      theme.colors.champagneLight
                    }
                  />

                  <Text
                    style={styles.androidTimeText}
                  >
                    Maintenant, choisissez l’heure.
                  </Text>
                </View>

                <DateTimePicker
                  value={androidDate}
                  mode="time"
                  display="default"
                  is24Hour
                  onChange={handleTimeChange}
                  themeVariant="dark"
                />
              </View>
            )}
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader
            eyebrow="02 — OÙ"
            title="Lieu"
            subtitle="Donnez à vos invités un repère simple et mémorable."
            icon="location-outline"
          />

          <Input
            label="Nom du lieu"
            value={draft?.venueName ?? ''}
            onChangeText={(value) =>
              setField(
                'venueName',
                value,
              )
            }
            placeholder="Château de Provence"
            dark
            icon="location-outline"
            style={styles.input}
          />

          <View style={styles.helperRow}>
            <View style={styles.helperIcon}>
              <Ionicons
                name={
                  hasVenue
                    ? 'checkmark'
                    : 'navigate-outline'
                }
                size={13}
                color={
                  hasVenue
                    ? theme.colors.success
                    : theme.colors.champagneLight
                }
              />
            </View>

            <Text style={styles.helperText}>
              {hasVenue
                ? 'Le lieu est enregistré dans votre événement.'
                : 'Le lieu peut être un nom de salle, de domaine ou de restaurant.'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader
            eyebrow="03 — L’INTENTION"
            title="Description"
            subtitle="Ajoutez quelques mots pour donner le ton."
            icon="create-outline"
          />

          <Input
            label="Présentation de l’événement"
            value={draft?.description ?? ''}
            onChangeText={(value) =>
              setField(
                'description',
                value,
              )
            }
            placeholder="Quelques mots pour présenter votre événement..."
            dark
            multiline
            numberOfLines={5}
            style={styles.descriptionInput}
          />

          <View style={styles.descriptionFooter}>
            <View
              style={styles.descriptionStatus}
            >
              <View
                style={[
                  styles.statusDot,
                  hasDescription &&
                    styles.statusDotDone,
                ]}
              />

              <Text
                style={
                  styles.descriptionStatusText
                }
              >
                {hasDescription
                  ? 'Description ajoutée'
                  : 'Optionnelle, mais recommandée'}
              </Text>
            </View>

            <Text style={styles.characterHint}>
              {draft?.description?.length || 0}{' '}
              caractères
            </Text>
          </View>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewTopRow}>
            <View>
              <Text style={styles.previewEyebrow}>
                APERÇU
              </Text>

              <Text style={styles.previewTitle}>
                Votre événement prend forme.
              </Text>
            </View>

            <View style={styles.previewIcon}>
              <Ionicons
                name="eye-outline"
                size={16}
                color={theme.colors.champagneDark}
              />
            </View>
          </View>

          <View style={styles.previewDivider} />

          <PreviewRow
            icon="calendar-outline"
            label="Date"
            value={selectedDateLabel}
            muted={!draft?.startAt}
          />

          <PreviewRow
            icon="location-outline"
            label="Lieu"
            value={
              draft?.venueName?.trim() ||
              'Lieu à définir'
            }
            muted={!hasVenue}
          />

          <PreviewRow
            icon="create-outline"
            label="Description"
            value={
              hasDescription
                ? 'Présentation ajoutée'
                : 'Aucune description pour le moment'
            }
            muted={!hasDescription}
            last
          />
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerProgress}>
          <View style={styles.footerProgressCopy}>
            <Text style={styles.footerEyebrow}>
              PROGRESSION
            </Text>

            <Text style={styles.footerText}>
              2 étapes sur 4 terminées
            </Text>
          </View>

          <View style={styles.footerStepDots}>
            <View
              style={styles.footerDotDone}
            />
            <View
              style={styles.footerDotActive}
            />
            <View style={styles.footerDot} />
            <View style={styles.footerDot} />
          </View>
        </View>

        <Button
          title="Continuer"
          variant="gold"
          icon="arrow-forward"
          iconPosition="right"
          onPress={() =>
            router.push(
              '/create-event/privacy',
            )
          }
        />
      </View>
    </LinearGradient>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  icon,
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderTop}>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.sectionEyebrow}>
            {eyebrow}
          </Text>

          <Text style={styles.sectionTitle}>
            {title}
          </Text>
        </View>

        <View style={styles.sectionIcon}>
          <Ionicons
            name={icon}
            size={17}
            color={theme.colors.champagneLight}
          />
        </View>
      </View>

      <Text style={styles.sectionSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

function PreviewRow({
  icon,
  label,
  value,
  muted = false,
  last = false,
}) {
  return (
    <View
      style={[
        styles.previewRow,
        !last && styles.previewRowBorder,
      ]}
    >
      <View style={styles.previewRowIcon}>
        <Ionicons
          name={icon}
          size={14}
          color={theme.colors.champagneDark}
        />
      </View>

      <View style={styles.previewRowCopy}>
        <Text style={styles.previewRowLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.previewRowValue,
            muted &&
              styles.previewRowValueMuted,
          ]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  orbTop: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    top: -175,
    right: -80,
    backgroundColor:
      'rgba(217,184,120,0.09)',
  },

  orbBottom: {
    position: 'absolute',
    width: 235,
    height: 235,
    borderRadius: 118,
    bottom: 70,
    left: -135,
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
    fontSize: 10,
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
    flex: 2,
    borderRadius: 3,
    backgroundColor:
      'rgba(255,255,255,0.12)',
  },

  scrollContent: {
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingTop: theme.spacing.xxl,
    paddingBottom: 30,
  },

  heroBlock: {
    marginBottom: theme.spacing.xxl,
  },

  heroIconShell: {
    width: 48,
    height: 48,
    borderRadius: 17,
    marginBottom: theme.spacing.md,
  },

  heroIcon: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    opacity: 0.57,
    fontFamily:
      theme.typography.families.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: theme.spacing.md,
    maxWidth: 340,
  },

  sectionCard: {
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.085)',
    marginBottom: theme.spacing.lg,
  },

  sectionHeader: {
    marginBottom: theme.spacing.md,
  },

  sectionHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
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
    lineHeight: 12,
    letterSpacing: 0.95,
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
    opacity: 0.46,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    maxWidth: 320,
  },

  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor:
      'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateField: {
    minHeight: 72,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor:
      theme.inputs.dark.backgroundColor,
    borderColor:
      theme.inputs.dark.borderColor,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateFieldSelected: {
    borderColor:
      theme.colors.primaryMuted,
    backgroundColor:
      'rgba(91,49,93,0.16)',
  },

  fieldIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.06)',
    marginRight: 10,
  },

  fieldIconSelected: {
    backgroundColor:
      theme.colors.champagnePale,
  },

  dateCopy: {
    flex: 1,
    minWidth: 0,
  },

  fieldLabel: {
    color: theme.colors.white,
    opacity: 0.44,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 8.5,
    lineHeight: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  dateText: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },

  datePlaceholder: {
    opacity: 0.63,
  },

  fieldChevron: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.045)',
  },

  pickerCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor:
      'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
  },

  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingBottom: theme.spacing.sm,
  },

  pickerEyebrow: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.8,
  },

  pickerTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },

  closePicker: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor:
      'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  androidTimeCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor:
      'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.07)',
    alignItems: 'center',
  },

  androidTimeHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  androidTimeText: {
    color: theme.colors.white,
    opacity: 0.62,
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 10,
    marginLeft: 6,
  },

  input: {
    marginBottom: 0,
  },

  descriptionInput: {
    marginBottom: 0,
  },

  helperRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  helperIcon: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor:
      'rgba(255,255,255,0.055)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  helperText: {
    flex: 1,
    color: theme.colors.white,
    opacity: 0.42,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    lineHeight: 13,
  },

  descriptionFooter: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  descriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.textMuted,
    marginRight: 5,
  },

  statusDotDone: {
    backgroundColor:
      theme.colors.success,
  },

  descriptionStatusText: {
    color: theme.colors.white,
    opacity: 0.43,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8.5,
  },

  characterHint: {
    color: theme.colors.white,
    opacity: 0.30,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8,
  },

  previewCard: {
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      theme.colors.champagnePale,
    borderWidth: 1,
    borderColor:
      'rgba(184,143,77,0.14)',
  },

  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  previewEyebrow: {
    color:
      theme.colors.champagneDark,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.8,
  },

  previewTitle: {
    color: theme.colors.primaryDark,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 17,
    lineHeight: 22,
    marginTop: 1,
  },

  previewIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor:
      'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewDivider: {
    height: 1,
    backgroundColor:
      'rgba(91,49,93,0.12)',
    marginVertical: theme.spacing.sm,
  },

  previewRow: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
  },

  previewRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(91,49,93,0.09)',
  },

  previewRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor:
      'rgba(255,255,255,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  previewRowCopy: {
    flex: 1,
    minWidth: 0,
  },

  previewRowLabel: {
    color: theme.colors.primary,
    opacity: 0.50,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.65,
    textTransform: 'uppercase',
  },

  previewRowValue: {
    color:
      theme.colors.primaryDark,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 1,
  },

  previewRowValueMuted: {
    opacity: 0.46,
    fontFamily:
      theme.typography.families.body,
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
      'rgba(22,10,24,0.94)',
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.08)',
  },

  footerProgress: {
    minHeight: 29,
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
    opacity: 0.45,
    fontFamily:
      theme.typography.families.body,
    fontSize: 8.5,
    lineHeight: 12,
    marginTop: 1,
  },

  footerStepDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  footerDotDone: {
    width: 16,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      theme.colors.champagne,
  },

  footerDotActive: {
    width: 16,
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
