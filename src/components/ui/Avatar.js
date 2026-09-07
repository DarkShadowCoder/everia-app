// src/components/ui/Avatar.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import theme from '@/theme';
import { initialsFromName } from '@/lib/format';

export default function Avatar({ uri, name, size = 'md', ring = false, style }) {
  const dim =
    typeof size === 'number'
      ? size
      : { xs: 24, sm: theme.layout.avatarSmall, md: theme.layout.avatarMedium, lg: theme.layout.avatarLarge, xl: theme.layout.avatarXL, xxl: theme.layout.avatarXXL }[
          size
        ];

  return (
    <View
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          borderWidth: ring ? theme.profile.avatar.borderWidth : 0,
          borderColor: theme.profile.avatar.borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.primarySoft,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
      ) : (
        <Text
          style={{
            fontFamily: theme.typography.families.bodySemiBold,
            color: theme.colors.textPlum,
            fontSize: dim * 0.38,
          }}
        >
          {initialsFromName(name)}
        </Text>
      )}
    </View>
  );
}
