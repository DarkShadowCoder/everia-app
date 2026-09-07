// src/components/event/MediaGrid.js
import React from 'react';
import { FlatList, Pressable, StyleSheet, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import { mediaThumbnail } from '@/lib/storage';
import { mapModerationStatus } from '@/lib/format';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MediaGrid({ data, onPressItem, columns = theme.media.grid.columns, ListHeaderComponent, onEndReached, refreshing, onRefresh, ListEmptyComponent }) {
  const gap = theme.media.grid.gap;
  const size = (SCREEN_WIDTH - theme.layout.screenHorizontal * 2 - gap * (columns - 1)) / columns;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      numColumns={columns}
      columnWrapperStyle={{ gap }}
      contentContainerStyle={{ gap, paddingBottom: 40 }}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <Pressable onPress={() => onPressItem?.(item)} style={{ width: size, height: size }}>
          <Image source={{ uri: mediaThumbnail(item) }} style={[StyleSheet.absoluteFillObject, { borderRadius: theme.media.grid.radius }]} contentFit="cover" transition={150} />
          {item.media_type === 'video' && (
            <View style={styles.videoBadge}>
              <Ionicons name="play" size={12} color="white" />
            </View>
          )}
          {mapModerationStatus(item.moderation_status) === 'pending' && (
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={11} color="white" />
            </View>
          )}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  videoBadge: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  pendingBadge: { position: 'absolute', top: 6, left: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(200,149,75,0.9)', alignItems: 'center', justifyContent: 'center' },
});
