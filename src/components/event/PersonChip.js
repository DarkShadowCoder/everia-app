// src/components/event/PersonChip.js
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import theme from '@/theme';

export default function PersonChip({ person, onPress, selected = false }) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Avatar uri={person.avatarUrl} name={person.display_name} size="lg" ring={selected} />
      <Text numberOfLines={1} style={styles.name}>{person.display_name || 'Invité'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 72, marginRight: theme.spacing.md },
  name: { marginTop: 6, fontFamily: theme.typography.families.bodyMedium, fontSize: 11, color: theme.colors.textPrimary, textAlign: 'center' },
});
