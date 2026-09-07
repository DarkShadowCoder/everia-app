// src/components/event/ParticipantRow.js
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import theme from '@/theme';

export default function ParticipantRow({ member, onPress, onMorePress }) {
  const roleSpec = theme.helpers.getRole(member.role);
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Avatar uri={member.avatarUrl} name={member.display_name} size="md" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name} numberOfLines={1}>{member.display_name || 'Participant'}</Text>
        <View style={styles.badgeRow}>
          <Badge label={roleSpec.label} backgroundColor={roleSpec.backgroundColor} textColor={roleSpec.color} size="sm" />
        </View>
      </View>
      {onMorePress ? (
        <Pressable onPress={onMorePress} hitSlop={10}>
          <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.textMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  name: { fontFamily: theme.typography.families.bodySemiBold, fontSize: 14, color: theme.colors.textPrimary },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
});
