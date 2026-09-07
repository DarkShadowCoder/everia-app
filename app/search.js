// app/search.js
import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import theme from '@/theme';
import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import EventCard from '@/components/event/EventCard';
import EmptyState from '@/components/ui/EmptyState';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export default function Search() {
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');

  const { data: results, isLoading } = useSupabaseQuery(
    async () => {
      if (!query.trim()) return [];
      // Filtrer sur une colonne d'une relation embarquée (events.name) via les
      // méthodes fluent de supabase-js n'est fiable qu'avec un embed !inner ;
      // on récupère donc les événements de l'utilisateur puis on filtre côté
      // client, plus simple et robuste pour ce volume de données.
      const { data, error } = await supabase.from('event_members').select('events(*)').eq('user_id', user?.id);
      if (error) throw error;
      const needle = query.trim().toLowerCase();
      return (data || [])
        .map((m) => m.events)
        .filter((event) => event && event.name?.toLowerCase().includes(needle));
    },
    [query, user?.id]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Rechercher" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: theme.layout.screenHorizontal, marginBottom: theme.spacing.lg }}>
        <Input value={query} onChangeText={setQuery} placeholder="Nom d'un événement..." icon="search-outline" autoFocus />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontal, gap: theme.spacing.md, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading && query.trim() ? <EmptyState icon="search-outline" title="Aucun résultat" subtitle={`Aucun événement ne correspond à "${query}".`} /> : null
        }
        renderItem={({ item }) => <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />}
      />
    </View>
  );
}
