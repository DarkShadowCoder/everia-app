
// app/(tabs)/profile.js
// Refonte complète de la page Profil.
// Modèle UI : dashboard mobile premium + listes groupées inspirées
// des interfaces de type Apple/Linear, adapté au langage visuel
// Midnight Plum + Champagne d'Everia.

import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import ScreenContainer from '@/components/ui/ScreenContainer';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { useAuthStore, selectIsGuest } from '@/store/authStore';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { avatarUrl } from '@/lib/storage';
import { formatCompactNumber } from '@/lib/format';

const QUICK_ACTIONS = [
  {
    key: 'edit',
    icon: 'person-outline',
    label: 'Modifier le profil',
    caption: 'Votre identité',
    route: '/profile/edit',
    tone: 'plum',
  },
  {
    key: 'achievements',
    icon: 'trophy-outline',
    label: 'Mes badges',
    caption: 'Vos accomplissements',
    route: '/profile/achievements',
    tone: 'gold',
  },
  {
    key: 'subscription',
    icon: 'sparkles-outline',
    label: 'Abonnement',
    caption: 'Votre expérience Everia',
    route: '/subscription',
    tone: 'rose',
  },
];

const PREFERENCE_ITEMS = [
  {
    key: 'settings',
    icon: 'settings-outline',
    label: 'Paramètres',
    caption: 'Notifications, données et préférences',
    route: '/profile/settings',
  },
  {
    key: 'privacy',
    icon: 'shield-checkmark-outline',
    label: 'Confidentialité',
    caption: 'Contrôlez vos données et votre visibilité',
    route: '/profile/privacy',
  },
  {
    key: 'support',
    icon: 'help-circle-outline',
    label: 'Aide & Support',
    caption: 'Besoin d’aide ? Nous sommes là.',
    route: '/profile/support',
  },
];

