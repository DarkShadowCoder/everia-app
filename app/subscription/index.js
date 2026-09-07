// app/subscription/index.js
// ------------------------------------------------------------
// Paywall premium Everia. Inspiré des meilleurs paywalls du marché
// (héros avec proposition de valeur forte, cartes de plans
// sélectionnables avec état actif marqué, barre d'action collante
// en bas, preuve sociale, micro-animations). Utilise le PaymentSheet
// natif Stripe. Conformément au principe du spec produit, l'UI
// attend la confirmation serveur (webhook) avant d'annoncer un
// succès — voir lib/stripe.waitForPaymentConfirmation.
// ------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useStripe } from '@stripe/stripe-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import IconButton from '@/components/ui/IconButton';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useUIStore } from '@/store/uiStore';
import { createCheckoutSession, fetchBillingPlans, waitForPaymentConfirmation } from '@/lib/stripe';
import { formatPrice } from '@/lib/format';

// Proposition de valeur générique Everia+, affichée au-dessus du choix de
// plan indépendamment des données serveur (marketing statique).
const HERO_BENEFITS = [
  { icon: 'cloud-upload-outline', label: 'Uploads photo & vidéo illimités' },
  { icon: 'sparkles-outline', label: 'Moments générés automatiquement par IA' },
  { icon: 'film-outline', label: 'Replay & Best Of en qualité HD prioritaire' },
  { icon: 'infinite-outline', label: "Événements illimités, à vie" },
];

const SOCIAL_PROOF = [
  { icon: 'people-outline', value: '12k+', label: 'Événements créés' },
  { icon: 'star', value: '4.9', label: 'Note moyenne' },
  { icon: 'shield-checkmark-outline', value: '100%', label: 'Paiement sécurisé' },
];

