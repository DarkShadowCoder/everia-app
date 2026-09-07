// src/components/ui/ProgressRing.js
// Anneau de progression SVG — utilisé pour le niveau de gamification
// (Memory Hunter Lv.12, etc) et les indicateurs circulaires d'analytics.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import theme from '@/theme';

export default function ProgressRing({
  size = 120,
  strokeWidth = 10,
  progress = 0, // 0..1
  trackColor = theme.gamification.levelRing.outer,
  progressColor = theme.gamification.levelRing.progress,
  centerColor = theme.gamification.levelRing.center,
  label,
  sublabel,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          stroke={trackColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={progressColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        {label && <Text style={styles.label}>{label}</Text>}
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: theme.typography.families.displaySemiBold, fontSize: 26, color: theme.colors.white },
  sublabel: { fontFamily: theme.typography.families.bodyMedium, fontSize: 11, color: theme.colors.champagneLight, marginTop: 2 },
});
