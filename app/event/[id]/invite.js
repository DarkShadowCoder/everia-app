// app/event/[id]/invite.js
import React from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import theme from '@/theme';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import { useEventStore } from '@/store/eventStore';
import { useUIStore } from '@/store/uiStore';
import { APP_SCHEME } from '@/constants/config';

export default function InviteModal() {
  const { id } = useLocalSearchParams();
  const { event } = useEventStore();
  const showToast = useUIStore((s) => s.showToast);

  if (!event) return null;

  const qrValue = `${APP_SCHEME}://join?code=${event.event_code}`;

  const copyCode = async () => {
    await Clipboard.setStringAsync(event.event_code);
    showToast('Code copié !', 'success');
  };

  const shareInvite = async () => {
    await Share.share({
      message: `Rejoins "${event.name}" sur Everia avec le code ${event.event_code} ou ce lien : ${qrValue}`,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Inviter" onBack={() => router.back()} />
      <View style={styles.body}>
        <View style={styles.qrCard}>
          <QRCode value={qrValue} size={200} color={theme.invites.qrForeground} backgroundColor={theme.invites.qrBackground} />
        </View>

        <Text style={styles.label}>Code de l'événement</Text>
        <View style={styles.codeBox} onTouchEnd={copyCode}>
          <Text style={styles.codeText}>{event.event_code}</Text>
        </View>
        <Text style={styles.hint}>Touchez le code pour le copier</Text>

        <Button title="Partager l'invitation" icon="share-social-outline" onPress={shareInvite} style={{ marginTop: theme.spacing.xxl }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', paddingTop: theme.spacing.xxl, paddingHorizontal: theme.layout.screenHorizontal },
  qrCard: { backgroundColor: theme.invites.qrCard.backgroundColor, borderRadius: theme.invites.qrCard.borderRadius, borderWidth: 2, borderColor: theme.invites.qrCard.borderColor, padding: theme.spacing.xl, ...theme.shadows.md },
  label: { marginTop: theme.spacing.xxl, fontFamily: theme.typography.families.bodyMedium, fontSize: 12.5, color: theme.colors.textSecondary },
  codeBox: { backgroundColor: theme.invites.codeBackground, paddingHorizontal: theme.spacing.xxl, paddingVertical: theme.spacing.md, borderRadius: theme.radius.lg, marginTop: theme.spacing.sm },
  codeText: { color: theme.invites.codeText, fontFamily: theme.typography.families.displaySemiBold, fontSize: 22, letterSpacing: 2 },
  hint: { marginTop: theme.spacing.sm, fontFamily: theme.typography.families.body, fontSize: 11, color: theme.colors.textMuted },
});