export default function Subscription() {
  const { eventId } = useLocalSearchParams();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const showToast = useUIStore((s) => s.showToast);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);

  const { data: allPlans, isLoading } = useSupabaseQuery(() => fetchBillingPlans(), []);

  // Le plan "free" ne se sélectionne pas sur un paywall — il reste
  // accessible via le lien discret en bas d'écran.
  const paidPlans = useMemo(() => (allPlans || []).filter((p) => p.code !== 'free'), [allPlans]);
  const freePlan = useMemo(() => (allPlans || []).find((p) => p.code === 'free'), [allPlans]);

  useEffect(() => {
    if (paidPlans.length && !selectedCode) {
      const featured = paidPlans.find((p) => p.code === 'everia_plus') || paidPlans[0];
      setSelectedCode(featured.code);
    }
  }, [paidPlans, selectedCode]);

  const selectedPlan = paidPlans.find((p) => p.code === selectedCode);

  // --- Animations d'entrée -------------------------------------------------
  const heroAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const badgePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(heroAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(listAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(ctaAnim, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(badgePulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const selectPlan = (code) => {
    Haptics.selectionAsync();
    setSelectedCode(code);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessingPlan(selectedPlan.code);
    try {
      const session = await createCheckoutSession({ planCode: selectedPlan.code, eventId });
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Everia',
        customerId: session.customerId,
        customerEphemeralKeySecret: session.ephemeralKey,
        paymentIntentClientSecret: session.clientSecret,
        style: 'alwaysDark',
        appearance: {
          colors: {
            primary: theme.colors.champagne,
            background: theme.colors.surfaceDark2,
            componentBackground: theme.colors.surfaceDark3,
          },
        },
      });
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') showToast(presentError.message, 'error');
        return;
      }

      showToast('Paiement en cours de confirmation...', 'info');
      const result = await waitForPaymentConfirmation(session.paymentIntentId);
      if (result.confirmed) {
        showToast(`Bienvenue dans ${selectedPlan.name} !`, 'success');
        router.back();
      } else {
        showToast("Le paiement n'a pas pu être confirmé. Vérifiez votre compte dans quelques instants.", 'warning');
      }
    } catch (err) {
      showToast(err.message || 'Une erreur est survenue.', 'error');
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <LinearGradient colors={theme.gradients.darkLuxury} style={{ flex: 1 }}>
      {/* Halo décoratif façon spotlight derrière le héros */}
      <View pointerEvents="none" style={styles.glowWrap}>
        <LinearGradient
          colors={['rgba(217,184,120,0.28)', 'rgba(217,184,120,0)']}
          style={styles.glow}
        />
      </View>
      <Ionicons name="sparkles" size={16} color="rgba(217,184,120,0.5)" style={styles.sparkleTL} />
      <Ionicons name="sparkles" size={12} color="rgba(217,184,120,0.35)" style={styles.sparkleTR} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <IconButton icon="close" variant="glass" color={theme.colors.primaryDark} onPress={() => router.back()} />
          <View style={styles.securePill}>
            <Ionicons name="lock-closed" size={11} color={theme.colors.champagneLight} />
            <Text style={styles.securePillText}>Paiement sécurisé Stripe</Text>
          </View>
        </View>

        {isLoading ? (
          <LoadingOverlay dark fullscreen label="Chargement des offres..." />
        ) : (
          <>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
            >
              {/* ---------------- HERO ---------------- */}
              <Animated.View
                style={{
                  opacity: heroAnim,
                  transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
                }}
              >
                <View style={styles.crownWrap}>
                  <LinearGradient colors={theme.gradients.gold} style={styles.crownCircle}>
                    <Ionicons name="ribbon" size={30} color={theme.colors.primaryDark} />
                  </LinearGradient>
                </View>
                <Text style={styles.heroTitle}>Passez à{'\n'}Everia<Text style={{ color: theme.colors.champagne }}>+</Text></Text>
                <Text style={styles.heroSubtitle}>
                  Transformez chaque événement en une mémoire vivante, illimitée et sublimée par l'IA.
                </Text>

                <View style={styles.benefitsList}>
                  {HERO_BENEFITS.map((b) => (
                    <View key={b.label} style={styles.benefitRow}>
                      <View style={styles.benefitIconWrap}>
                        <Ionicons name={b.icon} size={16} color={theme.colors.champagne} />
                      </View>
                      <Text style={styles.benefitLabel}>{b.label}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>

              {/* ---------------- PREUVE SOCIALE ---------------- */}
              <Animated.View style={[styles.socialProofRow, { opacity: heroAnim }]}>
                {SOCIAL_PROOF.map((s) => (
                  <View key={s.label} style={styles.socialProofItem}>
                    {s.icon === 'star' ? (
                      <Ionicons name="star" size={14} color={theme.colors.champagne} />
                    ) : (
                      <Ionicons name={s.icon} size={14} color={theme.colors.champagne} />
                    )}
                    <Text style={styles.socialProofValue}>{s.value}</Text>
                    <Text style={styles.socialProofLabel}>{s.label}</Text>
                  </View>
                ))}
              </Animated.View>

              {/* ---------------- PLANS ---------------- */}
              <Animated.View
                style={{
                  opacity: listAnim,
                  transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                  marginTop: theme.spacing.xxl,
                }}
              >
                <Text style={styles.sectionLabel}>Choisissez votre formule</Text>
                <View style={{ gap: theme.spacing.md }}>
                  {paidPlans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      selected={plan.code === selectedCode}
                      badgePulse={badgePulse}
                      onPress={() => selectPlan(plan.code)}
                    />
                  ))}
                </View>

                {freePlan ? (
                  <Pressable onPress={() => router.back()} style={styles.freeLinkWrap} hitSlop={8}>
                    <Text style={styles.freeLinkText}>Continuer avec la formule gratuite</Text>
                  </Pressable>
                ) : null}
              </Animated.View>
            </ScrollView>

            {/* ---------------- BARRE D'ACTION COLLANTE ---------------- */}
            <Animated.View
              style={[
                styles.ctaBar,
                {
                  opacity: ctaAnim,
                  transform: [{ translateY: ctaAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
                },
              ]}
            >
              <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject} />
              <View style={styles.ctaBarContent}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ctaPrice}>
                    {selectedPlan ? formatPrice(selectedPlan.price_cents, selectedPlan.currency) : '—'}
                    {selectedPlan?.billing_interval === 'month' && <Text style={styles.ctaPriceUnit}> /mois</Text>}
                    {selectedPlan?.billing_interval === 'year' && <Text style={styles.ctaPriceUnit}> /an</Text>}
                  </Text>
                  <Text style={styles.ctaDisclaimer}>Sans engagement · Annulez à tout moment</Text>
                </View>
                <Pressable
                  onPress={handleSubscribe}
                  disabled={!selectedPlan || processingPlan === selectedPlan?.code}
                  style={({ pressed }) => [styles.ctaButtonWrap, pressed && { transform: [{ scale: 0.98 }] }]}
                >
                  <LinearGradient colors={theme.gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaButton}>
                    {processingPlan === selectedPlan?.code ? (
                      <Text style={styles.ctaButtonText}>Traitement...</Text>
                    ) : (
                      <>
                        <Text style={styles.ctaButtonText}>Continuer</Text>
                        <Ionicons name="arrow-forward" size={16} color={theme.colors.primaryDark} style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ================================================================
// Carte de plan sélectionnable — état actif marqué par une bordure
// dorée, une légère mise à l'échelle, une coche, et pour le plan mis
// en avant, un ruban "Meilleure offre" au pouls discret.
// ================================================================
function PlanCard({ plan, selected, onPress, badgePulse }) {
  const isFeatured = plan.code === 'everia_plus';
  const scale = useRef(new Animated.Value(selected ? 1 : 0.98)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: selected ? 1 : 0.98, useNativeDriver: true, friction: 7 }).start();
  }, [selected]);

  const features = Array.isArray(plan.features?.list) ? plan.features.list : [];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} style={[styles.planCard, selected && styles.planCardSelected]}>
        {isFeatured && (
          <Animated.View
            style={[
              styles.featuredRibbon,
              {
                transform: [
                  {
                    scale: badgePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="flash" size={11} color={theme.colors.primaryDark} />
            <Text style={styles.featuredRibbonText}>MEILLEURE OFFRE</Text>
          </Animated.View>
        )}

        <View style={styles.planCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.planName, { color: selected ? theme.colors.champagne : theme.colors.white }]}>{plan.name}</Text>
            {plan.description ? <Text style={styles.planDescription}>{plan.description}</Text> : null}
          </View>
          <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
            {selected && <View style={styles.radioInner} />}
          </View>
        </View>

        <View style={styles.planPriceRow}>
          <Text style={styles.planPrice}>{formatPrice(plan.price_cents, plan.currency)}</Text>
          {plan.billing_interval === 'month' && <Text style={styles.planInterval}>/mois</Text>}
          {plan.billing_interval === 'year' && <Text style={styles.planInterval}>/an</Text>}
          {plan.billing_interval === 'one_time' && <Text style={styles.planInterval}>paiement unique</Text>}
        </View>

        {features.length > 0 && (
          <View style={styles.planFeatures}>
            {features.map((feature) => (
              <View key={feature} style={styles.planFeatureRow}>
                <Ionicons name="checkmark-circle" size={15} color={selected ? theme.colors.champagne : 'rgba(255,255,255,0.4)'} />
                <Text style={styles.planFeatureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowWrap: { position: 'absolute', top: -80, left: 0, right: 0, height: 320, alignItems: 'center' },
  glow: { width: 420, height: 420, borderRadius: 210 },
  sparkleTL: { position: 'absolute', top: 90, left: 28 },
  sparkleTR: { position: 'absolute', top: 140, right: 40 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.layout.screenHorizontal, paddingTop: 4 },
  securePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(217,184,120,0.12)', borderWidth: 1, borderColor: 'rgba(217,184,120,0.3)', paddingHorizontal: 10, height: 28, borderRadius: 999 },
  securePillText: { color: theme.colors.champagneLight, fontFamily: theme.typography.families.bodySemiBold, fontSize: 10, letterSpacing: 0.3 },

  scrollBody: { paddingHorizontal: theme.layout.screenHorizontal, paddingTop: theme.spacing.lg, paddingBottom: 160 },

  crownWrap: { alignItems: 'center', marginBottom: theme.spacing.lg },
  crownCircle: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', ...theme.shadows.gold },

  heroTitle: { ...theme.typography.styles.displayDark, fontSize: 34, lineHeight: 40, textAlign: 'center' },
  heroSubtitle: { color: theme.colors.textOnDark, opacity: 0.68, fontFamily: theme.typography.families.body, fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: theme.spacing.md, maxWidth: 300, alignSelf: 'center' },

  benefitsList: { marginTop: theme.spacing.xxl, gap: theme.spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(217,184,120,0.14)', alignItems: 'center', justifyContent: 'center' },
  benefitLabel: { flex: 1, color: theme.colors.white, fontFamily: theme.typography.families.bodyMedium, fontSize: 13.5 },

  socialProofRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xxl, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: theme.radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingVertical: theme.spacing.md },
  socialProofItem: { flex: 1, alignItems: 'center', gap: 3 },
  socialProofValue: { color: theme.colors.white, fontFamily: theme.typography.families.displaySemiBold, fontSize: 15, marginTop: 2 },
  socialProofLabel: { color: theme.colors.textOnDark, opacity: 0.55, fontFamily: theme.typography.families.body, fontSize: 9.5 },

  sectionLabel: { color: theme.colors.textOnDark, opacity: 0.6, fontFamily: theme.typography.families.bodySemiBold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: theme.spacing.md },

  planCard: { borderRadius: theme.radius.xl, backgroundColor: theme.colors.surfaceDark2, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', padding: theme.spacing.lg, overflow: 'visible' },
  planCardSelected: { borderColor: theme.colors.champagne, backgroundColor: theme.colors.surfaceDark3, ...theme.shadows.gold },

  featuredRibbon: {
    position: 'absolute',
    top: -12,
    left: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.champagne,
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 999,
    ...theme.shadows.gold,
  },
  featuredRibbonText: { color: theme.colors.primaryDark, fontFamily: theme.typography.families.bodyBold, fontSize: 9, letterSpacing: 0.6 },

  planCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planName: { fontFamily: theme.typography.families.displaySemiBold, fontSize: 17 },
  planDescription: { color: theme.colors.textOnDark, opacity: 0.55, fontFamily: theme.typography.families.body, fontSize: 11.5, marginTop: 3, lineHeight: 16 },

  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  radioOuterSelected: { borderColor: theme.colors.champagne },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: theme.colors.champagne },

  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: theme.spacing.md },
  planPrice: { color: theme.colors.white, fontFamily: theme.typography.families.displaySemiBold, fontSize: 24 },
  planInterval: { color: theme.colors.textOnDark, opacity: 0.55, fontFamily: theme.typography.families.body, fontSize: 12, marginBottom: 3 },

  planFeatures: { marginTop: theme.spacing.md, gap: 7, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: theme.spacing.md },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planFeatureText: { flex: 1, color: theme.colors.textOnDark, opacity: 0.85, fontFamily: theme.typography.families.body, fontSize: 12.5 },

  freeLinkWrap: { alignItems: 'center', marginTop: theme.spacing.xl },
  freeLinkText: { color: theme.colors.textOnDark, opacity: 0.5, fontFamily: theme.typography.families.bodyMedium, fontSize: 12.5, textDecorationLine: 'underline' },

  ctaBar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  ctaBarContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.layout.screenHorizontal, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.lg, gap: theme.spacing.md },
  ctaPrice: { color: theme.colors.white, fontFamily: theme.typography.families.displaySemiBold, fontSize: 19 },
  ctaPriceUnit: { color: theme.colors.textOnDark, opacity: 0.6, fontFamily: theme.typography.families.body, fontSize: 12 },
  ctaDisclaimer: { color: theme.colors.textOnDark, opacity: 0.5, fontFamily: theme.typography.families.body, fontSize: 10.5, marginTop: 2 },
  ctaButtonWrap: { borderRadius: theme.radius.buttonLarge, overflow: 'hidden' },
  ctaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, paddingHorizontal: theme.spacing.xxl },
  ctaButtonText: { color: theme.colors.primaryDark, fontFamily: theme.typography.families.bodyBold, fontSize: 14.5 },
});
