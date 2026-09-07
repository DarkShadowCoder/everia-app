// src/components/ui/Badge.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '@/theme';

export default function Badge({ label, backgroundColor, textColor, size = 'md', style }) {
  const isSmall = size === 'sm';
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: backgroundColor || theme.colors.primarySoft,
          height: isSmall ? 20 : theme.components.badge.height,
          paddingHorizontal: isSmall ? 8 : theme.components.badge.paddingHorizontal,
          borderRadius: theme.components.badge.radius,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: textColor || theme.colors.textPlum,
          fontFamily: theme.typography.families.bodySemiBold,
          fontSize: isSmall ? 9 : theme.components.badge.fontSize,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
});
