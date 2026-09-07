// src/components/ui/ProgressBar.js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/theme';

export default function ProgressBar({ progress = 0, height = 8, trackColor, fillGradient = theme.gradients.gold, style }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor || theme.challenges.progressTrack }, style]}>
      <LinearGradient
        colors={fillGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${clamped * 100}%`, height: '100%', borderRadius: height / 2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
