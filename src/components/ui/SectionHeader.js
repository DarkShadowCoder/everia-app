// src/components/ui/SectionHeader.js
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '@/theme';

export default function SectionHeader({ title, subtitle, actionLabel, onAction, dark = false, style }) {
  return (
    <View style={[styles.row, { marginBottom: theme.components.sectionTitle.marginBottom }, style]}>
      <View style={{ flex: 1 }}>
        <Text style={[dark ? theme.typography.styles.h1Dark : theme.typography.styles.h3, styles.title]}>{title}</Text>
        {subtitle ? (
          <Text style={[theme.typography.styles.bodySecondary, dark && { color: theme.colors.textOnDark, opacity: 0.6 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: dark ? theme.colors.champagneLight : theme.colors.textPlum }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  title: { fontSize: theme.typography.sizes.h5, lineHeight: theme.typography.lineHeights.h5 },
  action: { fontFamily: theme.typography.families.bodySemiBold, fontSize: 13 },
});
