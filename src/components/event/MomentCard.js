// src/components/event/MomentCard.js
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/theme';
import { mediaThumbnail } from '@/lib/storage';
import { formatTime } from '@/lib/format';

export default function MomentCard({ moment, coverMedia, mediaCount = 0, onPress }) {
  const cover = coverMedia ? mediaThumbnail(coverMedia) : null;
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {cover ? (
        <Image source={{ uri: cover }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.moments.card.backgroundColor }]} />
      )}
      <LinearGradient colors={['transparent', theme.moments.imageOverlay, 'rgba(29,11,31,0.85)']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{moment.title || 'Moment'}</Text>
        <Text style={styles.meta}>
          {moment.starts_at ? formatTime(moment.starts_at) : ''}{mediaCount ? `  ·  ${mediaCount} médias` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 170, height: 210, borderRadius: theme.moments.card.borderRadius, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: theme.colors.surfaceDark2 },
  content: { padding: theme.spacing.md },
  title: { color: theme.moments.titleColor, fontFamily: theme.typography.families.displaySemiBold, fontSize: 16 },
  meta: { color: theme.moments.metaColor, fontFamily: theme.typography.families.body, fontSize: 11, marginTop: 2 },
});
