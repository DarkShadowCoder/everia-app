// app/organizer/[id]/moderation.js
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import theme from '@/theme';
import Header from '@/components/ui/Header';
import ModerationCard from '@/components/organizer/ModerationCard';
import EmptyState from '@/components/ui/EmptyState';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { supabase } from '@/lib/supabase';
import { fetchProfilesByIds } from '@/lib/profiles';

export default function OrganizerModeration() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);

  const { data: pendingMedia, isLoading, refresh, setData } = useSupabaseQuery(async () => {
    // media.uploader_user_id référence auth.users, pas public.profiles :
    // profil récupéré séparément (voir lib/profiles.js). uploader_guest_id
    // référence bien public.guest_profiles directement, embed valide.
    const { data, error } = await supabase
      .from('media')
      .select('*, guest:uploader_guest_id(display_name)')
      .eq('event_id', id)
      // moderation_status utilise l'enum Postgres 'not_checked' | 'review' |
      // 'safe' | 'blocked' | 'approved' — la file d'attente organisateur
      // couvre les médias pas encore vérifiés ou signalés pour revue.
      .in('moderation_status', ['not_checked', 'review'])
      .order('created_at', { ascending: true });
    if (error) throw error;
    const profilesById = await fetchProfilesByIds((data || []).map((m) => m.uploader_user_id));
    return (data || []).map((m) => ({ ...m, uploader_name: profilesById[m.uploader_user_id]?.display_name || m.guest?.display_name }));
  }, [id]);

  const moderate = async (media, decision) => {
    setData((current) => (current || []).filter((m) => m.id !== media.id));
    // NOTE : la table `media` n'a pas de colonnes moderated_by/moderated_at —
    // ces informations d'audit peuvent être ajoutées dans `moderation_result`
    // (jsonb) si un historique de modération est nécessaire côté backend.
    const { error } = await supabase
      .from('media')
      .update({
        moderation_status: decision === 'approved' ? 'approved' : 'blocked',
        status: decision === 'approved' ? 'published' : 'rejected',
        moderation_result: { decided_by: user?.id, decided_at: new Date().toISOString() },
      })
      .eq('id', media.id);
    if (error) {
      showToast(error.message, 'error');
      refresh();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Modération" />
      <FlatList
        data={pendingMedia}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={refresh}
        contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontal, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? <EmptyState icon="shield-checkmark-outline" title="Tout est à jour" subtitle="Aucun média en attente de modération." /> : null}
        renderItem={({ item }) => (
          <ModerationCard
            media={item}
            onPress={() => router.push(`/event/${id}/media/${item.id}`)}
            onApprove={() => moderate(item, 'approved')}
            onReject={() => moderate(item, 'rejected')}
          />
        )}
      />
    </View>
  );
}
