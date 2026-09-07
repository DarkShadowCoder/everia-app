// src/components/ui/NeuCard.js
// ------------------------------------------------------------
// Carte "Neomorphism obscur" : sur fond Midnight Plum (darkSurface),
// on simule le creux/relief propre au néomorphisme avec une paire
// d'ombres (lumière chaude en haut-gauche façon champagne diffus,
// ombre profonde en bas-droite) + une bordure très fine qui capte
// la lumière. React Native ne supporte qu'une ombre par View, donc
// le "highlight" est simulé par un second calque semi-transparent
// superposé plutôt qu'une vraie box-shadow double.
// ------------------------------------------------------------

import React from 'react';
import { StyleSheet, View } from 'react-native';
import theme from '@/theme';

export default function NeuCard({
  children,
  style,
  variant = 'raised', // 'raised' | 'pressed' | 'flat'
  radius = theme.radius.card,
  padding = theme.spacing.lg,
  ...rest
}) {
  const isPressed = variant === 'pressed';

  return (
    <View
      style={[
        styles.outer,
        {
          borderRadius: radius,
          backgroundColor: theme.colors.surfaceDark2,
          ...(variant === 'flat' ? {} : isPressed ? styles.pressedShadow : theme.shadows.lg),
        },
        style,
      ]}
      {...rest}
    >
      {/* Calque highlight haut-gauche, façon lumière chaude effleurant le relief */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: radius,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderTopColor: 'rgba(217,184,120,0.10)',
            borderLeftColor: 'rgba(255,255,255,0.06)',
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: radius,
            borderBottomWidth: 1,
            borderRightWidth: 1,
            borderBottomColor: 'rgba(0,0,0,0.45)',
            borderRightColor: 'rgba(0,0,0,0.25)',
          },
        ]}
      />
      <View style={{ padding, borderRadius: radius }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
  pressedShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 1,
  },
});
