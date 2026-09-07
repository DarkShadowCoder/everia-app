// src/components/event/EventCard.js
// Carte événement utilisée dans la liste "Mes événements" et la Home.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import EventStatusBadge from './EventStatusBadge';
import { mediaThumbnail } from '@/lib/storage';
import { formatEventDate } from '@/lib/format';

export default function EventCard({ event, onPress, compact = false }) {
  const cover = event.cover_path ? mediaThumbnail({ display_path: event.cover_path }) : null;
  const typeSpec = theme.helpers.getEventType(event.category);

  return (
    <Pressable onPress={onPress} style={[styles.card, compact && { height: 150 }]}>
      {cover ? (
        <Image source={{ uri: cover }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
      ) : (
        <LinearGradient colors={theme.gradients.luxury} style={StyleSheet.absoluteFillObject} />
      )}
      <LinearGradient colors={theme.gradients.eventHero} style={StyleSheet.absoluteFillObject} />

      <View style={styles.topRow}>
        <EventStatusBadge status={event.status} />
        {event.live_wall_enabled && event.status === 'live' && (
          <View style={styles.liveDot} />
        )}
      </View>

      <View style={styles.bottom}>
        <View style={styles.typeRow}>
          <Ionicons name={typeSpec.icon} size={12} color={theme.colors.champagneLight} />
          <Text style={styles.typeLabel}>{typeSpec.label}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>{event.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatEventDate(event.start_at)}
          {event.venue_name ? `  ·  ${event.venue_name}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: theme.event.cardHeight,
    borderRadius: theme.radius.cardLarge,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryDark,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.eventLive, borderWidth: 2, borderColor: 'white' },
  bottom: {},
  typeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  typeLabel: { color: theme.colors.champagneLight, fontFamily: theme.typography.families.bodySemiBold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginLeft: 5 },
  title: { color: theme.colors.white, fontFamily: theme.typography.families.displaySemiBold, fontSize: 20 },
  meta: { color: theme.colors.white, opacity: 0.75, fontFamily: theme.typography.families.body, fontSize: 12, marginTop: 2 },
});
