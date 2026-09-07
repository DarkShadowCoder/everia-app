// app/event/[id]/moment/[momentId].js
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import theme from '@/theme';
import Header from '@/components/ui/Header';
import MediaGrid from '@/components/event/MediaGrid';
import AvatarGroup from '@/components/ui/AvatarGroup';
import EmptyState from '@/components/ui/EmptyState';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { formatEventDate } from '@/lib/format';

export default function MomentDetail() {
  const { id, momentId } = useLocalSearchParams();

  const { data: moment } = useSupabaseQuery(async () => {
    const { data, error } = await supabase.from('moments').select('*').eq('id', momentId).single();
    if (error) throw error;
    return data;
  }, [momentId]);

  const { data: media, isLoading, refresh } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('moment_media')
      .select('media(*)')
      .eq('moment_id', momentId);
    if (error) throw error;
    return (data || []).map((row) => row.media).filter(Boolean);
  }, [momentId]);

  const { data: people } = useSupabaseQuery(async () => {
    const { data } = await supabase
      .from('moment_people')
      .select('person:person_id(display_name, avatar_path)')
      .eq('moment_id', momentId)
      .limit(8);
    return (data || []).map((row) => ({ name: row.person?.display_name, avatarUrl: row.person?.avatar_path }));
  }, [momentId]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.screens.moment }}>
      <Header title={moment?.title || 'Moment'} dark />
      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontal, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {moment ? (
          <View style={styles.headerBlock}>
            <Text style={styles.time}>{moment.starts_at ? formatEventDate(moment.starts_at) : ''}</Text>
            {moment.description ? <Text style={styles.description}>{moment.description}</Text> : null}
            {people?.length ? (
              <View style={{ marginTop: theme.spacing.md }}>
                <AvatarGroup people={people} size="sm" />
              </View>
            ) : null}
          </View>
        ) : null}

        {media?.length ? (
          <MediaGrid data={media} onPressItem={(m) => router.push(`/event/${id}/media/${m.id}`)} />
        ) : (
          !isLoading && <EmptyState dark icon="images-outline" title="Aucun média associé" />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: { marginBottom: theme.spacing.lg },
  time: { color: theme.colors.champagneLight, fontFamily: theme.typography.families.bodyMedium, fontSize: 12 },
  description: { color: theme.colors.textOnDark, opacity: 0.75, fontFamily: theme.typography.families.body, fontSize: 13.5, lineHeight: 20, marginTop: 6 },
});
