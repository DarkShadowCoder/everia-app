// src/components/ui/EmptyState.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import Button from './Button';

export default function EmptyState({ icon = 'sparkles-outline', title, subtitle, actionLabel, onAction, dark = false, style }) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrap, { backgroundColor: dark ? 'rgba(217,184,120,0.10)' : theme.emptyState.iconBackground }]}>
        <Ionicons name={icon} size={30} color={dark ? theme.colors.champagne : theme.emptyState.iconColor} />
      </View>
      <Text style={[styles.title, { color: dark ? theme.colors.white : theme.emptyState.titleColor }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: dark ? theme.colors.textOnDark : theme.emptyState.subtitleColor, opacity: dark ? 0.65 : 1 }]}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel ? (
        <Button title={actionLabel} onPress={onAction} variant={dark ? 'gold' : 'primary'} fullWidth={false} style={{ marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.xxl }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.huge, paddingHorizontal: theme.spacing.xl },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg },
  title: { fontFamily: theme.typography.families.displaySemiBold, fontSize: 18, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontFamily: theme.typography.families.body, fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
});
