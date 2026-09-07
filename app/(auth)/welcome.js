// app/(auth)/welcome.js
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import Logo from '@/components/brand/Logo';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function Welcome() {
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth);
  const isLoading = useAuthStore((s) => s.isLoading);
  const showToast = useUIStore((s) => s.showToast);
  const [oauthProvider, setOauthProvider] = useState(null);

  const handleOAuth = async (provider) => {
    setOauthProvider(provider);
    const { error } = await signInWithOAuth(provider);
    setOauthProvider(null);
    if (error) showToast(error, 'error');
  };

  return (
    <LinearGradient colors={theme.gradients.darkLuxury} style={styles.container}>
      <View style={styles.brandBlock}>
        <Logo variant="mark" size={90} />
        <Text style={styles.title}>Bienvenue{'\n'}sur Everia</Text>
        <Text style={styles.subtitle}>Connectez-vous et commencez à créer des souvenirs inoubliables.</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Continuer avec Apple"
          icon="logo-apple"
          variant="gold"
          loading={oauthProvider === 'apple' && isLoading}
          onPress={() => handleOAuth('apple')}
        />
        <Button
          title="Continuer avec Google"
          icon="logo-google"
          variant="outlineGold"
          loading={oauthProvider === 'google' && isLoading}
          onPress={() => handleOAuth('google')}
          style={{ marginTop: theme.spacing.md }}
        />
        <Button
          title="Créer un compte"
          variant="primaryDark"
          onPress={() => router.push('/(auth)/register')}
          style={{ marginTop: theme.spacing.md }}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <Text style={styles.footerLink} onPress={() => router.push('/(auth)/login')}>Se connecter</Text>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          title="Rejoindre un événement en tant qu'invité"
          icon="qr-code-outline"
          variant="ghost"
          textStyle={{ color: theme.colors.champagneLight }}
          onPress={() => router.push('/join')}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingHorizontal: theme.layout.screenHorizontal, paddingTop: 90, paddingBottom: 40 },
  brandBlock: { alignItems: 'center' },
  title: { ...theme.typography.styles.h1Dark, textAlign: 'center', marginTop: theme.spacing.xl },
  subtitle: { color: theme.colors.textOnDark, opacity: 0.65, fontFamily: theme.typography.families.body, fontSize: 13.5, textAlign: 'center', marginTop: theme.spacing.md, lineHeight: 20, maxWidth: 280 },
  actions: {},
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.lg },
  footerText: { color: theme.colors.textOnDark, opacity: 0.6, fontFamily: theme.typography.families.body, fontSize: 13 },
  footerLink: { color: theme.colors.champagneLight, fontFamily: theme.typography.families.bodySemiBold, fontSize: 13 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  dividerText: { color: theme.colors.textOnDark, opacity: 0.4, marginHorizontal: 12, fontSize: 11, fontFamily: theme.typography.families.body },
});
