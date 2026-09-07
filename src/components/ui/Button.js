// src/components/ui/Button.js
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';

const GRADIENTS = {
  primary: theme.gradients.primary,
  gold: theme.gradients.gold,
};

export default function Button({
  title,
  onPress,
  variant = 'primary', // primary | primaryDark | gold | outline | outlineGold | ghost | danger | success
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  size = 'md', // sm | md | lg
  style,
  textStyle,
  haptic = true,
}) {
  const spec = theme.buttons[disabled ? 'disabled' : variant] || theme.buttons.primary;
  const isGradient = !disabled && (variant === 'primary' || variant === 'gold');
  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : spec.height;

  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const content = (
    <View style={styles.contentRow}>
      {icon && iconPosition === 'left' && !loading && (
        <Ionicons name={icon} size={18} color={spec.color} style={styles.iconLeft} />
      )}
      {loading ? (
        <ActivityIndicator color={spec.color} />
      ) : (
        <Text
          style={[
            theme.typography.styles.button,
            { color: spec.color },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
      {icon && iconPosition === 'right' && !loading && (
        <Ionicons name={icon} size={18} color={spec.color} style={styles.iconRight} />
      )}
    </View>
  );

  const outerStyle = [
    styles.base,
    {
      height,
      borderRadius: spec.radius,
      borderWidth: spec.borderWidth,
      borderColor: spec.borderColor,
      paddingHorizontal: spec.horizontalPadding,
      width: fullWidth ? '100%' : undefined,
      opacity: disabled ? 0.7 : 1,
    },
    !isGradient && { backgroundColor: spec.backgroundColor },
    style,
  ];

  if (isGradient) {
    return (
      <Pressable onPress={handlePress} disabled={disabled || loading} style={({ pressed }) => [pressed && styles.pressed]}>
        <LinearGradient
          colors={GRADIENTS[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={outerStyle}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [...outerStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
