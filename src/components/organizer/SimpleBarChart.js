// src/components/organizer/SimpleBarChart.js
// Mini graphique en barres sans dépendance externe (React Native
// Views), pour l'écran Analytics de l'organisateur.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '@/theme';

export default function SimpleBarChart({ data = [], height = 140, valueKey = 'value', labelKey = 'label' }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey] || 0));
  return (
    <View style={[styles.container, { height }]}>
      {data.map((d, idx) => {
        const barHeight = Math.max(4, (d[valueKey] / max) * (height - 28));
        return (
          <View key={idx} style={styles.column}>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height: barHeight }]} />
            </View>
            <Text style={styles.label} numberOfLines={1}>{d[labelKey]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  column: { flex: 1, alignItems: 'center' },
  barTrack: { width: '60%', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '100%', borderRadius: theme.charts.bar.radius, backgroundColor: theme.organizer.analytics.lineColor },
  label: { marginTop: 6, fontSize: theme.charts.axis.fontSize, color: theme.charts.axis.color, fontFamily: theme.typography.families.body },
});
