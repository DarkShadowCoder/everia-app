// src/components/ui/StepProgress.js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import theme from '@/theme';

export default function StepProgress({ step, total, dark = true }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            {
              backgroundColor: i < step ? theme.colors.champagne : dark ? 'rgba(255,255,255,0.14)' : theme.colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, paddingHorizontal: theme.layout.screenHorizontal, marginBottom: theme.spacing.lg },
  segment: { flex: 1, height: 3, borderRadius: 2 },
});
