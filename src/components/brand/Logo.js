// src/components/brand/Logo.js
// Composant de marque Everia : deux variantes basées sur les assets
// fournis — "mark" (le monogramme E / objectif seul) et "full"
// (monogramme + wordmark "Everia" + tagline), déclinables en petite
// taille (barre de navigation) ou grande taille (splash/onboarding).
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import theme from '@/theme';

const MARK = require('../../../assets/images/logo-mark.png');
const FULL = require('../../../assets/images/logo-full.png');

export default function Logo({ variant = 'mark', size = 64, style, tagline = false }) {
  if (variant === 'full') {
    const width = size * 1.2;
    return (
      <View style={[styles.center, style]}>
        <Image source={FULL} style={{ width, height: width * (1145 / 1374) }} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={[styles.center, style]}>
      <Image source={MARK} style={{ width: size, height: size * (1024 / 1536) }} resizeMode="contain" />
      {tagline && <Text style={styles.tagline}>{theme.brand.shortTagline}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  tagline: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.families.bodySemiBold,
    fontSize: theme.typography.sizes.xs,
    letterSpacing: theme.typography.letterSpacing.uppercase,
    textTransform: 'uppercase',
    color: theme.colors.champagne,
  },
});