export default function Profile() {
  const { user, profile, signOut } = useAuthStore();
  const isGuest = useAuthStore(selectIsGuest);

  const { data: stats } = useSupabaseQuery(async () => {
    if (!user) return { events: 0, photos: 0, badges: 0 };

    const [{ count: events }, { data: participation }, { count: badges }] =
      await Promise.all([
        supabase
          .from('event_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),

        supabase
          .from('event_participation_profiles')
          .select('photos_count,videos_count')
          .eq('user_id', user.id),

        supabase
          .from('user_badges')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

    const mediaCount = (participation || []).reduce(
      (sum, item) =>
        sum + (item.photos_count || 0) + (item.videos_count || 0),
      0
    );

    return {
      events: events || 0,
      photos: mediaCount,
      badges: badges || 0,
    };
  }, [user?.id]);

  const displayName = profile?.display_name || 'Participant Everia';
  const bio = profile?.bio?.trim();

  const handleSignOut = () => {
    Alert.alert(
      'Se déconnecter',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  return (
    <ScreenContainer
      noPadding
      scroll
      edges={['top']}
      contentContainerStyle={styles.content}
    >
      <StatusBar style="dark" />

      <LinearGradient
        colors={theme.gradients.darkLuxury}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />

        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>EVERIA</Text>

            <Text style={styles.heroTitle}>
              Mon profil
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Modifier mon profil"
            onPress={() => router.push('/profile/edit')}
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="create-outline"
              size={19}
              color={theme.colors.white}
            />
          </Pressable>
        </View>

        <View style={styles.heroIdentity}>
          <View style={styles.avatarShell}>
            <Avatar
              uri={avatarUrl(profile?.avatar_path)}
              name={displayName}
              size="xxl"
              ring
            />
          </View>

          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {displayName}
          </Text>

          {isGuest ? (
            <Badge
              label="Invité"
              backgroundColor="rgba(255,255,255,0.12)"
              textColor={theme.colors.white}
              size="sm"
              style={styles.guestBadge}
            />
          ) : (
            <Text
              style={styles.email}
              numberOfLines={1}
            >
              {user?.email || 'Membre Everia'}
            </Text>
          )}

          {!!bio && (
            <Text
              style={styles.bio}
              numberOfLines={2}
            >
              {bio}
            </Text>
          )}
        </View>

        <View style={styles.statsCard}>
          <ProfileStat
            value={stats?.events}
            label="Événements"
            icon="calendar-outline"
          />

          <View style={styles.statDivider} />

          <ProfileStat
            value={stats?.photos}
            label="Médias"
            icon="images-outline"
          />

          <View style={styles.statDivider} />

          <ProfileStat
            value={stats?.badges}
            label="Badges"
            icon="ribbon-outline"
          />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <SectionHeading
          eyebrow="Votre espace"
          title="Tout ce qui compte, au même endroit."
          subtitle="Gérez votre identité, vos accomplissements et votre expérience Everia."
        />

        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((item) => (
            <QuickActionCard
              key={item.key}
              item={item}
            />
          ))}
        </View>

        <View style={styles.sectionBlock}>
          <SectionHeading
            compact
            eyebrow="Préférences"
            title="Votre expérience"
          />

          <View style={styles.settingsCard}>
            {PREFERENCE_ITEMS.map((item, index) => (
              <React.Fragment key={item.key}>
                <PreferenceRow item={item} />

                {index < PREFERENCE_ITEMS.length - 1 && (
                  <View style={styles.rowDivider} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Se déconnecter"
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.logoutIcon}>
            <Ionicons
              name="log-out-outline"
              size={19}
              color={theme.colors.error}
            />
          </View>

          <View style={styles.logoutTextWrap}>
            <Text style={styles.logoutTitle}>
              Se déconnecter
            </Text>

            <Text style={styles.logoutCaption}>
              Quitter votre session Everia
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.error}
          />
        </Pressable>

        <Text style={styles.footerNote}>
          One Event. Many Perspectives. One Everia.
        </Text>
      </View>
    </ScreenContainer>
  );
}

function ProfileStat({ value, label, icon }) {
  return (
    <View style={styles.profileStat}>
      <View style={styles.statIcon}>
        <Ionicons
          name={icon}
          size={15}
          color={theme.colors.champagneLight}
        />
      </View>

      <Text style={styles.statValue}>
        {formatCompactNumber(value || 0)}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  compact = false,
}) {
  return (
    <View
      style={[
        styles.sectionHeading,
        compact && styles.sectionHeadingCompact,
      ]}
    >
      <Text style={styles.sectionEyebrow}>
        {eyebrow}
      </Text>

      <Text
        style={[
          styles.sectionTitle,
          compact && styles.sectionTitleCompact,
        ]}
      >
        {title}
      </Text>

      {!!subtitle && (
        <Text style={styles.sectionSubtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

function QuickActionCard({ item }) {
  const palette = {
    plum: {
      iconBackground: theme.colors.primarySoft,
      iconColor: theme.colors.primary,
      accent: theme.colors.primary,
    },

    gold: {
      iconBackground: theme.colors.champagnePale,
      iconColor: theme.colors.champagneDark,
      accent: theme.colors.champagneDark,
    },

    rose: {
      iconBackground: '#F8E9EC',
      iconColor: theme.colors.error,
      accent: theme.colors.error,
    },
  }[item.tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={() => router.push(item.route)}
      style={({ pressed }) => [
        styles.quickCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.quickTopRow}>
        <View
          style={[
            styles.quickIcon,
            {
              backgroundColor: palette.iconBackground,
            },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={palette.iconColor}
          />
        </View>

        <View style={styles.quickArrow}>
          <Ionicons
            name="arrow-up-outline"
            size={15}
            color={theme.colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.quickCopy}>
        <Text
          style={styles.quickLabel}
          numberOfLines={2}
        >
          {item.label}
        </Text>

        <Text
          style={styles.quickCaption}
          numberOfLines={2}
        >
          {item.caption}
        </Text>
      </View>

      <View
        style={[
          styles.quickAccent,
          {
            backgroundColor: palette.accent,
          },
        ]}
      />
    </Pressable>
  );
}

function PreferenceRow({ item }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={() => router.push(item.route)}
      style={({ pressed }) => [
        styles.preferenceRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.preferenceIcon}>
        <Ionicons
          name={item.icon}
          size={19}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceLabel}>
          {item.label}
        </Text>

        <Text
          style={styles.preferenceCaption}
          numberOfLines={1}
        >
          {item.caption}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={theme.colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: theme.colors.background,
  },

  hero: {
    minHeight: 410,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.layout.screenHorizontal,
    paddingBottom: theme.spacing.xxxl,
    position: 'relative',
    overflow: 'hidden',
  },

  heroGlowTop: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    top: -135,
    right: -45,
    backgroundColor: 'rgba(217,184,120,0.10)',
  },

  heroGlowBottom: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: -205,
    left: -110,
    backgroundColor: 'rgba(122,76,124,0.17)',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  eyebrow: {
    color: theme.colors.champagne,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: theme.typography.letterSpacing.luxury,
  },

  heroTitle: {
    color: theme.colors.white,
    fontFamily: theme.typography.families.displaySemiBold,
    fontSize: 30,
    lineHeight: 36,
    marginTop: 2,
  },

  editButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroIdentity: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.md,
  },

  avatarShell: {
    position: 'relative',
  },

  name: {
    color: theme.colors.white,
    fontFamily: theme.typography.families.displaySemiBold,
    fontSize: 25,
    lineHeight: 31,
    marginTop: theme.spacing.md,
    maxWidth: '90%',
  },

  email: {
    color: theme.colors.white,
    opacity: 0.66,
    fontFamily: theme.typography.families.body,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
    maxWidth: '92%',
  },

  guestBadge: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  bio: {
    color: theme.colors.white,
    opacity: 0.78,
    fontFamily: theme.typography.families.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    maxWidth: 300,
  },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.cardLarge,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  profileStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },

  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,184,120,0.13)',
    marginBottom: 5,
  },

  statValue: {
    color: theme.colors.white,
    fontFamily: theme.typography.families.bodyBold,
    fontSize: 18,
    lineHeight: 22,
  },

  statLabel: {
    color: theme.colors.white,
    opacity: 0.58,
    fontFamily: theme.typography.families.body,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 1,
  },

  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.11)',
  },

  body: {
    paddingHorizontal: theme.layout.screenHorizontal,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: 8,
  },

  sectionHeading: {
    marginBottom: theme.spacing.lg,
  },

  sectionHeadingCompact: {
    marginBottom: theme.spacing.md,
  },

  sectionEyebrow: {
    color: theme.colors.textGold,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: theme.typography.letterSpacing.uppercase,
    textTransform: 'uppercase',
  },

  sectionTitle: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.families.displaySemiBold,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
  },

  sectionTitleCompact: {
    fontSize: 22,
    lineHeight: 28,
  },

  sectionSubtitle: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.families.body,
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 5,
    maxWidth: 340,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },

  quickCard: {
    flexGrow: 1,
    flexBasis: '31%',
    minWidth: 100,
    minHeight: 132,
    padding: theme.spacing.md,
    borderRadius: theme.radius.cardLarge,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.sm,
  },

  quickTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickArrow: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSoft,
  },

  quickCopy: {
    marginTop: theme.spacing.md,
  },

  quickLabel: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 12.5,
    lineHeight: 17,
  },

  quickCaption: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.families.body,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 4,
  },

  quickAccent: {
    position: 'absolute',
    width: 52,
    height: 4,
    borderRadius: 4,
    bottom: 0,
    left: theme.spacing.md,
  },

  sectionBlock: {
    marginTop: theme.spacing.huge,
  },

  settingsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.cardLarge,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },

  preferenceRow: {
    minHeight: 76,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  preferenceIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginRight: theme.spacing.md,
  },

  preferenceCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: theme.spacing.md,
  },

  preferenceLabel: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 13.5,
    lineHeight: 18,
  },

  preferenceCaption: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.families.body,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 3,
  },

  rowDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginLeft: 72,
  },

  logoutButton: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.cardLarge,
    backgroundColor: theme.colors.errorLight,
    borderWidth: 1,
    borderColor: 'rgba(184,92,104,0.18)',
  },

  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(184,92,104,0.10)',
    marginRight: theme.spacing.md,
  },

  logoutTextWrap: {
    flex: 1,
  },

  logoutTitle: {
    color: theme.colors.error,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: 13.5,
    lineHeight: 18,
  },

  logoutCaption: {
    color: theme.colors.error,
    opacity: 0.70,
    fontFamily: theme.typography.families.body,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2,
  },

  footerNote: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.families.body,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
