// src/components/ui/Chip.js
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';

export default function Chip({ label, icon, selected = false, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceSoft,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? theme.colors.white : theme.colors.textSecondary}
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        style={{
          color: selected ? theme.colors.white : theme.colors.textSecondary,
          fontFamily: theme.typography.families.bodyMedium,
          fontSize: theme.components.chip.fontSize,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.components.chip.height,
    paddingHorizontal: theme.components.chip.paddingHorizontal,
    borderRadius: theme.components.chip.radius,
    borderWidth: 1,
  },
});
