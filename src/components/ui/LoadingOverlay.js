// src/components/ui/LoadingOverlay.js
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import theme from '@/theme';

export default function LoadingOverlay({ label = 'Chargement...', fullscreen = false, dark = false }) {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator color={dark ? theme.colors.champagne : theme.colors.primary} size="small" />
      {label ? <Text style={[styles.label, dark && { color: theme.colors.textOnDark, opacity: 0.7 }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxxl },
  fullscreen: { flex: 1 },
  label: { marginTop: 10, fontFamily: theme.typography.families.body, fontSize: 12, color: theme.colors.textSecondary },
});
