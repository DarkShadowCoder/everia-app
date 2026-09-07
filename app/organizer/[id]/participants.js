// app/organizer/[id]/participants.js
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import theme from '@/theme';
import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import ParticipantRow from '@/components/event/ParticipantRow';
import EmptyState from '@/components/ui/EmptyState';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { avatarUrl } from '@/lib/storage';
import { fetchProfilesByIds } from '@/lib/profiles';

export default function OrganizerParticipants() {
  const { id } = useLocalSearchParams();
  const [search, setSearch] = useState('');

  const { data: members, isLoading, refresh } = useSupabaseQuery(async () => {
    // event_members.user_id référence auth.users, pas public.profiles :
    // le nom est déjà dupliqué sur `display_name` à l'adhésion, l'avatar en
    // revanche doit être récupéré séparément (voir lib/profiles.js).
    const { data, error } = await supabase
      .from('event_members')
      .select('*')
      .eq('event_id', id)
      .eq('status', 'joined')
      .order('created_at', { ascending: true });
    if (error) throw error;
    const profilesById = await fetchProfilesByIds((data || []).map((m) => m.user_id));
    return (data || []).map((m) => ({
      ...m,
      display_name: m.display_name || profilesById[m.user_id]?.display_name,
      avatarUrl: avatarUrl(profilesById[m.user_id]?.avatar_path),
    }));
  }, [id]);

  const filtered = (members || []).filter((m) => (m.display_name || '').toLowerCase().includes(search.toLowerCase()));

  const handleMore = (member) => {
    Alert.alert(member.display_name || 'Participant', 'Choisir une action', [
      { text: 'Promouvoir modérateur', onPress: () => updateRole(member, 'moderator') },
      { text: 'Retirer de l’événement', style: 'destructive', onPress: () => removeMember(member) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const updateRole = async (member, role) => {
    await supabase.from('event_members').update({ role }).eq('event_id', id).eq('user_id', member.user_id);
    refresh();
  };

  const removeMember = async (member) => {
    await supabase.from('event_members').update({ status: 'removed' }).eq('event_id', id).eq('user_id', member.user_id);
    refresh();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Participants" rightActions={[{ icon: 'person-add-outline', onPress: () => router.push(`/event/${id}/invite`) }]} />
      <View style={{ paddingHorizontal: theme.layout.screenHorizontal, marginBottom: theme.spacing.md }}>
        <Input value={search} onChangeText={setSearch} placeholder="Rechercher un participant..." icon="search-outline" />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.user_id}
        refreshing={isLoading}
        onRefresh={refresh}
        contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontal, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? <EmptyState icon="people-outline" title="Aucun participant" /> : null}
        renderItem={({ item }) => <ParticipantRow member={item} onMorePress={() => handleMore(item)} />}
      />
    </View>
  );
}
