// app/subscription/index.js
// ============================================================
// EVERIA — CONTEXTUAL PAYWALL
// ============================================================
// Trois offres visibles par contexte, une promesse de résultat avant les
// quotas, et le serveur comme source de vérité au moment du paiement.
// ============================================================

import React, {
  useEffect,
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

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import * as Haptics from 'expo-haptics';

import {
  useStripe,
} from '@stripe/stripe-react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import theme from '@/theme';
import IconButton from '@/components/ui/IconButton';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useUIStore } from '@/store/uiStore';
import {
  createCheckoutSession,
  fetchBillingPlans,
  waitForPaymentConfirmation,
} from '@/lib/stripe';
import {
  APP_SCHEME,
} from '@/constants/config';
import {
  getCatalogPlans,
  isPaywallMode,
  mergePlanWithCatalog,
  PAYWALL_MODES,
} from '@/lib/productCatalog';
import {
  formatPrice,
} from '@/lib/format';

const PAYWALL_COPY = {
  [PAYWALL_MODES.EVENT]: {
    eyebrow: 'POUR UN ÉVÉNEMENT',
    title: 'Offrez plus qu’une galerie.',
    description: 'Chaque invité participe gratuitement. Vous choisissez l’histoire qu’il emportera avec lui.',
    proof: 'Paiement unique · Invités gratuits · Aucun frais par participant',
    emptyAction: 'Créer mon événement',
    footer: 'Besoin d’un accompagnement premium ? Signature inclut une expérience entièrement à votre image.',
  },
  [PAYWALL_MODES.PROFESSIONAL]: {
    eyebrow: 'POUR LES PROFESSIONNELS',
    title: 'Transformez chaque événement en offre signature.',
    description: 'Déployez une expérience mémoire premium, revendez-la à vos clients et gardez la main sur votre marque.',
    proof: 'Facturation mensuelle · Invités gratuits · Évolue avec votre activité',
    emptyAction: 'Comparer les offres Pro',
    footer: 'White-label, SSO et API sont disponibles avec une offre Enterprise sur mesure.',
  },
};

function firstValue(value) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function displayPrice(plan) {
  return formatPrice(
    plan.priceCents ??
      plan.price_cents ??
      0,
    plan.currency || 'EUR'
  );
}

function intervalLabel(plan) {
  const interval = plan.billingInterval || plan.billing_interval;

  if (interval === 'month') {
    return '/ mois';
  }

  if (interval === 'year') {
    return '/ an';
  }

  return 'paiement unique';
}

