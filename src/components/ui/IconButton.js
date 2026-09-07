// src/components/ui/IconButton.js
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';

export default function IconButton({
  icon,
  onPress,
  size = 'md', // sm | md | lg
  variant = 'ghost', // ghost | glass | solid | outline
  color,
  badge,
  disabled = false,
  style,
}) {
  const dim = { sm: theme.layout.iconButtonSmall, md: theme.layout.iconButtonMedium, lg: theme.layout.iconButtonLarge }[size];
  const iconSize = { sm: 16, md: 20, lg: 24 }[size];
  const iconColor = color || (variant === 'solid' ? theme.colors.white : theme.colors.primary);

  const variantStyle = {
    ghost: { backgroundColor: 'transparent' },
    glass: { backgroundColor: 'rgba(255,255,255,0.94)', ...theme.shadows.sm },
    solid: { backgroundColor: theme.colors.primary, ...theme.shadows.plum },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  }[variant];

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { width: dim, height: dim, borderRadius: dim / 2, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        variantStyle,
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      {!!badge && (
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 6, right: 6 },
  badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.error, borderWidth: 1.5, borderColor: theme.colors.white },
});
