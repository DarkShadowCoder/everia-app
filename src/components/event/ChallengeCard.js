// src/components/event/ChallengeCard.js
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import ProgressBar from '@/components/ui/ProgressBar';

const DIFFICULTY_LABELS = ['', 'Facile', 'Accessible', 'Modéré', 'Corsé', 'Expert'];

export default function ChallengeCard({ challenge, submission, onPress }) {
  const isDone = submission?.status === 'approved' || submission?.status === 'submitted';
  const isLocked = challenge.status !== 'active';

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: isDone ? 'rgba(217,184,120,0.16)' : 'rgba(255,255,255,0.06)' }]}>
          <Ionicons
            name={isDone ? 'checkmark-circle' : isLocked ? 'lock-closed-outline' : 'flag-outline'}
            size={18}
            color={isDone ? theme.challenges.completed : isLocked ? theme.challenges.locked : theme.colors.champagneLight}
          />
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{challenge.reward_points} pts</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>
      <Text style={styles.difficulty}>{DIFFICULTY_LABELS[challenge.difficulty] || 'Défi'}</Text>

      {submission ? (
        <Text style={styles.status}>
          {submission.status === 'approved' ? 'Validé ✓' : submission.status === 'rejected' ? 'Non validé' : 'En attente de validation'}
        </Text>
      ) : (
        <ProgressBar progress={0} height={5} style={{ marginTop: 10 }} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    padding: theme.spacing.md,
    borderRadius: theme.challenges.card.borderRadius,
    backgroundColor: theme.challenges.card.backgroundColor,
    borderWidth: 1,
    borderColor: theme.challenges.card.borderColor,
    marginRight: theme.spacing.md,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pointsBadge: { backgroundColor: theme.challenges.pointsBadge.backgroundColor, paddingHorizontal: 8, height: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pointsText: { color: theme.challenges.pointsBadge.textColor, fontFamily: theme.typography.families.bodySemiBold, fontSize: 10 },
  title: { color: theme.colors.white, fontFamily: theme.typography.families.bodySemiBold, fontSize: 14, lineHeight: 19, marginBottom: 4 },
  difficulty: { color: theme.colors.textOnDark, opacity: 0.55, fontFamily: theme.typography.families.body, fontSize: 11 },
  status: { marginTop: 10, color: theme.colors.champagneLight, fontFamily: theme.typography.families.bodyMedium, fontSize: 11 },
});
