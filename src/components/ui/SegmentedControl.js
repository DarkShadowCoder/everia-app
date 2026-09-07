// src/components/ui/SegmentedControl.js
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import theme from '@/theme';

export default function SegmentedControl({ options, value, onChange, dark = false, scrollable = true }) {
  const Wrapper = scrollable ? ScrollView : View;
  const wrapperProps = scrollable ? { horizontal: true, showsHorizontalScrollIndicator: false } : {};

  return (
    <Wrapper {...wrapperProps} contentContainerStyle={styles.row} style={!scrollable && styles.fullRow}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(opt.value);
            }}
            style={[
              styles.segment,
              scrollable ? { marginRight: 8 } : { flex: 1 },
              {
                backgroundColor: selected ? (dark ? theme.colors.champagne : theme.colors.primary) : dark ? theme.colors.surfaceDark2 : theme.colors.surfaceSoft,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: theme.typography.families.bodySemiBold,
                fontSize: 12.5,
                color: selected ? (dark ? theme.colors.primaryDark : theme.colors.white) : dark ? theme.colors.textOnDark : theme.colors.textSecondary,
              }}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  fullRow: { flexDirection: 'row', gap: 8 },
  segment: { height: 36, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
