// src/components/ui/Divider.js
import React from 'react';
import { View } from 'react-native';
import theme from '@/theme';

export default function Divider({ style, color, dark = false }) {
  return (
    <View
      style={[
        { height: theme.components.divider.height, backgroundColor: color || (dark ? theme.colors.dividerDark : theme.components.divider.backgroundColor) },
        style,
      ]}
    />
  );
}
