// src/components/ui/GlassCard.js
// ------------------------------------------------------------
// Carte "verre dépoli" (Glassmorphism) : flou natif + léger
// dégradé + bordure translucide + ombre douce. Utilisée pour les
// overlays sur médias/héros (badges live, quick actions, header
// transparent sur cover d'événement) et pour les cartes flottantes
// sur fond sombre (Live Wall, Moments, Challenges).
// ------------------------------------------------------------

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/theme';

export default function GlassCard({
  children,
  style,
  intensity = 40,
  tint = 'dark', // 'dark' | 'light'
  radius = theme.radius.card,
  padding = theme.spacing.lg,
  bordered = true,
  gradient = true,
  ...rest
}) {
  const isDark = tint === 'dark';
  const gradientColors = isDark
    ? ['rgba(55,25,58,0.55)', 'rgba(22,10,24,0.35)']
    : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.28)'];

  return (
    <View style={[styles.wrapper, { borderRadius: radius }, style]} {...rest}>
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
      />
      {gradient && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
        />
      )}
      <View
        style={[
          styles.content,
          {
            padding,
            borderRadius: radius,
            borderWidth: bordered ? 1 : 0,
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)',
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  content: {
    overflow: 'hidden',
  },
});
