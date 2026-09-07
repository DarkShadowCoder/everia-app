// app/profile/achievements.js
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import theme from '@/theme';
import Header from '@/components/ui/Header';
import EmptyState from '@/components/ui/EmptyState';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { publicMediaUrl } from '@/lib/storage';
import { formatShortDate } from '@/lib/format';

export default function Achievements() {
  const { user } = useAuthStore();

  const { data: badges, isLoading, refresh } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*, badges(*), events(name)')
      .eq('user_id', user?.id)
      .order('unlocked_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [user?.id]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Mes badges" />
      <FlatList
        data={badges}
        keyExtractor={(item) => item.id}
        numColumns={2}
        refreshing={isLoading}
        onRefresh={refresh}
        columnWrapperStyle={{ gap: theme.spacing.md }}
        contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontal, paddingBottom: 40, gap: theme.spacing.md }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? <EmptyState icon="ribbon-outline" title="Aucun badge encore" subtitle="Participez aux défis de vos événements pour en débloquer." /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              {item.badges?.icon_path ? (
                <Image source={{ uri: publicMediaUrl(item.badges.icon_path) }} style={{ width: 32, height: 32 }} contentFit="contain" />
              ) : (
                <Ionicons name="ribbon" size={26} color={theme.colors.champagneDark} />
              )}
            </View>
            <Text style={styles.label} numberOfLines={2}>{item.badges?.name}</Text>
            <Text style={styles.event} numberOfLines={1}>{item.events?.name}</Text>
            <Text style={styles.date}>{formatShortDate(item.unlocked_at)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: theme.cards.gold.backgroundColor, borderColor: theme.cards.gold.borderColor, borderWidth: 1, borderRadius: theme.cards.gold.borderRadius, padding: theme.spacing.lg, alignItems: 'center' },
  iconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: theme.colors.champagnePale, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm },
  label: { fontFamily: theme.typography.families.bodySemiBold, fontSize: 12.5, color: theme.colors.textPrimary, textAlign: 'center' },
  event: { fontFamily: theme.typography.families.body, fontSize: 10.5, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
  date: { fontFamily: theme.typography.families.body, fontSize: 10, color: theme.colors.textMuted, marginTop: 2 },
});