export default function Subscription() {
  const {
    eventId: rawEventId,
    mode: rawMode,
  } = useLocalSearchParams();

  const eventId = firstValue(rawEventId);
  const requestedMode = firstValue(rawMode);
  const [
    mode,
    setMode,
  ] = useState(
    isPaywallMode(requestedMode)
      ? requestedMode
      : PAYWALL_MODES.EVENT
  );

  const [
    selectedCode,
    setSelectedCode,
  ] = useState(null);

  const [
    processingCode,
    setProcessingCode,
  ] = useState(null);

  const {
    initPaymentSheet,
    presentPaymentSheet,
  } = useStripe();

  const showToast = useUIStore(
    (state) => state.showToast
  );

  const {
    data: serverPlans,
    isLoading,
    refresh,
  } = useSupabaseQuery(
    () => fetchBillingPlans(),
    []
  );

  useEffect(
    () => {
      if (
        isPaywallMode(requestedMode) &&
        requestedMode !== mode
      ) {
        setMode(requestedMode);
      }
    }, [
      requestedMode,
      mode,
    ]);

  const plans = useMemo(() => {
    const plansByCode = new Map(
      (serverPlans || []).map(
        (plan) => [
          plan.code,
          plan,
        ]
      )
    );

    return getCatalogPlans(mode).map(
      (catalogPlan) => {
        const serverPlan = plansByCode.get(
          catalogPlan.code
        );

        const displayedPlan = serverPlan
          ? mergePlanWithCatalog(serverPlan)
          : catalogPlan;

        return {
          ...displayedPlan,
          available: Boolean(serverPlan?.id),
          serverPlan,
        };
      }
    );
  }, [
    mode,
    serverPlans,
  ]);

  const selectedPlan = plans.find(
    (plan) => plan.code === selectedCode
  ) || null;

  useEffect(
    () => {
      const featuredPlan = plans.find(
        (plan) => plan.badge && plan.available
      );

      const firstAvailablePlan = plans.find(
        (plan) => plan.available
      );

      const nextSelection =
        featuredPlan ||
        firstAvailablePlan ||
        plans[0] ||
        null;

      if (
        nextSelection &&
        !plans.some(
          (plan) => plan.code === selectedCode
        )
      ) {
        setSelectedCode(nextSelection.code);
      }
    }, [
      plans,
      selectedCode,
    ]);

  const switchMode = (nextMode) => {
    if (nextMode === mode) {
      return;
    }

    Haptics.selectionAsync();
    setMode(nextMode);
    setSelectedCode(null);
  };

  const selectPlan = (plan) => {
    if (!plan.available) {
      showToast(
        'Cette offre sera disponible dès que la configuration de facturation aura été publiée.',
        'warning'
      );

      return;
    }

    Haptics.selectionAsync();
    setSelectedCode(plan.code);
  };

  const openCheckout = async () => {
    if (!selectedPlan) {
      return;
    }

    if (!selectedPlan.available) {
      showToast(
        'Cette offre n’est pas encore disponible au paiement.',
        'warning'
      );

      return;
    }

    if (
      mode === PAYWALL_MODES.EVENT &&
      !eventId
    ) {
      showToast(
        'Créez d’abord votre événement : nous appliquerons ensuite cette formule à la bonne expérience.',
        'info'
      );

      router.push('/create-event');
      return;
    }

    Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Medium
    );

    setProcessingCode(selectedPlan.code);

    try {
      const session = await createCheckoutSession({
        planCode: selectedPlan.code,
        eventId,
      });

      const {
        error: initError,
      } = await initPaymentSheet({
        merchantDisplayName: 'Everia',
        customerId: session.customerId,
        customerEphemeralKeySecret: session.ephemeralKey,
        paymentIntentClientSecret: session.clientSecret,
        returnURL: `${APP_SCHEME}://stripe-redirect`,
        style: 'alwaysDark',
        appearance: {
          colors: {
            primary: theme.colors.champagne,
            background: theme.colors.surfaceDark2,
            componentBackground: theme.colors.surfaceDark3,
          },
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      const {
        error: presentError,
      } = await presentPaymentSheet();

      if (presentError) {
        if (
          presentError.code !== 'Canceled'
        ) {
          showToast(
            presentError.message,
            'error'
          );
        }

        return;
      }

      showToast(
        'Confirmation sécurisée du paiement en cours…',
        'info'
      );

      const result =
        await waitForPaymentConfirmation(
          session.paymentIntentId
        );

      if (result.confirmed) {
        showToast(
          `Votre offre ${selectedPlan.name} est active.`,
          'success'
        );

        router.back();
      } else {
        showToast(
          'Le paiement a été reçu mais la confirmation prend plus de temps que prévu. Vérifiez votre espace dans quelques instants.',
          'warning'
        );
      }
    } catch (error) {
      showToast(
        error?.message ||
          'Le paiement n’a pas pu être initialisé.',
        'error'
      );
    } finally {
      setProcessingCode(null);
    }
  };

  const copy = PAYWALL_COPY[mode];
  const hasAvailablePlans = plans.some(
    (plan) => plan.available
  );

  return (
    <LinearGradient
      colors={theme.gradients.darkLuxury}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 1,
        y: 1,
      }}
      style={styles.screen}
    >
      <View
        pointerEvents="none"
        style={styles.topGlow}
      />

      <SafeAreaView
        style={styles.safeArea}
        edges={[
          'top',
          'bottom',
        ]}
      >
        <View style={styles.topBar}>
          <IconButton
            icon="close"
            variant="glass"
            color={theme.colors.white}
            onPress={() => router.back()}
          />

          <View style={styles.secureNotice}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={theme.colors.champagneLight}
            />

            <Text style={styles.secureNoticeText}>
              Paiement sécurisé
            </Text>
          </View>
        </View>

        {isLoading ? (
          <LoadingOverlay
            dark
            fullscreen
            label="Préparation des offres…"
          />
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.heroIcon}>
                <Ionicons
                  name={
                    mode === PAYWALL_MODES.EVENT
                      ? 'sparkles-outline'
                      : 'briefcase-outline'
                  }
                  size={27}
                  color={theme.colors.primaryDark}
                />
              </View>

              <Text style={styles.eyebrow}>
                {copy.eyebrow}
              </Text>

              <Text style={styles.title}>
                {copy.title}
              </Text>

              <Text style={styles.description}>
                {copy.description}
              </Text>

              <View
                accessibilityRole="tablist"
                accessibilityLabel="Type d’offre"
                style={styles.modeSwitch}
              >
                <ModeButton
                  active={mode === PAYWALL_MODES.EVENT}
                  label="Mon événement"
                  onPress={() =>
                    switchMode(PAYWALL_MODES.EVENT)
                  }
                />

                <ModeButton
                  active={mode === PAYWALL_MODES.PROFESSIONAL}
                  label="Mon activité"
                  onPress={() =>
                    switchMode(PAYWALL_MODES.PROFESSIONAL)
                  }
                />
              </View>

              <View style={styles.proofRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color={theme.colors.champagne}
                />

                <Text style={styles.proofText}>
                  {copy.proof}
                </Text>
              </View>

              <View style={styles.offerList}>
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.code}
                    plan={plan}
                    selected={
                      plan.code === selectedCode
                    }
                    onPress={() => selectPlan(plan)}
                  />
                ))}
              </View>

              <View style={styles.noteBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={17}
                  color={theme.colors.champagneLight}
                />

                <Text style={styles.noteText}>
                  {copy.footer}
                </Text>
              </View>

              {!hasAvailablePlans ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={refresh}
                  style={styles.retryButton}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={16}
                    color={theme.colors.champagneLight}
                  />

                  <Text style={styles.retryText}>
                    Actualiser les offres
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>

            <View style={styles.checkoutBar}>
              <View style={styles.checkoutCopy}>
                <Text style={styles.checkoutLabel}>
                  {selectedPlan?.name ||
                    'Choisissez une offre'}
                </Text>

                <Text style={styles.checkoutPrice}>
                  {selectedPlan
                    ? displayPrice(selectedPlan)
                    : '—'}

                  {selectedPlan ? (
                    <Text style={styles.checkoutInterval}>
                      {' '}
                      {intervalLabel(selectedPlan)}
                    </Text>
                  ) : null}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: !selectedPlan ||
                    !selectedPlan.available ||
                    processingCode === selectedPlan.code,
                }}
                disabled={!selectedPlan ||
                  !selectedPlan.available ||
                  processingCode === selectedPlan.code}
                onPress={openCheckout}
                style={({
                  pressed,
                }) => [
                  styles.checkoutButton,
                  pressed && styles.checkoutButtonPressed,
                  (!selectedPlan ||
                    !selectedPlan.available) &&
                    styles.checkoutButtonDisabled,
                ]}
              >
                <LinearGradient
                  colors={theme.gradients.gold}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 1,
                  }}
                  style={styles.checkoutButtonGradient}
                >
                  <Text style={styles.checkoutButtonText}>
                    {processingCode === selectedPlan?.code
                      ? 'Préparation…'
                      : mode === PAYWALL_MODES.EVENT && !eventId
                        ? copy.emptyAction
                        : 'Continuer'}
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color={theme.colors.primaryDark}
                  />
                </LinearGradient>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function ModeButton({
  active,
  label,
  onPress,
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{
        selected: active,
      }}
      onPress={onPress}
      style={[
        styles.modeButton,
        active && styles.modeButtonActive,
      ]}
    >
      <Text
        style={[
          styles.modeButtonText,
          active && styles.modeButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PlanCard({
  plan,
  selected,
  onPress,
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{
        checked: selected,
        disabled: !plan.available,
      }}
      onPress={onPress}
      style={({
        pressed,
      }) => [
        styles.planCard,
        selected && styles.planCardSelected,
        !plan.available && styles.planCardUnavailable,
        pressed && plan.available && styles.planCardPressed,
      ]}
    >
      {plan.badge ? (
        <View style={styles.planBadge}>
          <Ionicons
            name="sparkles"
            size={11}
            color={theme.colors.primaryDark}
          />

          <Text style={styles.planBadgeText}>
            {plan.badge}
          </Text>
        </View>
      ) : null}

      <View style={styles.planTopRow}>
        <View style={styles.planCopy}>
          <Text style={styles.planName}>
            {plan.name}
          </Text>

          <Text style={styles.planTagline}>
            {plan.tagline}
          </Text>
        </View>

        <View
          style={[
            styles.radio,
            selected && styles.radioSelected,
          ]}
        >
          {selected ? (
            <View style={styles.radioFill} />
          ) : null}
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.planPrice}>
          {displayPrice(plan)}
        </Text>

        <Text style={styles.planInterval}>
          {intervalLabel(plan)}
        </Text>
      </View>

      <Text style={styles.planOutcome}>
        {plan.outcome}
      </Text>

      <View style={styles.featureList}>
        {plan.included.map((feature) => (
          <View
            key={feature}
            style={styles.featureRow}
          >
            <Ionicons
              name="checkmark"
              size={15}
              color={theme.colors.champagne}
            />

            <Text style={styles.featureText}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {!plan.available ? (
        <Text style={styles.unavailableText}>
          Configuration de paiement en cours
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  topGlow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 360,
    height: 310,
    borderRadius: 180,
    backgroundColor: 'rgba(217,184,120,0.16)',
  },

  topBar: {
    minHeight: 54,
    paddingHorizontal: theme.layout.screenHorizontal,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  secureNotice: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  secureNoticeText: {
    color: theme.colors.white70,
    fontFamily: theme.typography.families.bodyMedium,
    fontSize: 10,
  },

  content: {
    paddingHorizontal: theme.layout.screenHorizontal,
    paddingTop: 12,
    paddingBottom: 146,
  },

  heroIcon: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 23,
    backgroundColor: theme.colors.champagne,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.gold,
  },

  eyebrow: {
    color: theme.colors.champagneLight,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textAlign: 'center',
    marginTop: 18,
  },

  title: {
    color: theme.colors.white,
    fontFamily: theme.typography.families.displaySemiBold,
    fontSize: 29,
    letterSpacing: -0.6,
    lineHeight: 35,
    textAlign: 'center',
    marginTop: 8,
  },

  description: {
    color: theme.colors.white70,
    fontFamily: theme.typography.families.body,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 345,
    alignSelf: 'center',
  },

  modeSwitch: {
    flexDirection: 'row',
    padding: 4,
    marginTop: 23,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  modeButton: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },

  modeButtonActive: {
    backgroundColor: theme.colors.champagne,
  },

  modeButtonText: {
    color: theme.colors.white60,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 11,
  },

  modeButtonTextActive: {
    color: theme.colors.primaryDark,
  },

  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
  },

  proofText: {
    color: theme.colors.white60,
    fontFamily: theme.typography.families.body,
    fontSize: 10.5,
    textAlign: 'center',
  },

  offerList: {
    gap: 14,
    marginTop: 25,
  },

  planCard: {
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(42,22,45,0.88)',
  },

  planCardSelected: {
    borderColor: theme.colors.champagne,
    backgroundColor: theme.colors.surfaceDark3,
    ...theme.shadows.gold,
  },

  planCardUnavailable: {
    opacity: 0.54,
  },

  planCardPressed: {
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  planBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.champagne,
    borderBottomLeftRadius: 14,
    paddingHorizontal: 10,
    height: 25,
  },

  planBadgeText: {
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.families.bodyBold,
    fontSize: 8,
    letterSpacing: 0.8,
  },

  planTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  planCopy: {
    flex: 1,
    paddingRight: 52,
  },

  planName: {
    color: theme.colors.white,
    fontFamily: theme.typography.families.displaySemiBold,
    fontSize: 19,
  },

  planTagline: {
    color: theme.colors.champagneLight,
    fontFamily: theme.typography.families.bodyMedium,
    fontSize: 11,
    marginTop: 3,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.36)',
  },

  radioSelected: {
    borderColor: theme.colors.champagne,
  },

  radioFill: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: theme.colors.champagne,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 16,
  },

  planPrice: {
    color: theme.colors.white,
    fontFamily: theme.typography.families.displaySemiBold,
    fontSize: 27,
    letterSpacing: -0.6,
  },

  planInterval: {
    color: theme.colors.white60,
    fontFamily: theme.typography.families.body,
    fontSize: 11,
  },

  planOutcome: {
    color: theme.colors.white70,
    fontFamily: theme.typography.families.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  featureList: {
    gap: 7,
    marginTop: 14,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  featureText: {
    flex: 1,
    color: theme.colors.white70,
    fontFamily: theme.typography.families.body,
    fontSize: 11,
    lineHeight: 16,
  },

  unavailableText: {
    color: theme.colors.champagneLight,
    fontFamily: theme.typography.families.bodyMedium,
    fontSize: 10,
    marginTop: 13,
  },

  noteBox: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(217,184,120,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(217,184,120,0.2)',
  },

  noteText: {
    flex: 1,
    color: theme.colors.white70,
    fontFamily: theme.typography.families.body,
    fontSize: 10.5,
    lineHeight: 16,
  },

  retryButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
    marginTop: 10,
  },

  retryText: {
    color: theme.colors.champagneLight,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 12,
  },

  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 92,
    paddingHorizontal: theme.layout.screenHorizontal,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(22,10,24,0.98)',
  },

  checkoutCopy: {
    flex: 1,
  },

  checkoutLabel: {
    color: theme.colors.white60,
    fontFamily: theme.typography.families.bodyMedium,
    fontSize: 10,
  },

  checkoutPrice: {
    color: theme.colors.white,
    fontFamily: theme.typography.families.displaySemiBold,
    fontSize: 20,
    marginTop: 2,
  },

  checkoutInterval: {
    color: theme.colors.white60,
    fontFamily: theme.typography.families.body,
    fontSize: 10,
  },

  checkoutButton: {
    overflow: 'hidden',
    borderRadius: 16,
  },

  checkoutButtonPressed: {
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  checkoutButtonDisabled: {
    opacity: 0.5,
  },

  checkoutButtonGradient: {
    minHeight: 52,
    minWidth: 141,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  checkoutButtonText: {
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.families.bodyBold,
    fontSize: 12,
  },
});
