// app/(auth)/login.js
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import theme from '@/theme';
import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const isLoading = useAuthStore((s) => s.isLoading);
  const showToast = useUIStore((s) => s.showToast);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      showToast('Veuillez renseigner votre e-mail et votre mot de passe.', 'warning');
      return;
    }
    const { error } = await signInWithEmail(email.trim(), password);
    if (error) {
      showToast(mapAuthError(error), 'error');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <LinearGradient colors={theme.gradients.darkLuxury} style={{ flex: 1 }}>
      <Header title="Connexion" dark />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.form}>
        <Text style={styles.lead}>Ravis de vous revoir. Connectez-vous pour retrouver vos souvenirs.</Text>

        <Input label="E-mail" value={email} onChangeText={setEmail} placeholder="vous@exemple.com" keyboardType="email-address" autoCapitalize="none" dark icon="mail-outline" style={{ marginBottom: theme.spacing.lg }} />
        <Input label="Mot de passe" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry dark icon="lock-closed-outline" />

        <Text style={styles.forgot} onPress={() => showToast('Un e-mail de réinitialisation vous sera envoyé prochainement.', 'info')}>
          Mot de passe oublié ?
        </Text>

        <Button title="Se connecter" onPress={handleSubmit} loading={isLoading} variant="gold" style={{ marginTop: theme.spacing.xl }} />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <Text style={styles.footerLink} onPress={() => router.replace('/(auth)/register')}>Créer un compte</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function mapAuthError(message) {
  if (message?.includes('Invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  return message || 'Une erreur est survenue.';
}

const styles = StyleSheet.create({
  form: { flex: 1, paddingHorizontal: theme.layout.screenHorizontal, paddingTop: theme.spacing.lg },
  lead: { color: theme.colors.textOnDark, opacity: 0.65, fontFamily: theme.typography.families.body, fontSize: 13.5, marginBottom: theme.spacing.xxl, lineHeight: 20 },
  forgot: { color: theme.colors.champagneLight, fontFamily: theme.typography.families.bodyMedium, fontSize: 12.5, textAlign: 'right', marginTop: theme.spacing.md },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.xxl },
  footerText: { color: theme.colors.textOnDark, opacity: 0.6, fontFamily: theme.typography.families.body, fontSize: 13 },
  footerLink: { color: theme.colors.champagneLight, fontFamily: theme.typography.families.bodySemiBold, fontSize: 13 },
});
