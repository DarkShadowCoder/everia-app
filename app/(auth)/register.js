// app/(auth)/register.js
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

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const isLoading = useAuthStore((s) => s.isLoading);
  const showToast = useUIStore((s) => s.showToast);

  const handleSubmit = async () => {
    if (!displayName.trim() || !email.trim() || password.length < 6) {
      showToast('Renseignez votre nom, un e-mail valide et un mot de passe (6 caractères min).', 'warning');
      return;
    }
    const { error } = await signUpWithEmail(email.trim(), password, displayName.trim());
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    showToast('Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse.', 'success');
    router.replace('/onboarding');
  };

  return (
    <LinearGradient colors={theme.gradients.darkLuxury} style={{ flex: 1 }}>
      <Header title="Créer un compte" dark />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.form}>
        <Text style={styles.lead}>Créez votre compte Everia pour organiser et vivre vos événements sous toutes leurs perspectives.</Text>

        <Input label="Nom complet" value={displayName} onChangeText={setDisplayName} placeholder="Emma Martin" dark icon="person-outline" style={{ marginBottom: theme.spacing.lg }} />
        <Input label="E-mail" value={email} onChangeText={setEmail} placeholder="vous@exemple.com" keyboardType="email-address" autoCapitalize="none" dark icon="mail-outline" style={{ marginBottom: theme.spacing.lg }} />
        <Input label="Mot de passe" value={password} onChangeText={setPassword} placeholder="6 caractères minimum" secureTextEntry dark icon="lock-closed-outline" />

        <Button title="Créer mon compte" onPress={handleSubmit} loading={isLoading} variant="gold" style={{ marginTop: theme.spacing.xl }} />

        <Text style={styles.legal}>
          En créant un compte, vous acceptez les Conditions d'utilisation et la Politique de confidentialité d'Everia.
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <Text style={styles.footerLink} onPress={() => router.replace('/(auth)/login')}>Se connecter</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, paddingHorizontal: theme.layout.screenHorizontal, paddingTop: theme.spacing.lg },
  lead: { color: theme.colors.textOnDark, opacity: 0.65, fontFamily: theme.typography.families.body, fontSize: 13.5, marginBottom: theme.spacing.xxl, lineHeight: 20 },
  legal: { color: theme.colors.textOnDark, opacity: 0.45, fontFamily: theme.typography.families.body, fontSize: 11, textAlign: 'center', marginTop: theme.spacing.lg, lineHeight: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.xxl },
  footerText: { color: theme.colors.textOnDark, opacity: 0.6, fontFamily: theme.typography.families.body, fontSize: 13 },
  footerLink: { color: theme.colors.champagneLight, fontFamily: theme.typography.families.bodySemiBold, fontSize: 13 },
});
