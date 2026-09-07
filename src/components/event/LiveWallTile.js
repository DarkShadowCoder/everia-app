// src/components/event/LiveWallTile.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/theme';
import { mediaThumbnail } from '@/lib/storage';

export default function LiveWallTile({ media, showName = true }) {
  return (
    <View style={styles.tile}>
      <Image source={{ uri: mediaThumbnail(media) }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={250} />
      {showName && media.uploader_name ? (
        <LinearGradient colors={['transparent', 'rgba(22,10,24,0.85)']} style={styles.overlay}>
          <Text style={styles.name} numberOfLines={1}>{media.uploader_name}</Text>
        </LinearGradient>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, aspectRatio: 1, borderRadius: theme.liveWall.tileRadius, overflow: 'hidden', margin: 3, backgroundColor: theme.colors.surfaceDark2 },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 8 },
  name: { color: 'white', fontFamily: theme.typography.families.bodySemiBold, fontSize: 10 },
});
