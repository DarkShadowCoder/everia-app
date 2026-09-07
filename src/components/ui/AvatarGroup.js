// src/components/ui/AvatarGroup.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import theme from '@/theme';

export default function AvatarGroup({ people = [], size = 'sm', max = 4 }) {
  const visible = people.slice(0, max);
  const extra = people.length - visible.length;
  const dim = { xs: 24, sm: theme.layout.avatarSmall, md: theme.layout.avatarMedium }[size] || 32;

  return (
    <View style={styles.row}>
      {visible.map((p, idx) => (
        <View key={p.id ?? idx} style={{ marginLeft: idx === 0 ? 0 : theme.components.avatarGroup.overlap, zIndex: visible.length - idx }}>
          <Avatar uri={p.avatarUrl} name={p.name} size={size} style={{ borderWidth: theme.components.avatarGroup.borderWidth, borderColor: theme.components.avatarGroup.borderColor }} />
        </View>
      ))}
      {extra > 0 && (
        <View
          style={[
            styles.extra,
            {
              width: dim,
              height: dim,
              borderRadius: dim / 2,
              marginLeft: theme.components.avatarGroup.overlap,
            },
          ]}
        >
          <Text style={styles.extraText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  extra: {
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.components.avatarGroup.borderWidth,
    borderColor: theme.components.avatarGroup.borderColor,
  },
  extraText: { color: theme.colors.white, fontFamily: theme.typography.families.bodySemiBold, fontSize: 11 },
});
