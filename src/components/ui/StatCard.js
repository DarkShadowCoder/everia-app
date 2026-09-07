// src/components/ui/StatCard.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import { formatCompactNumber } from '@/lib/format';

export default function StatCard({ icon, iconColor, value, label, style, dark = false }) {
  return (
    <View style={[styles.card, dark ? styles.cardDark : styles.cardLight, style]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : theme.colors.primarySoft }]}>
          <Ionicons name={icon} size={16} color={iconColor || theme.colors.primary} />
        </View>
      ) : null}
      <Text style={[styles.value, dark && { color: theme.colors.white }]} numberOfLines={1}>
        {typeof value === 'number' ? formatCompactNumber(value) : value}
      </Text>
      <Text style={[styles.label, dark && { color: theme.colors.textOnDark, opacity: 0.6 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: theme.cards.stat.borderRadius, padding: theme.cards.stat.padding, borderWidth: 1 },
  cardLight: { backgroundColor: theme.cards.stat.backgroundColor, borderColor: theme.cards.stat.borderColor },
  cardDark: { backgroundColor: theme.colors.surfaceDark2, borderColor: theme.colors.borderDark },
  iconWrap: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontFamily: theme.typography.families.displaySemiBold, fontSize: 20, color: theme.colors.textPrimary },
  label: { fontFamily: theme.typography.families.body, fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
});
