// src/components/organizer/ModerationCard.js
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import Button from '@/components/ui/Button';
import { mediaThumbnail } from '@/lib/storage';

export default function ModerationCard({ media, onApprove, onReject, onPress }) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onPress}>
        <Image source={{ uri: mediaThumbnail(media) }} style={styles.thumb} contentFit="cover" />
      </Pressable>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.metaRow}>
          <Ionicons name={media.media_type === 'video' ? 'videocam-outline' : 'image-outline'} size={13} color={theme.colors.textSecondary} />
          <Text style={styles.uploader} numberOfLines={1}>{media.uploader_name || 'Participant'}</Text>
        </View>
        <View style={styles.actions}>
          <Button title="Approuver" onPress={onApprove} variant="success" size="sm" fullWidth={false} style={styles.actionBtn} />
          <Button title="Rejeter" onPress={onReject} variant="danger" size="sm" fullWidth={false} style={styles.actionBtn} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cards.default.backgroundColor, borderRadius: theme.cards.default.borderRadius, borderWidth: 1, borderColor: theme.cards.default.borderColor, padding: theme.spacing.sm, marginBottom: theme.spacing.md },
  thumb: { width: 68, height: 68, borderRadius: theme.radius.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  uploader: { fontFamily: theme.typography.families.bodyMedium, fontSize: 12.5, color: theme.colors.textPrimary },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { height: 34, paddingHorizontal: 14 },
});
