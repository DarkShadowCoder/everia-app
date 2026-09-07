// app/create-event/index.js
// Étape 1/4 — Nom + Type d'événement
// Refonte UI : parcours de création premium, plus immersif et plus éditorial.

import React from 'react';
import {
  KeyboardAvoidingView,
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
import { StatusBar } from 'expo-status-bar';

import theme from '@/theme';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useCreateEventStore } from '@/store/createEventStore';
import { EVENT_TYPE_OPTIONS } from '@/constants/config';

const TYPE_DESCRIPTIONS = {
  wedding: 'Célébrez une histoire à deux.',
  birthday: 'Un anniversaire, un nouveau chapitre.',
  corporate: 'Rassemblez votre équipe autrement.',
  graduation: 'Immortalisez une étape importante.',
  party: 'Créez un espace pour faire la fête.',
  travel: 'Gardez une trace de votre voyage.',
  family: 'Réunissez les moments qui comptent.',
  other: 'Un événement unique, à votre manière.',
};

export default function CreateEventStep1() {
  const { draft, setField } = useCreateEventStore();

  const selectedType = draft.category || 'wedding';
  const selectedSpec = theme.helpers.getEventType(selectedType);
  const canContinue = Boolean(draft.name?.trim());

  const handleSelectType = (type) => {
    setField('category', type);
  };

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }

    router.push('/create-event/details');
  };

  return (
    <LinearGradient
      colors={theme.gradients.darkLuxury}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar style="light" />

      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retourner en arrière"
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
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
              NOUVEL ÉVÉNEMENT
            </Text>

            <Text style={styles.headerStep}>
              Étape 1 sur 4
            </Text>
          </View>

          <View style={styles.headerCount}>
            <Text style={styles.headerCountText}>
              01
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
          <View style={styles.progressRemaining} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroBlock}>
            <View style={styles.heroIconWrap}>
              <LinearGradient
                colors={theme.gradients.goldSoft}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroIcon}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={21}
                  color={theme.colors.primaryDark}
                />
              </LinearGradient>
            </View>

            <Text style={styles.heroTitle}>
              Commençons par
              {'\n'}
              donner une identité à votre moment.
            </Text>

            <Text style={styles.heroDescription}>
              Son nom et son univers seront au cœur de l’expérience
              Everia pour vous et vos invités.
            </Text>
          </View>

          <View style={styles.nameCard}>
            <View style={styles.cardEyebrowRow}>
              <Text style={styles.cardEyebrow}>
                IDENTITÉ
              </Text>

              <View style={styles.requiredBadge}>
                <View style={styles.requiredDot} />

                <Text style={styles.requiredText}>
                  REQUIS
                </Text>
              </View>
            </View>

            <Input
              label="Comment s'appelle votre événement ?"
              value={draft.name ?? ''}
              onChangeText={(value) =>
                setField('name', value)
              }
              placeholder="Mariage de Anaïs & Thomas"
              dark
              icon="text-outline"
              autoCapitalize="sentences"
              returnKeyType="next"
              style={styles.nameInput}
              inputStyle={styles.nameInputText}
            />

            <View style={styles.nameHint}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={theme.colors.champagneLight}
              />

              <Text style={styles.nameHintText}>
                Choisissez un nom simple à reconnaître et agréable à partager.
              </Text>
            </View>
          </View>

          <View style={styles.typeSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionEyebrow}>
                  UNIVERS DE L’ÉVÉNEMENT
                </Text>

                <Text style={styles.sectionTitle}>
                  Quel est le contexte ?
                </Text>
              </View>

              <View style={styles.selectedPill}>
                <Ionicons
                  name={selectedSpec.icon}
                  size={12}
                  color={theme.colors.champagneDark}
                />

                <Text
                  style={styles.selectedPillText}
                  numberOfLines={1}
                >
                  {selectedSpec.label}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionSubtitle}>
              Ce choix adapte légèrement l’expérience et les codes visuels de votre événement.
            </Text>

            <View style={styles.typeGrid}>
              {EVENT_TYPE_OPTIONS.map((type) => {
                const spec =
                  theme.helpers.getEventType(type);

                const selected =
                  selectedType === type;

                return (
                  <TypeCard
                    key={type}
                    spec={spec}
                    description={
                      TYPE_DESCRIPTIONS[type]
                    }
                    selected={selected}
                    onPress={() =>
                      handleSelectType(type)
                    }
                  />
                );
              })}
            </View>
          </View>

          <View style={styles.selectionSummary}>
            <View style={styles.selectionIcon}>
              <Ionicons
                name={selectedSpec.icon}
                size={17}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.selectionCopy}>
              <Text style={styles.selectionEyebrow}>
                VOTRE CHOIX
              </Text>

              <Text style={styles.selectionTitle}>
                {selectedSpec.label}
              </Text>

              <Text style={styles.selectionDescription}>
                {TYPE_DESCRIPTIONS[selectedType]}
              </Text>
            </View>

            <Ionicons
              name="checkmark-circle"
              size={21}
              color={theme.colors.success}
            />
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerHint}>
            <View
              style={[
                styles.footerStatusDot,
                canContinue &&
                  styles.footerStatusDotReady,
              ]}
            />

            <Text style={styles.footerHintText}>
              {canContinue
                ? 'Votre événement est prêt pour l’étape suivante.'
                : 'Ajoutez un nom pour continuer.'}
            </Text>
          </View>

          <Button
            title="Continuer"
            variant="gold"
            icon="arrow-forward"
            iconPosition="right"
            disabled={!canContinue}
            onPress={handleContinue}
          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function TypeCard({
  spec,
  description,
  selected,
  onPress,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Type d’événement ${spec.label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.typeCard,
        selected && styles.typeCardSelected,
        pressed && styles.typeCardPressed,
      ]}
    >
      <View
        style={[
          styles.typeIcon,
          selected && styles.typeIconSelected,
        ]}
      >
        <Ionicons
          name={spec.icon}
          size={19}
          color={
            selected
              ? theme.colors.primaryDark
              : theme.colors.textOnDark
          }
        />
      </View>

      <View style={styles.typeCopy}>
        <Text
          style={[
            styles.typeLabel,
            selected && styles.typeLabelSelected,
          ]}
          numberOfLines={1}
        >
          {spec.label}
        </Text>

        <Text
          style={[
            styles.typeDescription,
            selected &&
              styles.typeDescriptionSelected,
          ]}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.typeIndicator,
          selected &&
            styles.typeIndicatorSelected,
        ]}
      >
        {selected && (
          <Ionicons
            name="checkmark"
            size={11}
            color={theme.colors.primaryDark}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  backgroundOrbTop: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    top: -180,
    right: -85,
    backgroundColor: 'rgba(217,184,120,0.09)',
  },

  backgroundOrbBottom: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    bottom: 60,
    left: -130,
    backgroundColor: 'rgba(147,101,150,0.10)',
  },

  header: {
    height: 76,
    paddingHorizontal:
      theme.layout.screenHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
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
    letterSpacing: 1.1,
  },

  headerStep: {
    color: theme.colors.white,
    opacity: 0.57,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },

  headerCount: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  headerCountText: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
  },

  progressTrack: {
    height: 3,
    marginHorizontal:
      theme.layout.screenHorizontal,
    flexDirection: 'row',
    gap: 5,
  },

  progressFill: {
    flex: 1,
    borderRadius: 3,
    backgroundColor:
      theme.colors.champagne,
  },

  progressRemaining: {
    flex: 3,
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

  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 17,
    padding: 1,
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
    opacity: 0.58,
    fontFamily:
      theme.typography.families.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: theme.spacing.md,
    maxWidth: 340,
  },

  nameCard: {
    padding: theme.spacing.md,
    borderRadius:
      theme.radius.cardLarge,
    backgroundColor:
      'rgba(255,255,255,0.065)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.10)',
    marginBottom: theme.spacing.xxl,
  },

  cardEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: theme.spacing.md,
  },

  cardEyebrow: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8.5,
    lineHeight: 12,
    letterSpacing: 1,
  },

  requiredBadge: {
    minHeight: 23,
    paddingHorizontal: 8,
    borderRadius: theme.radius.pill,
    backgroundColor:
      'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  requiredDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor:
      theme.colors.champagne,
    marginRight: 5,
  },

  requiredText: {
    color: theme.colors.white,
    opacity: 0.60,
    fontFamily:
      theme.typography.families.bodyBold,
    fontSize: 6.5,
    letterSpacing: 0.7,
  },

  nameInput: {
    marginBottom: 0,
  },

  nameInputText: {
    fontSize: 15,
    fontFamily:
      theme.typography.families.bodyMedium,
  },

  nameHint: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  nameHintText: {
    flex: 1,
    color: theme.colors.white,
    opacity: 0.48,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    marginLeft: 6,
  },

  typeSection: {
    marginBottom: theme.spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    fontSize: 8.5,
    lineHeight: 12,
    letterSpacing: 0.95,
  },

  sectionTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 2,
  },

  sectionSubtitle: {
    color: theme.colors.white,
    opacity: 0.48,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: 5,
    marginBottom: theme.spacing.lg,
  },

  selectedPill: {
    maxWidth: 112,
    minHeight: 31,
    paddingHorizontal: 8,
    borderRadius: theme.radius.pill,
    backgroundColor:
      theme.colors.champagnePale,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedPillText: {
    flex: 1,
    color:
      theme.colors.champagneDark,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 8,
    marginLeft: 4,
  },

  typeGrid: {
    gap: theme.spacing.sm,
  },

  typeCard: {
    minHeight: 74,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor:
      'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.075)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  typeCardSelected: {
    backgroundColor:
      theme.colors.champagnePale,
    borderColor:
      theme.colors.champagne,
  },

  typeCardPressed: {
    opacity: 0.80,
    transform: [
      {
        scale: 0.988,
      },
    ],
  },

  typeIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor:
      'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  typeIconSelected: {
    backgroundColor:
      theme.colors.champagneSoft,
  },

  typeCopy: {
    flex: 1,
    minWidth: 0,
  },

  typeLabel: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 12.5,
    lineHeight: 17,
  },

  typeLabelSelected: {
    color: theme.colors.primaryDark,
  },

  typeDescription: {
    color: theme.colors.white,
    opacity: 0.45,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 13,
    marginTop: 2,
    paddingRight: 4,
  },

  typeDescriptionSelected: {
    color: theme.colors.primary,
    opacity: 0.70,
  },

  typeIndicator: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.17)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  typeIndicatorSelected: {
    backgroundColor:
      theme.colors.champagne,
    borderColor:
      theme.colors.champagne,
  },

  selectionSummary: {
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

  selectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.primarySoft,
    marginRight: theme.spacing.md,
  },

  selectionCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: theme.spacing.sm,
  },

  selectionEyebrow: {
    color: theme.colors.champagneLight,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.8,
  },

  selectionTitle: {
    color: theme.colors.white,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },

  selectionDescription: {
    color: theme.colors.white,
    opacity: 0.44,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
  },

  bottomSpacer: {
    height: 6,
  },

  footer: {
    paddingTop: 10,
    paddingHorizontal:
      theme.layout.screenHorizontal,
    paddingBottom: 26,
    backgroundColor:
      'rgba(22,10,24,0.92)',
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.08)',
  },

  footerHint: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  footerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      theme.colors.error,
    marginRight: 5,
  },

  footerStatusDotReady: {
    backgroundColor:
      theme.colors.success,
  },

  footerHintText: {
    color: theme.colors.white,
    opacity: 0.46,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 13,
  },

  pressed: {
    opacity: 0.78,
  },
});