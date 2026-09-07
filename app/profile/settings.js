// app/profile/settings.js
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import theme from '@/theme';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { supabase } from '@/lib/supabase';

// Les préférences vivent dans la table dédiée `user_settings` (une ligne par
// utilisateur, colonnes booléennes) — pas dans profiles.notification_preferences
// qui n'existe pas dans ce schéma.
export default function Settings() {
  const { user, signOut } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle();
      setSettings(data || { push_enabled: true, email_enabled: true, cellular_uploads_allowed: true, face_recognition_enabled: false });
      setLoading(false);
    })();
  }, [user?.id]);

  const updateSetting = async (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    const { error } = await supabase.from('user_settings').upsert({ user_id: user.id, [key]: value }, { onConflict: 'user_id' });
    if (error) showToast(error.message, 'error');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible et supprimera définitivement vos données Everia. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => showToast('Contactez le support pour finaliser la suppression de votre compte.', 'info'),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Header title="Paramètres" />
        <LoadingOverlay fullscreen />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Paramètres" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <ToggleRow label="Notifications push" value={!!settings.push_enabled} onChange={(v) => updateSetting('push_enabled', v)} />
        <ToggleRow label="Notifications par e-mail" value={!!settings.email_enabled} onChange={(v) => updateSetting('email_enabled', v)} />

        <Text style={styles.sectionTitle}>Confidentialité & IA</Text>
        <ToggleRow label="Personnalisation IA" value={!!settings.ai_personalization_enabled} onChange={(v) => updateSetting('ai_personalization_enabled', v)} />
        <ToggleRow label="Reconnaissance faciale" value={!!settings.face_recognition_enabled} onChange={(v) => updateSetting('face_recognition_enabled', v)} />

        <Text style={styles.sectionTitle}>Données mobiles</Text>
        <ToggleRow label="Autoriser l'envoi en 4G/5G" value={!!settings.cellular_uploads_allowed} onChange={(v) => updateSetting('cellular_uploads_allowed', v)} />

        <Text style={styles.sectionTitle}>Compte</Text>
        <Text style={styles.infoLine}>{user?.email || 'Compte invité'}</Text>

        <Button title="Se déconnecter" variant="outline" onPress={signOut} style={{ marginTop: theme.spacing.xl }} />
        <Button title="Supprimer mon compte" variant="danger" onPress={handleDeleteAccount} style={{ marginTop: theme.spacing.md }} />
      </ScrollView>
    </View>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: theme.colors.border, true: theme.colors.primary }} thumbColor="white" />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: theme.layout.screenHorizontal, paddingBottom: 40 },
  sectionTitle: { fontFamily: theme.typography.families.displaySemiBold, fontSize: 16, color: theme.colors.textPrimary, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  toggleLabel: { fontFamily: theme.typography.families.bodyMedium, fontSize: 14, color: theme.colors.textPrimary },
  infoLine: { fontFamily: theme.typography.families.body, fontSize: 13, color: theme.colors.textSecondary, paddingVertical: 8 },
});
